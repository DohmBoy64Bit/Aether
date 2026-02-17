import { Request, Response } from 'express';
import { SocialService } from '../services/social.service.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { PostType, InteractionType } from '../generated/prisma/client/enums.js';

const createPostSchema = z.object({
  content: z.string().min(1).max(280),
  type: z.nativeEnum(PostType).optional(),
  parentId: z.string().uuid().optional(),
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
      const post = await SocialService.createPost(
        req.user.userId,
        validatedData.content,
        validatedData.type as PostType,
        validatedData.parentId
      );
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
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
      const post = await SocialService.getPost(id);
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
        req.user.userId,
        validatedData.postId,
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

  static async getProfile(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const profile = await SocialService.getProfile(username);
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
        req.user.userId,
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
}
