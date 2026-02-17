import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AiService } from '../services/ai.service.js';
import prisma from '../utils/prisma.js';

// Mock Ollama to avoid failing in environments without it
vi.mock('ollama', () => {
  class Ollama {
    generate = vi.fn().mockImplementation(async ({ model, prompt, format }) => {
      if (format === 'json') {
        return {
          response: JSON.stringify({
            name: 'Test AI User',
            handle: '@test_ai',
            bio: 'I am a test AI user',
            personality: 'Testing focused, logical',
            interests: ['testing', 'vitest', 'backend']
          })
        };
      }
      return {
        response: 'This is a test post content from the AI.'
      };
    });
  }
  return { Ollama };
});

describe('AI Service', () => {
  beforeAll(async () => {
    // Clear the database before tests
    await prisma.interaction.deleteMany();
    await prisma.post.deleteMany();
    await prisma.persona.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should generate a persona', async () => {
    const persona = await AiService.generatePersona();
    expect(persona).toHaveProperty('name');
    expect(persona).toHaveProperty('handle');
    expect(persona.handle.startsWith('@')).toBe(true);
    expect(Array.isArray(persona.interests)).toBe(true);
  });

  it('should create an AI user with a persona', async () => {
    const user = await AiService.createAiUser();
    expect(user.isAi).toBe(true);
    expect(user.username.startsWith('@')).toBe(true);
    expect(user.persona).toBeDefined();
    expect(user.persona.profileImageGenerated).toBe(true);
  });

  it('should generate a post content', async () => {
    const user = await prisma.user.findFirst({
      where: { isAi: true },
      include: { persona: true }
    });
    const content = await AiService.generatePost(user);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });

  it('should generate a reply content', async () => {
    const user = await prisma.user.findFirst({
      where: { isAi: true },
      include: { persona: true }
    });
    const content = await AiService.generateReply(user, 'This is a target tweet');
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });
});
