import prisma from '../utils/prisma.js';
import { AiService } from './ai.service.js';
import { SocialService } from './social.service.js';
import { SearchService } from './search.service.js';
import { PostType } from '../generated/prisma/client/enums.js';

export class AiEngineService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static IS_RUNNING = false;

  /**
   * Starts the AI Action Loop.
   * @param intervalMs How often to run the loop (default 1 minute)
   */
  static start(intervalMs: number = 60000) {
    if (this.intervalId) return;

    console.log(`Starting AI Engine Loop with interval: ${intervalMs}ms`);
    this.seedAiUsers(5); // Ensure we have at least 5 AI users
    this.intervalId = setInterval(() => this.runLoop(), intervalMs);
  }

  /**
   * Seeds the database with AI users if none exist.
   */
  private static async seedAiUsers(count: number) {
    try {
      const existing = await prisma.user.count({ where: { isAi: true } });
      if (existing < count) {
        console.log(`Seeding AI users: creating ${count - existing} more AI personas...`);
        for (let i = 0; i < count - existing; i++) {
          await AiService.createAiUser();
        }
      }
    } catch (error) {
      console.error('Error seeding AI users:', error);
    }
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Main loop that iterates over all AI users and performs actions.
   */
  private static async runLoop() {
    if (this.IS_RUNNING) return;
    this.IS_RUNNING = true;

    try {
      const aiUsers = await prisma.user.findMany({
        where: { isAi: true },
        include: { persona: true }
      });

      console.log(`AI Engine Loop: Processing ${aiUsers.length} AI users`);

      for (const user of aiUsers) {
        await this.processUserAction(user);
      }
    } catch (error) {
      console.error('Error in AI Engine Loop:', error);
    } finally {
      this.IS_RUNNING = false;
    }
  }

  /**
   * Decides and performs an action for a single AI user.
   */
  private static async processUserAction(user: any) {
    const action = await AiService.decideAction(user.persona);

    if (action === 'POST') {
      const context = await this.getWebSearchContext(user.persona.interests);
      const content = await AiService.generatePost(user, context);
      await SocialService.createPost(user.id, content, PostType.TWEET);
      console.log(`AI User ${user.username} posted: ${content.substring(0, 50)}...`);
    } else if (action === 'REPLY') {
      // Find a recent post to reply to
      const recentPosts = await SocialService.getFeed(10);
      const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];
      if (targetPost && targetPost.userId !== user.id) {
        const content = await AiService.generateReply(user, targetPost.content);
        await SocialService.createPost(user.id, content, PostType.REPLY, targetPost.id);
        console.log(`AI User ${user.username} replied to ${targetPost.id}: ${content.substring(0, 50)}...`);
      }
    }
  }

  /**
   * Fetches current events context based on user interests.
   * Uses real web search via SearchService.
   */
  private static async getWebSearchContext(interests: any): Promise<string> {
    try {
      const interestList = Array.isArray(interests) ? interests : JSON.parse(interests as string);
      const randomInterest = interestList[Math.floor(Math.random() * interestList.length)];
      
      console.log(`AI Engine: Searching web for interest: ${randomInterest}`);
      const searchResult = await SearchService.search(randomInterest);
      return searchResult;
    } catch (error) {
      console.error('Error fetching web search context:', error);
      return 'No current event context available.';
    }
  }
}
