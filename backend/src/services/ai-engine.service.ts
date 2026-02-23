import prisma from '../utils/prisma.js';
import { AiService, AiUserWithPersona } from './ai.service.js';
import { SocialService } from './social.service.js';
import { SearchService } from './search.service.js';
import { MemoryService } from './memory.service.js';
import { PostType, InteractionType } from '../generated/prisma/client/index.js';

/**
 * Concurrency limiter — runs promises with a max concurrency.
 */
async function pLimit<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then(result => { results.push(result); });
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove settled promises
      for (let i = executing.length - 1; i >= 0; i--) {
        const status = await Promise.race([executing[i].then(() => 'done'), Promise.resolve('pending')]);
        if (status === 'done') executing.splice(i, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}

export class AiEngineService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static IS_RUNNING = false;
  private static lastSleepCycleAt = 0; // §4.4: Track last sleep cycle time

  /**
   * Starts the AI Action Loop.
   */
  static start(intervalMs: number = 60000) {
    if (this.intervalId) return;

    console.log(`Starting AI Engine Loop with interval: ${intervalMs}ms`);

    // §6.5: Register graceful shutdown handlers
    const shutdown = () => {
      console.log('AI Engine: Graceful shutdown initiated...');
      this.stop();
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // §4.5: Seed AI users in the background (non-blocking)
    this.seedAiUsers(10).catch(err => {
      console.error('Error seeding AI users:', err);
    });

    this.intervalId = setInterval(() => this.runLoop(), intervalMs);
  }

  /**
   * §4.5: Seeds AI users with concurrency limit (3 parallel) instead of sequential.
   */
  private static async seedAiUsers(count: number) {
    try {
      const existing = await prisma.user.count({ where: { isAi: true } });
      if (existing < count) {
        const needed = count - existing;
        console.log(`Seeding AI users: creating ${needed} more AI personas (3 at a time)...`);

        const tasks = Array.from({ length: needed }, () => () => AiService.createAiUser());
        await pLimit(tasks, 3);

        console.log(`AI Engine: Seeding complete — ${needed} AI users created.`);
      }
    } catch (error) {
      console.error('Error seeding AI users:', error);
    }
  }

  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('AI Engine Loop stopped.');
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

      // §4.4: Fixed sleep cycle — check elapsed time instead of clock minute
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      if (now - this.lastSleepCycleAt >= ONE_HOUR) {
        this.lastSleepCycleAt = now;
        await this.runSleepCycle(aiUsers as AiUserWithPersona[]);
      }

      // Process users concurrently in chunks
      const CHUNK_SIZE = 5;
      for (let i = 0; i < aiUsers.length; i += CHUNK_SIZE) {
        const chunk = aiUsers.slice(i, i + CHUNK_SIZE);
        await Promise.all(
          chunk.map(user =>
            this.processUserAction(user as AiUserWithPersona).catch(err =>
              console.error(`Error processing AI user ${user.username}:`, err)
            )
          )
        );
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
  private static async processUserAction(user: AiUserWithPersona) {
    const decision = await AiService.decideAction(user);

    if (decision.action === 'POST') {
      const searchResult = await this.getWebSearchContext(user);
      const generated = await AiService.generatePost(user, searchResult, decision.archetype);
      const mediaJson = generated.media || null;
      await SocialService.createPost(user.id, generated.content, PostType.TWEET, undefined, mediaJson);
      const mediaType = generated.media
        ? (generated.media.video ? 'video' : generated.media.images ? `${generated.media.images.length} images` : `${generated.media.links?.length || 0} links`)
        : 'none';
      console.log(`AI User ${user.username} posted [${decision.archetype}] (media: ${mediaType}): ${generated.content.substring(0, 50)}...`);

    } else if (decision.action === 'REPLY') {
      const recentPosts = await SocialService.getFeed(10);
      const targetPost = recentPosts[Math.floor(Math.random() * recentPosts.length)];
      if (targetPost && targetPost.userId !== user.id) {
        let replyTargetPost = targetPost;

        if (Math.random() < 0.3 && targetPost._count?.children > 0) {
          try {
            const fullPost = await SocialService.getPost(targetPost.id);
            if (fullPost && (fullPost as any).children?.length > 0) {
              replyTargetPost = (fullPost as any).children[Math.floor(Math.random() * (fullPost as any).children.length)];
              console.log(`AI User ${user.username} replying to nested reply ${replyTargetPost.id}`);
            }
          } catch {
            // Fall back to top-level post
          }
        }

        const targetUser = { id: replyTargetPost.userId, username: (replyTargetPost as any).user.username };
        const content = await AiService.generateReply(user, targetUser, replyTargetPost.content);
        await SocialService.createPost(user.id, content, PostType.REPLY, replyTargetPost.id);
        console.log(`AI User ${user.username} replied to ${replyTargetPost.id}: ${content.substring(0, 50)}...`);
      }

    } else if (decision.action === 'FOLLOW' && decision.targetUserId) {
      await SocialService.followUser(user.id, decision.targetUserId);
      console.log(`AI User ${user.username} FOLLOW ${decision.targetUserId}`);

    } else if (decision.action === 'UNFOLLOW' && decision.targetUserId) {
      await SocialService.unfollowUser(user.id, decision.targetUserId);
      console.log(`AI User ${user.username} UNFOLLOW ${decision.targetUserId}`);

    } else if (decision.action === 'LIKE' && decision.targetUserId) {
      const targetPosts = await prisma.post.findMany({
        where: { userId: decision.targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      if (targetPosts.length > 0) {
        const postToLike = targetPosts[Math.floor(Math.random() * targetPosts.length)];
        await SocialService.interact(user.id, postToLike.id, InteractionType.LIKE);
        console.log(`AI User ${user.username} LIKE post ${postToLike.id}`);
      }

    } else if (decision.action === 'RETWEET' && decision.targetUserId) {
      const targetPosts = await prisma.post.findMany({
        where: { userId: decision.targetUserId },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      if (targetPosts.length > 0) {
        const postToRetweet = targetPosts[Math.floor(Math.random() * targetPosts.length)];
        await SocialService.interact(user.id, postToRetweet.id, InteractionType.RETWEET);
        console.log(`AI User ${user.username} RETWEET post ${postToRetweet.id}`);
      }
    }
  }

  /**
   * The Sleep Cycle (Dreaming).
   * Summarizes temporary memories into core memories and prunes raw logs.
   */
  private static async runSleepCycle(users: AiUserWithPersona[]) {
    console.log('AI Engine: Starting Sleep Cycle (Dreaming)...');
    for (const user of users) {
      try {
        const tempMemories = await MemoryService.getTemporaryMemoriesForPruning(user.id);
        if (tempMemories.length === 0) continue;

        const rawLogs = tempMemories.map((m: { content: string | null }) => m.content || '').join('\n');
        const summary = await AiService.summarizeMemories(user, rawLogs);

        await MemoryService.addMemory(summary, {
          userId: user.id,
          isCore: true,
          significance: 5,
          type: 'dream_summary'
        });

        const evolvedBio = await AiService.evolveBio(user, summary);

        await prisma.user.update({
          where: { id: user.id },
          data: { bio: evolvedBio }
        });

        await MemoryService.deleteMemories(tempMemories.map((m: { id: string }) => m.id));
        console.log(`AI Engine: Sleep Cycle complete for ${user.username}.`);
      } catch (error) {
        console.error(`Error in Sleep Cycle for user ${user.username}:`, error);
      }
    }
  }

  /**
   * Fetches current events context based on user interests.
   */
  private static async getWebSearchContext(user: AiUserWithPersona): Promise<import('./search.service.js').SearchResult> {
    try {
      const interests = user.persona?.interests;
      let interestList: string[];

      if (Array.isArray(interests)) {
        interestList = interests.map(i => {
          if (typeof i === 'string') return i;
          if (typeof i === 'object' && i !== null) {
            const extract = (obj: unknown): string[] => {
              if (typeof obj === 'string') return [obj];
              if (Array.isArray(obj)) return obj.flatMap(extract);
              if (typeof obj === 'object' && obj !== null) return Object.values(obj as Record<string, unknown>).flatMap(extract);
              return [];
            };
            return extract(i).join(' ');
          }
          return String(i);
        });
      } else if (typeof interests === 'string') {
        try {
          interestList = JSON.parse(interests);
        } catch {
          interestList = [interests];
        }
      } else {
        interestList = [];
      }

      if (interestList.length === 0) {
        console.log(`AI Engine: User @${user.username} has no interests. Falling back.`);
        interestList.push("trending topics and current events");
      }

      const interest = interestList[Math.floor(Math.random() * interestList.length)];
      console.log(`AI Engine: Planning search for interest: ${interest}`);

      const plan = await AiService.planSearch(interest, user.persona);
      console.log(`AI Engine: Search plan — query: "${plan.query}", categories: [${plan.categories.join(', ')}]`);

      const searchResult = await SearchService.search(plan);
      console.log(`AI Engine: Found ${searchResult.links.length} links, ${searchResult.images.length} images, ${searchResult.videos.length} videos`);
      return searchResult;
    } catch (error) {
      console.error('Error fetching web search context:', error);
      return { context: 'No current event context available.', links: [], images: [], videos: [] };
    }
  }
}
