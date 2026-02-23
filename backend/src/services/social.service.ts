import prisma from '../utils/prisma.js';
import { PostType, InteractionType } from '../generated/prisma/client/index.js';
import { ModerationService } from './moderation.service.js';

function injectInteractionCounts(post: any) {
  if (!post) return post;
  if (post.interactions) {
    post.likesCount = post.interactions.filter((i: any) => i.type === 'LIKE').length;
    post.retweetsCount = post.interactions.filter((i: any) => i.type === 'RETWEET').length;
    delete post.interactions;
  } else {
    post.likesCount = 0;
    post.retweetsCount = 0;
  }
  if (post.parent) injectInteractionCounts(post.parent);
  if (post.children) post.children.forEach(injectInteractionCounts);
  return post;
}

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
        },
        interactions: {
          select: { type: true, userId: true }
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

    return injectInteractionCounts(post);
  }

  static async getFeed(limit = 20, offset = 0) {
    const posts = await prisma.post.findMany({
      where: {
        flagged: false,
        OR: [
          { parentId: null }, // Top level posts
          { type: PostType.RETWEET } // And retweets
        ]
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
        parent: {
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
            },
            interactions: {
              select: { type: true, userId: true }
            }
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        },
        interactions: {
          select: { type: true, userId: true }
        }
      }
    });

    return posts.map(injectInteractionCounts);
  }

  static async getPostsByTag(tag: string, limit = 20, offset = 0) {
    const posts = await prisma.post.findMany({
      where: {
        flagged: false,
        content: {
          contains: tag
        }
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
        parent: {
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
            },
            interactions: {
              select: { type: true, userId: true }
            }
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        },
        interactions: {
          select: { type: true, userId: true }
        }
      }
    });

    return posts.map(injectInteractionCounts);
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
      },
      interactions: {
        select: { type: true, userId: true }
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
                profileImage: true,
                isAi: true,
              }
            },
            _count: {
              select: {
                interactions: true,
                children: true,
              }
            },
            interactions: {
              select: { type: true, userId: true }
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
              include: {
                ...childInclude,
                children: {
                  where: { flagged: false },
                  orderBy: { createdAt: 'asc' },
                  include: {
                    ...childInclude,
                    children: {
                      where: { flagged: false },
                      orderBy: { createdAt: 'asc' },
                      include: childInclude,
                    }
                  }
                }
              },
            },
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        },
        interactions: {
          select: { type: true, userId: true }
        }
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
      case 'likes':
        // For likes, we find the interactions of type LIKE by this user,
        // and return the associated posts.
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
          include: {
            user: {
              select: {
                id: true,
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
            },
            interactions: {
              select: { type: true, userId: true }
            }
          }
        });

        return posts.map(injectInteractionCounts);
      default:
        whereClause.parentId = null; // Default to posts
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
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
                profileImage: true,
                isAi: true,
              }
            },
            _count: {
              select: {
                interactions: true,
                children: true,
              }
            },
            interactions: {
              select: { type: true, userId: true }
            }
          }
        },
        _count: {
          select: {
            interactions: true,
            children: true,
          }
        },
        interactions: {
          select: { type: true, userId: true }
        }
      }
    });

    return posts.map(injectInteractionCounts);
  }

  static async interact(userId: string, postId: string, type: InteractionType) {
    const existing = await prisma.interaction.findUnique({
      where: {
        userId_postId_type: {
          userId,
          postId,
          type,
        }
      }
    });

    if (existing) {
      await prisma.interaction.delete({
        where: { id: existing.id }
      });

      if (type === InteractionType.RETWEET) {
        await prisma.post.deleteMany({
          where: {
            userId,
            type: PostType.RETWEET,
            parentId: postId
          }
        });
      }

      return { action: 'removed', type };
    } else {
      await prisma.interaction.create({
        data: {
          userId,
          postId,
          type,
        }
      });

      if (type === InteractionType.RETWEET) {
        await prisma.post.create({
          data: {
            userId,
            type: PostType.RETWEET,
            parentId: postId,
            content: '',
          }
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
    return prisma.post.findMany({
      where: {
        OR: [
          { userId },
          { user: { followers: { some: { followerId: userId } } } }
        ],
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

  static async searchUsers(query: string) {
    return prisma.user.findMany({
      where: {
        username: {
          contains: query,
        },
      },
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
    // 1. Fetch recent posts to analyze for trends
    const recentPosts = await prisma.post.findMany({
      take: 100, // Look at the last 100 posts for trending
      orderBy: { createdAt: 'desc' },
      select: { content: true }
    });

    // 2. Extract and count hashtags
    const hashtagCounts: Record<string, number> = {};
    const hashtagRegex = /#[\w]+/g;

    recentPosts.forEach(post => {
      const tags = post.content?.match(hashtagRegex) || [];
      // Use Set to only count each tag once per post
      const uniqueTags = new Set(tags.map(t => t.toLowerCase()));

      uniqueTags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    // 3. Sort by popularity and get the top 4 real trends
    const sortedTags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    // 4. Map to the expected UI format, or provide fallbacks if no tags exist
    const dynamicTrends = sortedTags.map(([tag, count], index) => {
      // Assign a pseudo-category based on rank just for UI variety
      const topics = ["Trending Worldwide", "Technology", "Gaming", "Entertainment"];
      return {
        topic: topics[index % topics.length],
        tag: tag, // Keep the # symbol
        posts: `${count} recent posts`
      };
    });

    // 5. Fill remaining slots with platform stats if not enough hashtags exist 
    //    (Useful for empty or newly wiped databases)
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
          followers: {
            none: { followerId: userId }
          }
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
          some: {
            userId: userId,
            type: 'SAVE' as any,
          }
        },
        flagged: false
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, username: true, profileImage: true, isAi: true } },
        _count: { select: { children: true, interactions: true } }
      }
    });
  }

  static async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return prisma.interaction.findMany({
      where: {
        post: { userId: userId },
        userId: { not: userId }
      },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, username: true, profileImage: true, isAi: true } },
        post: { select: { id: true, content: true } }
      }
    });
  }
}

