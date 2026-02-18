import prisma from '../utils/prisma.js';
import { PostType, InteractionType } from '../generated/prisma/client/index.js';
import { ModerationService } from './moderation.service.js';

export class SocialService {
  static async createPost(userId: string, content: string, type: PostType = PostType.TWEET, parentId?: string, media?: string | null) {
    const post = await prisma.post.create({
      data: {
        userId,
        content,
        type,
        parentId,
        media: media || null,
      },
      include: {
        user: {
          select: {
            username: true,
            profileImage: true,
            isAi: true,
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        }
      }
    });

    // Run moderation in background or foreground.
    // Given it's an AI site, let's at least trigger it.
    // For now, let's await it to ensure it's moderated before we say it's created,
    // although this might be slow with LLMs.
    // If the user wants speed, we could do it in background.
    ModerationService.handleModeration(post.id, post.content).catch(err => {
      console.error(`Moderation failed for post ${post.id}:`, err);
    });

    return post;
  }

  static async getFeed(limit = 20, offset = 0) {
    return prisma.post.findMany({
      where: {
        flagged: false,
        parentId: null, // Only top-level posts, not replies
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            username: true,
            profileImage: true,
            isAi: true,
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        }
      }
    });
  }

  static async getPost(postId: string) {
    const childInclude = {
      user: {
        select: {
          username: true,
          profileImage: true,
          isAi: true,
        }
      },
      _count: {
        select: {
          interactions: true,
          children: true,
        }
      }
    };

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            username: true,
            profileImage: true,
            isAi: true,
          }
        },
        parent: {
          include: {
            user: {
              select: {
                username: true,
              }
            }
          }
        },
        children: {
          where: { flagged: false },
          orderBy: { createdAt: 'asc' },
          include: {
            ...childInclude,
            children: {
              where: { flagged: false },
              orderBy: { createdAt: 'asc' },
              include: childInclude,
            },
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        }
      }
    });

    if (post && post.flagged) {
      return null;
    }

    return post;
  }

  static async interact(userId: string, postId: string, type: InteractionType) {
    return prisma.interaction.upsert({
      where: {
        userId_postId_type: {
          userId,
          postId,
          type,
        }
      },
      update: {},
      create: {
        userId,
        postId,
        type,
      }
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
      const follow = await (prisma as any).follow.findUnique({
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
      update: {
        personality,
        interests,
      },
      create: {
        userId,
        personality,
        interests,
      }
    });
  }

  static async followUser(followerId: string, followingId: string) {
    return prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        }
      },
      update: {},
      create: {
        followerId,
        followingId,
      }
    });
  }

  static async unfollowUser(followerId: string, followingId: string) {
    return prisma.follow.deleteMany({
      where: {
        followerId,
        followingId,
      }
    });
  }

  static async getFollowers(userId: string) {
    return prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          }
        }
      }
    });
  }

  static async getFollowing(userId: string) {
    return prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            profileImage: true,
          }
        }
      }
    });
  }

  static async getFollowingFeed(userId: string, limit: number = 20, offset: number = 0) {
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = following.map((f: any) => f.followingId);

    // Include user's own posts in the following feed? 
    // Usually yes on Bluesky/Twitter.
    followingIds.push(userId);

    return prisma.post.findMany({
      where: {
        userId: { in: followingIds },
        type: { in: [PostType.TWEET, PostType.RETWEET] } // Optional: decide if replies show in main feed
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profileImage: true,
            isAi: true
          }
        },
        _count: {
          select: {
            children: true,
            interactions: true,
          }
        }
      }
    });
  }
}
