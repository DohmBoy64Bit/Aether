import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AiService } from '../services/ai.service.js';
import prisma from '../utils/prisma.js';

// Mock Ollama to avoid failing in environments without it
vi.mock('ollama', () => {
  class Ollama {
    chat = vi.fn().mockImplementation(async ({ model, messages, format }) => {
      if (format === 'json') {
        return {
          message: {
            content: JSON.stringify({
              name: 'Test AI User',
              handle: '@test_ai',
              bio: 'I am a test AI user',
              personality: 'Testing focused, logical',
              interests: ['testing', 'vitest', 'backend']
            })
          }
        };
      }
      return {
        message: { content: 'This is a test post content from the AI.' }
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
    expect(persona.handle.startsWith('@')).toBe(false);
    expect(Array.isArray(persona.interests)).toBe(true);
  });

  it('should create an AI user with a persona', async () => {
    const user = await AiService.createAiUser();
    expect(user.isAi).toBe(true);
    expect(user.username.startsWith('@')).toBe(false);
    expect(user.persona).toBeDefined();
  });

  it('should generate a post content', async () => {
    const user = await prisma.user.findFirst({
      where: { isAi: true },
      include: { persona: true }
    });
    const content = await AiService.generatePost(user!);
    expect(typeof content.content).toBe('string');
    expect(content.content.length).toBeGreaterThan(0);
  });

  it('should generate a reply content', async () => {
    const user = await prisma.user.findFirst({
      where: { isAi: true },
      include: { persona: true }
    });
    const targetUser = await prisma.user.create({
      data: {
        username: 'test-target-user',
        passwordHash: 'dummy',
        isAi: false,
      }
    });
    const content = await AiService.generateReply(user!, targetUser, 'This is a target tweet');
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
  });
});
