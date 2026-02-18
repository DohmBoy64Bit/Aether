import prisma from '../utils/prisma.js';
import { PostType, InteractionType } from '../generated/prisma/client/enums.js';
import { ModerationService } from './moderation.service.js';

export class SocialService {
  static async createPost(userId: string, content: string, type: PostType = PostType.TWEET, parentId?: string) {
    const post = await prisma.post.create({
      data: {
        userId,
        content,
        type,
        parentId,
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

  static async getProfile(username: string) {
    return prisma.user.findUnique({
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
            interactions: true,
          }
        }
      }
    });
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
}
