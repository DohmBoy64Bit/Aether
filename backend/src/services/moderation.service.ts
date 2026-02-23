import prisma from '../utils/prisma.js';
import { chatWithTimeout, safeParseJson } from '../utils/ollama.js';
import { MODERATION_SYSTEM_V1, moderationUserPrompt } from '../prompts/index.js';

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
}

export class ModerationService {
  /**
   * Moderates post content using Ollama.
   * FAIL-CLOSED: If moderation fails for any reason, content is flagged as unsafe.
   */
  static async moderatePost(content: string): Promise<ModerationResult> {
    try {
      const raw = await chatWithTimeout({
        system: MODERATION_SYSTEM_V1,
        user: moderationUserPrompt(content),
        format: 'json',
        timeoutMs: 15_000, // Moderation should be fast — 15s timeout
      });

      const result = safeParseJson<ModerationResult>(raw, 'moderatePost');
      if (!result || typeof result.isSafe !== 'boolean') {
        console.warn('Moderation returned unparseable result, defaulting to UNSAFE');
        return { isSafe: false, reason: 'Moderation system returned invalid response' };
      }

      return result;
    } catch (error) {
      console.error('Error in ModerationService:', error);
      // FAIL-CLOSED: if moderation fails, flag the content for review
      return { isSafe: false, reason: 'Moderation system unavailable — flagged for manual review' };
    }
  }

  /**
   * Moderates a post and updates its state in the database if it's unsafe.
   * Returns true if safe, false if flagged.
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
