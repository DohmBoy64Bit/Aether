import { Request, Response } from 'express';
import { SocialService } from '../services/social.service.js';
import prisma from '../utils/prisma.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { PostType, InteractionType } from '../generated/prisma/client/index.js';

const createPostSchema = z.object({
  content: z.string().max(280),
  type: z.nativeEnum(PostType).optional(),
  parentId: z.string().uuid().optional(),
  media: z.string().nullable().optional(), // JSON string
});

const interactSchema = z.object({
  postId: z.string().uuid(),
  type: z.nativeEnum(InteractionType),
});

const updatePersonaSchema = z.object({
  personality: z.string().min(10).max(1000),
  interests: z.array(z.string()).min(1).max(10),
});

export class SocialController {
  static async createPost(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const validatedData = createPostSchema.parse(req.body);

      // Manual check: must have either content or media
      if (!validatedData.content.trim() && !validatedData.media) {
        return res.status(400).json({ error: 'Post must have content or media' });
      }

      const post = await SocialService.createPost(
        req.user.userId,
        validatedData.content,
        validatedData.type as PostType,
        validatedData.parentId,
        validatedData.media
      );
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error('Validation Error Details:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Post Creation Error:', error);
      res.status(400).json({ error: error.message || 'An unknown error occurred' });
    }
  }

  static async getFeed(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await SocialService.getFeed(limit, offset);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch feed' });
    }
  }

  static async getPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await SocialService.getPost(id as string);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  }

  static async interact(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = interactSchema.parse(req.body);
      const interaction = await SocialService.interact(
        req.user.userId as string,
        validatedData.postId as string,
        validatedData.type as InteractionType
      );
      res.status(200).json(interaction);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(400).json({ error: error.message || 'An unknown error occurred' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const { username } = req.params;
      const requesterId = req.user?.userId;
      const profile = await SocialService.getProfile(username as string, requesterId);
      if (!profile) return res.status(404).json({ error: 'User not found' });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  static async updatePersona(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = updatePersonaSchema.parse(req.body);
      const persona = await SocialService.updatePersona(
        req.user.userId as string,
        validatedData.personality,
        validatedData.interests
      );
      res.json(persona);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      res.status(400).json({ error: error.message || 'An unknown error occurred' });
    }
  }

  static async follow(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { userId } = req.params;
      await SocialService.followUser(req.user.userId as string, userId as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to follow user' });
    }
  }

  static async unfollow(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { userId } = req.params;
      await SocialService.unfollowUser(req.user.userId as string, userId as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  }

  static async getFollowingFeed(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await SocialService.getFollowingFeed(req.user.userId, limit, offset);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch following feed' });
    }
  }

  static async getFollowers(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const user = await prisma.user.findUnique({ where: { username: username as string } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const followers = await SocialService.getFollowers(user.id);
      res.json(followers);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch followers' });
    }
  }

  static async getFollowing(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const user = await prisma.user.findUnique({ where: { username: username as string } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const following = await SocialService.getFollowing(user.id);
      res.json(following);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch following' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { bio, profileImage } = req.body;
      const user = await SocialService.updateProfile(req.user.userId, { bio, profileImage });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);
      const users = await SocialService.searchUsers(q as string);
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: 'Search failed' });
    }
  }

  static async getTrending(req: Request, res: Response) {
    try {
      const trending = await SocialService.getTrendingTopics();
      res.json(trending);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch trending topics' });
    }
  }

  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const recommendations = await SocialService.getUserRecommendations(req.user?.userId);
      res.json(recommendations);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }
}
