import prisma from '../utils/prisma.js';
import { AiService } from './ai.service.js';
import { SocialService } from './social.service.js';
import { SearchService } from './search.service.js';
import { MemoryService } from './memory.service.js';
import { PostType } from '../generated/prisma/client/index.js';

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

      // Check for Sleep Cycle (Testing: every loop)
      if (true) {
        await this.runSleepCycle(aiUsers);
      }

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
    const decision = await AiService.decideAction(user);

    if (decision.action === 'POST') {
      const searchResult = await this.getWebSearchContext(user);
      const generated = await AiService.generatePost(user, searchResult, decision.archetype);
      const mediaJson = generated.media ? JSON.stringify(generated.media) : null;
      await SocialService.createPost(user.id, generated.content, PostType.TWEET, undefined, mediaJson);
      const mediaType = generated.media
        ? (generated.media.video ? 'video' : generated.media.images ? `${generated.media.images.length} images` : `${generated.media.links?.length || 0} links`)
        : 'none';
      console.log(`AI User ${user.username} posted [${decision.archetype}] (media: ${mediaType}): ${generated.content.substring(0, 50)}...`);
    } else if (decision.action === 'REPLY') {
      // Find a recent post to reply to
      const recentPosts = await SocialService.getFeed(10);
      const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];
      if (targetPost && targetPost.userId !== user.id) {
        // 30% chance to reply to an existing reply (nested thread) instead of the top-level post
        let replyTargetPost = targetPost;

        if (Math.random() < 0.3 && targetPost._count.children > 0) {
          try {
            const fullPost = await SocialService.getPost(targetPost.id);
            if (fullPost && fullPost.children && fullPost.children.length > 0) {
              replyTargetPost = fullPost.children[Math.floor(Math.random() * fullPost.children.length)];
              console.log(`AI User ${user.username} replying to nested reply ${replyTargetPost.id}`);
            }
          } catch (e) {
            // Fall back to replying to the top-level post
          }
        }

        const targetUser = { id: replyTargetPost.userId, username: replyTargetPost.user.username };
        const content = await AiService.generateReply(user, targetUser, replyTargetPost.content);
        await SocialService.createPost(user.id, content, PostType.REPLY, replyTargetPost.id);
        console.log(`AI User ${user.username} replied to ${replyTargetPost.id}: ${content.substring(0, 50)}...`);
      }
    } else if (decision.action === 'FOLLOW' && decision.targetUserId) {
      await SocialService.followUser(user.id, decision.targetUserId);
      console.log(`AI User ${user.username} decided to FOLLOW user ${decision.targetUserId}`);
    } else if (decision.action === 'UNFOLLOW' && decision.targetUserId) {
      await SocialService.unfollowUser(user.id, decision.targetUserId);
      console.log(`AI User ${user.username} decided to UNFOLLOW user ${decision.targetUserId}`);
    }
  }

  /**
   * The Sleep Cycle (Dreaming).
   * Summarizes temporary memories into core memories and prunes raw logs.
   */
  private static async runSleepCycle(users: any[]) {
    console.log('AI Engine: Starting Sleep Cycle (Dreaming)...');
    for (const user of users) {
      try {
        const tempMemories = await MemoryService.getTemporaryMemoriesForPruning(user.id);
        if (tempMemories.length === 0) continue;

        const rawLogs = tempMemories.map((m: any) => m.content).join('\n');
        // Simple summarization via LLM (we'd ideally use a specific summary prompt here)
        const summary = await AiService.summarizeMemories(user, rawLogs);

        await MemoryService.addMemory(summary, {
          userId: user.id,
          isCore: true,
          significance: 5,
          type: 'dream_summary'
        });

        // Persona Evolution: Update bio or personality slightly based on summary
        const evolvedBio = await AiService.evolveBio(user, summary);

        await prisma.user.update({
          where: { id: user.id },
          data: { bio: evolvedBio }
        });

        await MemoryService.deleteMemories(tempMemories.map((m: any) => m.id));
        console.log(`AI Engine: Sleep Cycle & Evolution complete for ${user.username}.`);
      } catch (error) {
        console.error(`Error in Sleep Cycle for user ${user.username}:`, error);
      }
    }
  }

  /**
   * Fetches current events context based on user interests.
   * Uses Ollama to plan the search, then SearXNG to execute it.
   * Returns structured SearchResult with links, images, and videos.
   */
  private static async getWebSearchContext(user: any): Promise<import('./search.service.js').SearchResult> {
    try {
      const interests = user.persona?.interests;
      const interestList = Array.isArray(interests) ? interests : JSON.parse(interests as string);
      const randomInterest = interestList[Math.floor(Math.random() * interestList.length)];

      console.log(`AI Engine: Planning search for interest: ${randomInterest}`);
      const plan = await AiService.planSearch(randomInterest, user.persona);
      console.log(`AI Engine: Search plan — query: "${plan.query}", categories: [${plan.categories.join(', ')}], time_range: ${plan.time_range}`);

      const searchResult = await SearchService.search(plan);
      console.log(`AI Engine: Found ${searchResult.links.length} links, ${searchResult.images.length} images, ${searchResult.videos.length} videos`);
      return searchResult;
    } catch (error) {
      console.error('Error fetching web search context:', error);
      return { context: 'No current event context available.', links: [], images: [], videos: [] };
    }
  }
}

