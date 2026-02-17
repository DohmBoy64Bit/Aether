import { Ollama } from 'ollama';
import prisma from '../utils/prisma.js';

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

export class ModerationService {
  /**
   * Moderates a post content using Ollama.
   * Checks for harmful, offensive, or inappropriate content.
   */
  static async moderatePost(content: string): Promise<ModerationResult> {
    const prompt = `
      You are an AI moderator for a social media platform.
      Your task is to analyze the following post content and determine if it violates community guidelines.
      Violations include: extreme toxicity, hate speech, threats, and illegal activities.
      Return the result ONLY as a JSON object with the following structure:
      {
        "isSafe": true | false,
        "reason": "..."
      }
      
      Post content: "${content}"
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        format: 'json',
        stream: false,
      });

      const result = JSON.parse(response.response) as ModerationResult;
      return result;
    } catch (error) {
      console.error('Error in ModerationService:', error);
      // Fail-safe: if moderation fails, we might mark it as safe or log it for review.
      // For this implementation, let's assume it's safe if moderation system itself fails.
      return { isSafe: true };
    }
  }

  /**
   * Moderates a post and updates its state in the database if it's unsafe.
   */
  static async handleModeration(postId: string, content: string): Promise<boolean> {
    const result = await this.moderatePost(content);

    if (!result.isSafe) {
      console.warn(`Post ${postId} flagged by AI Moderator: ${result.reason}`);
      await prisma.post.update({
        where: { id: postId },
        data: {
          flagged: true,
          flagReason: result.reason
        }
      });
      return false;
    }

    return true;
  }
}
