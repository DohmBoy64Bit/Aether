import prisma from '../utils/prisma.js';
import { PostType, InteractionType } from '../generated/prisma/client/enums.js';

export class SocialService {
  static async createPost(userId: string, content: string, type: PostType = PostType.TWEET, parentId?: string) {
    return prisma.post.create({
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

  static async getFeed(limit = 20, offset = 0) {
    return prisma.post.findMany({
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
    return prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            username: true,
            profileImage: true,
          }
        },
        children: {
          include: {
            user: {
              select: {
                username: true,
                profileImage: true,
              }
            },
            _count: {
              select: {
                interactions: true,
                children: true,
              }
            }
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
