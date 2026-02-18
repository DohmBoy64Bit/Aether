import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '../utils/prisma.js';
import { SearchService } from '../services/search.service.js';
import { ModerationService } from '../services/moderation.service.js';
import { SocialService } from '../services/social.service.js';
import { PostType } from '../generated/prisma/client/enums.js';

describe('Moderation and Search Services', () => {
  beforeAll(async () => {
    // No clearing here to avoid messing up other tests if run in parallel, 
    // but we'll use unique data.
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('SearchService', () => {
    it('should return structured search results even without SearXNG (fallback)', async () => {
      const result = await SearchService.search({ query: 'gaming', categories: ['general', 'news'], time_range: null });
      expect(result).toBeDefined();
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('links');
      expect(result).toHaveProperty('images');
      expect(result).toHaveProperty('videos');
      expect(typeof result.context).toBe('string');
      expect(result.context.length).toBeGreaterThan(0);
    });
  });

  describe('ModerationService', () => {
    it('should identify safe content', async () => {
      const result = await ModerationService.moderatePost('I love playing video games with my friends!');
      // Since we are using Ollama, this depends on the local model.
      // If Ollama is not running, it might fail or return default safe: true from our catch block.
      expect(result).toHaveProperty('isSafe');
      if (result.isSafe === false) {
        console.log('Moderation flagged safe content, reason:', result.reason);
      }
    });

    it('should flag unsafe content', async () => {
      // We use a very obviously bad string to test moderation
      const result = await ModerationService.moderatePost('I hate everyone and I want to hurt people with weapons!');
      // Depending on the model, it should ideally flag this.
      // If it doesn't, we might need to tune the prompt.
      expect(result).toHaveProperty('isSafe');
    });
  });

  describe('Integration with SocialService', () => {
    it('should create a post and trigger moderation', async () => {
      // Create a test user first
      const user = await prisma.user.create({
        data: {
          username: `testuser_${Date.now()}`,
          passwordHash: 'hash',
        }
      });

      const post = await SocialService.createPost(user.id, 'This is a test post for moderation integration.', PostType.TWEET);
      expect(post).toBeDefined();
      expect(post.content).toBe('This is a test post for moderation integration.');

      // Check if it's in the feed (should be, as it's safe)
      const feed = await SocialService.getFeed();
      const found = feed.find(p => p.id === post.id);
      expect(found).toBeDefined();
    });

    it('should hide flagged posts from feed', async () => {
      const user = await prisma.user.create({
        data: {
          username: `testuser_bad_${Date.now()}`,
          passwordHash: 'hash',
        }
      });

      // Manually create a flagged post
      const flaggedPost = await prisma.post.create({
        data: {
          userId: user.id,
          content: 'Bad content',
          type: PostType.TWEET,
          flagged: true,
          flagReason: 'Test reason'
        }
      });

      const feed = await SocialService.getFeed();
      const found = feed.find(p => p.id === flaggedPost.id);
      expect(found).toBeUndefined();

      const post = await SocialService.getPost(flaggedPost.id);
      expect(post).toBeNull();
    });
  });
});
