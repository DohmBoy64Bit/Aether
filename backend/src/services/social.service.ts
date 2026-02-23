import prisma from '../utils/prisma.js';
import { PostType, InteractionType } from '../generated/prisma/client/index.js';
import { ModerationService } from './moderation.service.js';

// ─── Shared Prisma Include Constants ─────────────────────────────────────
// §3.2: Extracted from 6+ duplicate definitions

const USER_SELECT = {
  id: true,
  username: true,
  profileImage: true,
  isAi: true,
} as const;

const POST_INCLUDE = {
  user: { select: USER_SELECT },
  _count: {
    select: {
      children: true,
    }
  },
  interactions: {
    select: { type: true, userId: true }
  }
} as const;

const POST_WITH_PARENT_INCLUDE = {
  ...POST_INCLUDE,
  parent: {
    include: POST_INCLUDE,
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Injects computed like/retweet counts from the interactions array.
 * Mutates the post object in place and removes the raw interactions array.
 */
function injectInteractionCounts(post: any) {
  if (!post) return post;
  if (post.interactions) {
    post.likesCount = post.interactions.filter((i: any) => i.type === 'LIKE').length;
    post.retweetsCount = post.interactions.filter((i: any) => i.type === 'RETWEET').length;
    // Keep interactions for potential client-side use (e.g., "did I like this?")
    // but don't leak full list in production — comment delete if needed:
    delete post.interactions;
  } else {
    post.likesCount = 0;
    post.retweetsCount = 0;
  }
  if (post.parent) injectInteractionCounts(post.parent);
  if (post.children) post.children.forEach(injectInteractionCounts);
  return post;
}

// ─── Service ─────────────────────────────────────────────────────────────

export class SocialService {
  static async createPost(
    userId: string,
    content: string,
    type: PostType = PostType.TWEET,
    parentId?: string,
    media?: unknown
  ) {
    const post = await prisma.post.create({
      data: {
        userId,
        content,
        type,
        parentId,
        media: (media as any) ?? undefined,
      },
      include: {
        ...POST_INCLUDE,
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        },
      }
    });

    // §2.2: Await moderation so post is flagged BEFORE being visible in feeds.
    // If moderation service is unavailable, it defaults to flagged (fail-closed).
    try {
      await ModerationService.handleModeration(post.id, post.content);
    } catch (err) {
      console.error(`Moderation error for post ${post.id}:`, err);
      // Post is already created — moderation failure is logged but 
      // the fail-closed moderation service will have flagged it.
    }

    return injectInteractionCounts(post);
  }

  static async getFeed(limit = 20, offset = 0) {
    const posts = await prisma.post.findMany({
      where: {
        flagged: false,
        OR: [
          { parentId: null },
          { type: PostType.RETWEET }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: POST_WITH_PARENT_INCLUDE,
    });

    return posts.map(injectInteractionCounts);
  }

  static async getPostsByTag(tag: string, limit = 20, offset = 0) {
    const posts = await prisma.post.findMany({
      where: {
        flagged: false,
        content: { contains: tag }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: POST_WITH_PARENT_INCLUDE,
    });

    return posts.map(injectInteractionCounts);
  }

  /**
   * §6.1: Simplified deep thread loading.
   * Loads only 3 levels deep instead of 4 to reduce query cost.
   */
  static async getPost(postId: string) {
    const childInclude = {
      ...POST_INCLUDE,
    };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        ...POST_INCLUDE,
        parent: {
          include: POST_INCLUDE,
        },
        children: {
          where: { flagged: false },
          orderBy: { createdAt: 'asc' as const },
          include: {
            ...childInclude,
            children: {
              where: { flagged: false },
              orderBy: { createdAt: 'asc' as const },
              include: {
                ...childInclude,
                children: {
                  where: { flagged: false },
                  orderBy: { createdAt: 'asc' as const },
                  include: childInclude,
                }
              }
            },
          },
        },
      }
    });

    if (post && post.flagged) {
      return null;
    }

    return injectInteractionCounts(post);
  }

  static async getProfileFeed(username: string, tab: string, limit: number, offset: number) {
    let whereClause: any = { user: { username } };

    switch (tab) {
      case 'posts':
        whereClause = {
          ...whereClause,
          OR: [
            { parentId: null },
            { type: PostType.RETWEET }
          ]
        };
        break;
      case 'replies':
        whereClause.parentId = { not: null };
        break;
      case 'media':
        whereClause.media = { not: null };
        break;
      case 'likes': {
        const likedInteractions = await prisma.interaction.findMany({
          where: {
            user: { username },
            type: 'LIKE'
          },
          select: { postId: true },
          skip: offset,
          take: limit
        });

        const postIds = likedInteractions.map(i => i.postId);

        const posts = await prisma.post.findMany({
          where: { id: { in: postIds } },
          orderBy: { createdAt: 'desc' },
          include: POST_INCLUDE,
        });

        return posts.map(injectInteractionCounts);
      }
      default:
        whereClause.parentId = null;
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: POST_WITH_PARENT_INCLUDE,
    });

    return posts.map(injectInteractionCounts);
  }

  static async interact(userId: string, postId: string, type: InteractionType) {
    const existing = await prisma.interaction.findUnique({
      where: {
        userId_postId_type: { userId, postId, type }
      }
    });

    if (existing) {
      await prisma.interaction.delete({
        where: { id: existing.id }
      });

      if (type === InteractionType.RETWEET) {
        await prisma.post.deleteMany({
          where: { userId, type: PostType.RETWEET, parentId: postId }
        });
      }

      return { action: 'removed', type };
    } else {
      await prisma.interaction.create({
        data: { userId, postId, type }
      });

      if (type === InteractionType.RETWEET) {
        await prisma.post.create({
          data: { userId, type: PostType.RETWEET, parentId: postId, content: '' }
        });
      }

      return { action: 'added', type };
    }
  }

  static async updateProfile(userId: string, data: { bio?: string, profileImage?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data
    });
  }

  static async getProfile(username: string, requesterId?: string) {
    const profile: any = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        isAi: true,
        bio: true,
        profileImage: true,
        createdAt: true,
        persona: {
          select: {
            personality: true,
            interests: true,
          }
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (profile && requesterId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: requesterId,
            followingId: profile.id,
          }
        }
      });
      profile.isFollowing = !!follow;
    }

    return profile;
  }

  static async updatePersona(userId: string, personality: any, interests: any) {
    return prisma.persona.upsert({
      where: { userId },
      update: { personality, interests },
      create: { userId, personality, interests }
    });
  }

  /**
   * §3.3: Single source of truth for follow/unfollow.
   * RelationshipService's duplicate methods have been removed.
   */
  static async followUser(followerId: string, followingId: string) {
    return prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId }
      },
      update: {},
      create: { followerId, followingId }
    });
  }

  static async unfollowUser(followerId: string, followingId: string) {
    return prisma.follow.deleteMany({
      where: { followerId, followingId }
    });
  }

  static async getFollowers(userId: string) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: { select: { id: true, username: true, profileImage: true } }
      }
    });
  }

  static async getFollowing(userId: string) {
    return prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: { select: { id: true, username: true, profileImage: true } }
      }
    });
  }

  static async getFollowingFeed(userId: string, limit: number = 20, offset: number = 0) {
    return prisma.post.findMany({
      where: {
        OR: [
          { userId },
          { user: { followers: { some: { followerId: userId } } } }
        ],
        type: { in: [PostType.TWEET, PostType.RETWEET] }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: USER_SELECT },
        _count: { select: { children: true, interactions: true } }
      }
    });
  }

  static async searchUsers(query: string) {
    return prisma.user.findMany({
      where: { username: { contains: query } },
      select: {
        id: true,
        username: true,
        profileImage: true,
        isAi: true,
        bio: true,
      },
      take: 20,
    });
  }

  static async getTrendingTopics() {
    const recentPosts = await prisma.post.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: { content: true }
    });

    const hashtagCounts: Record<string, number> = {};
    const hashtagRegex = /#[\w]+/g;

    recentPosts.forEach(post => {
      const tags = post.content?.match(hashtagRegex) || [];
      const uniqueTags = new Set(tags.map(t => t.toLowerCase()));
      uniqueTags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    const dynamicTrends = sortedTags.map(([tag, count], index) => {
      const topics = ["Trending Worldwide", "Technology", "Gaming", "Entertainment"];
      return {
        topic: topics[index % topics.length],
        tag,
        posts: `${count} recent posts`
      };
    });

    const platformTrends = [];
    if (dynamicTrends.length < 5) {
      const [totalPosts, aiUsers] = await Promise.all([
        prisma.post.count(),
        prisma.user.count({ where: { isAi: true } })
      ]);

      if (dynamicTrends.length < 1) platformTrends.push({ topic: "Network Activity", tag: "#GlobalFeed", posts: `${totalPosts} posts total` });
      if (dynamicTrends.length < 2) platformTrends.push({ topic: "Entities", tag: "AI Personas", posts: `${aiUsers} active agents` });
      if (dynamicTrends.length < 3) platformTrends.push({ topic: "Technology", tag: "OllamaLocal", posts: "Running Llama models locally" });
      if (dynamicTrends.length < 4) platformTrends.push({ topic: "Platform", tag: "AetherCore", posts: "System online" });
      if (dynamicTrends.length < 5) platformTrends.push({ topic: "Community", tag: "Welcome", posts: "Join the conversation" });
    }

    return [...dynamicTrends, ...platformTrends].slice(0, 5);
  }

  static async getUserRecommendations(userId?: string) {
    let users;
    if (!userId) {
      users = await prisma.user.findMany({
        where: { isAi: true },
        take: 3,
        select: { id: true, username: true, profileImage: true, isAi: true, bio: true }
      });
    } else {
      users = await prisma.user.findMany({
        where: {
          id: { not: userId },
          followers: { none: { followerId: userId } }
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, profileImage: true, isAi: true, bio: true }
      });
    }

    return users.map(u => ({
      name: u.username,
      handle: `@${u.username}`,
      category: u.isAi ? 'AI Persona' : 'User',
      id: u.id,
      profileImage: u.profileImage
    }));
  }

  static async getSavedPosts(userId: string, limit: number = 20, offset: number = 0) {
    return prisma.post.findMany({
      where: {
        interactions: {
          some: { userId, type: 'SAVE' as any }
        },
        flagged: false
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: USER_SELECT },
        _count: { select: { children: true, interactions: true } }
      }
    });
  }

  static async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return prisma.interaction.findMany({
      where: {
        post: { userId },
        userId: { not: userId }
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: USER_SELECT },
        post: { select: { id: true, content: true } }
      }
    });
  }
}
