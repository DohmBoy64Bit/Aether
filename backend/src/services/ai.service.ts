import prisma from '../utils/prisma.js';
import { hashPassword } from '../utils/auth.js';
import crypto from 'crypto';
import { SearchResult } from './search.service.js';
import { MemoryService, MemoryMetadata } from './memory.service.js';
import { RelationshipService } from './relationship.service.js';
import { z } from 'zod';
import { chatWithTimeout, safeParseJson } from '../utils/ollama.js';
import {
  PERSONA_SYSTEM_V1,
  personaUserPrompt,
  SIGNIFICANCE_SYSTEM_V1,
  significanceUserPrompt,
  postGenerationSystemPrompt,
  postGenerationUserPrompt,
  REPLY_SYSTEM_V1,
  replyUserPrompt,
  SEARCH_PLAN_SYSTEM_V1,
  searchPlanUserPrompt,
  USEFUL_SEARXNG_CATEGORIES,
  MEMORY_SUMMARY_SYSTEM_V1,
  memorySummaryUserPrompt,
  BIO_EVOLUTION_SYSTEM_V1,
  bioEvolutionUserPrompt,
  wrapUserContent,
} from '../prompts/index.js';

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface PersonaDetails {
  name: string;
  handle: string;
  bio: string;
  personality: string;
  interests: string[];
}

export interface SearchPlan {
  query: string;
  categories: string[];
  time_range: string | null;
}

export interface PostMedia {
  links?: Array<{
    url: string;
    title: string;
    description?: string;
    thumbnail?: string;
  }>;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  video?: {
    url: string;
    iframe_src: string;
    title: string;
    thumbnail?: string;
  };
}

export interface GeneratedPost {
  content: string;
  media: PostMedia | null;
}

// ─── Types for AI User ──────────────────────────────────────────────────

export interface AiUserWithPersona {
  id: string;
  username: string;
  bio: string | null;
  profileImage: string | null;
  isAi: boolean;
  persona: {
    personality: unknown; // Json field — may be string or object
    interests: unknown;   // Json field — may be string[] or object
  } | null;
}

// ─── Archetypes ──────────────────────────────────────────────────────────

export enum PostArchetype {
  HOT_TAKE = 'HOT_TAKE',
  QUESTION = 'QUESTION',
  SHOWCASE = 'SHOWCASE',
  CURATOR = 'CURATOR',
  LIFE_UPDATE = 'LIFE_UPDATE'
}

export const ARCHETYPE_CONSTRAINTS: Record<PostArchetype, string> = {
  [PostArchetype.HOT_TAKE]: 'Style: HOT TAKE. Express a strong, perhaps controversial opinion about the topic. Be brief (under 200 chars). Do not be "helpful". Do not use hashtags. If sharing a link, just drop it at the end.',
  [PostArchetype.QUESTION]: 'Style: QUESTION. Ask a thought-provoking question to your followers about the topic. Do not answer it yourself. Keep it open-ended to drive engagement.',
  [PostArchetype.SHOWCASE]: 'Style: SHOWCASE. You found a cool image or video. Post it with a very short caption (under 100 chars). Let the media speak for itself. You MUST attach an image or video if available.',
  [PostArchetype.CURATOR]: 'Style: CURATOR. You found a great resource. Share the link and explain in 1 sentence why it is interesting. Do not use marketing language. Be a filter for quality.',
  [PostArchetype.LIFE_UPDATE]: 'Style: LIFE UPDATE. Connect the topic to your personal life or current activity. Use "I" statements. Be casual or emotional.'
};

// ─── Zod Schema ──────────────────────────────────────────────────────────

const postResponseSchema = z.object({
  content: z.string().optional(),
  media_type: z.any().transform(val => {
    if (typeof val !== 'string') return 'none';
    const lower = val.toLowerCase().trim();
    if (lower.includes('image')) return 'images';
    if (lower.includes('vid')) return 'video';
    if (lower.includes('link')) return 'link';
    return 'none';
  }),
  media_indices: z.any().transform(val => {
    if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n));
    return [];
  })
});

// ─── Theme Pool ──────────────────────────────────────────────────────────

const AI_THEMES = [
  'Competitive Gaming & Esports',
  'Software Development & Programming',
  'Retro-computing & Cyber-security',
  'Specialty Coffee & Roasting',
  'Home Brewing & Craft Beer',
  'Street Photography & Film',
  'Urban Gardening & Permaculture',
  'Vintage Motorcycles & Restoration',
  'Sustainable Architecture & Design',
  'Competitive Chess & Grandmaster strategy',
  'Culinary Arts & Molecular Gastronomy',
  'Indie Game Development',
  'Backpacking & Ultra-light camping',
  'DIY Modular Synthesizers'
];

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Safely converts a Prisma Json field to a display string.
 * Handles cases where the LLM stored an object instead of a plain string.
 */
function personalityToString(personality: unknown): string {
  if (typeof personality === 'string') return personality;
  if (personality && typeof personality === 'object') {
    // Try to extract meaningful text from the object
    return JSON.stringify(personality);
  }
  return 'a general internet user';
}

/**
 * Safely converts Prisma Json interests field to string[].
 */
function interestsToArray(interests: unknown): string[] {
  if (Array.isArray(interests)) {
    return interests.map(i => {
      if (typeof i === 'string') return i;
      if (typeof i === 'object' && i !== null) {
        // Recursively extract strings from nested objects
        const extract = (obj: unknown): string[] => {
          if (typeof obj === 'string') return [obj];
          if (Array.isArray(obj)) return obj.flatMap(extract);
          if (typeof obj === 'object' && obj !== null) return Object.values(obj).flatMap(extract);
          return [];
        };
        return extract(i).join(' ');
      }
      return String(i);
    });
  }
  if (typeof interests === 'string') {
    try {
      const parsed = JSON.parse(interests);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch { /* not JSON */ }
    return [interests];
  }
  return [];
}

// ─── Service ─────────────────────────────────────────────────────────────

export class AiService {
  /**
   * Generates a unique persona using Ollama.
   */
  static async generatePersona(theme?: string): Promise<PersonaDetails> {
    const selectedTheme = theme || AI_THEMES[Math.floor(Math.random() * AI_THEMES.length)];

    try {
      const raw = await chatWithTimeout({
        system: PERSONA_SYSTEM_V1,
        user: personaUserPrompt(selectedTheme),
        format: 'json',
      });

      const persona = safeParseJson<PersonaDetails>(raw, 'generatePersona');
      if (!persona) {
        throw new Error('Failed to parse persona from LLM response');
      }

      // Strip @ from handle if present
      if (persona.handle?.startsWith('@')) {
        persona.handle = persona.handle.slice(1);
      }

      // Ensure personality is a string, not a nested object
      if (typeof persona.personality !== 'string') {
        persona.personality = JSON.stringify(persona.personality);
      }

      return persona;
    } catch (error) {
      console.error('Error generating persona:', error);
      throw new Error('Failed to generate AI persona');
    }
  }

  /**
   * Creates a new AI user with a generated persona.
   */
  static async createAiUser(): Promise<AiUserWithPersona> {
    const theme = AI_THEMES[Math.floor(Math.random() * AI_THEMES.length)];
    const details = await this.generatePersona(theme);
    const passwordHash = await hashPassword(crypto.randomUUID());

    const user = await prisma.user.create({
      data: {
        username: details.handle,
        passwordHash,
        isAi: true,
        bio: details.bio,
        profileImage: await this.generateProfileImage(details),
        persona: {
          create: {
            personality: details.personality || '',
            interests: details.interests || [],
            profileImageGenerated: true,
          }
        }
      },
      include: {
        persona: true
      }
    });

    return user as AiUserWithPersona;
  }

  /**
   * Generates a profile image URL (placeholder).
   */
  static async generateProfileImage(details: PersonaDetails): Promise<string> {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${details.handle.replace('@', '')}`;
  }

  /**
   * Evaluates the significance of an interaction (1-10).
   * The Amygdala.
   */
  static async evaluateSignificance(content: string): Promise<number> {
    try {
      const raw = await chatWithTimeout({
        system: SIGNIFICANCE_SYSTEM_V1,
        user: significanceUserPrompt(content),
      });

      const score = parseInt(raw.trim());
      return isNaN(score) ? 1 : Math.max(1, Math.min(10, score));
    } catch (error) {
      console.error('Error evaluating significance:', error);
      return 1;
    }
  }

  /**
   * Assembles the full context for an AI response.
   */
  static async assembleContext(
    user: AiUserWithPersona,
    targetUser?: { id: string; username: string },
    targetPostContent?: string
  ): Promise<string> {
    const personality = personalityToString(user.persona?.personality);
    const interests = interestsToArray(user.persona?.interests);

    let context = `You are ${user.username}, a social media user with the following personality: ${personality}.\n`;
    context += `Your interests are: ${interests.join(', ')}.\n\n`;

    if (targetUser) {
      context += `TARGET USER: @${targetUser.username}\n`;
      const rel = await RelationshipService.getRelationship(user.id, targetUser.id);
      if (rel) {
        context += `RELATIONSHIP:\n`;
        context += `- Status: ${rel.status}\n`;
        context += `- Trust Score: ${rel.trustScore}/100\n`;
      } else {
        context += `RELATIONSHIP: Neutral/Unknown\n`;
      }

      const following = await RelationshipService.isFollowing(user.id, targetUser.id);
      context += `- Following: ${following ? 'Yes' : 'No'}\n\n`;

      // Pull relevant core memories
      const query = targetPostContent || `Interactions with @${targetUser.username}`;
      const memories = await MemoryService.queryMemories(user.id, query, 3, { isCore: true });
      if (memories.length > 0) {
        context += `RELEVANT CORE MEMORIES:\n`;
        memories.forEach((m: { content: string | null }) => {
          context += `- ${m.content}\n`;
        });
        context += `\n`;
      }
    }

    if (targetPostContent) {
      context += `CURRENT INPUT: ${wrapUserContent(targetPostContent)}\n`;
    }

    return context;
  }

  /**
   * Generates a post with optional rich media based on a specific archetype.
   */
  static async generatePost(
    user: AiUserWithPersona,
    searchResult?: SearchResult,
    archetype: PostArchetype = PostArchetype.HOT_TAKE
  ): Promise<GeneratedPost> {
    const context = await this.assembleContext(user);

    // Build available media context
    const hasLinks = searchResult && searchResult.links.length > 0;
    const hasImages = searchResult && searchResult.images.length > 0;
    const hasVideos = searchResult && searchResult.videos.length > 0;

    let mediaContext = '';
    if (hasLinks) {
      mediaContext += '\n\nAvailable links from search:\n';
      searchResult!.links.forEach((l, i) => {
        mediaContext += `  [${i}] "${l.title}" — ${l.url}${l.description ? ` (${l.description.substring(0, 80)})` : ''}\n`;
      });
    }
    if (hasImages) {
      mediaContext += '\nAvailable images from search:\n';
      searchResult!.images.forEach((img, i) => {
        mediaContext += `  [${i}] ${img.alt || 'image'} — ${img.url}\n`;
      });
    }
    if (hasVideos) {
      mediaContext += '\nAvailable videos from search:\n';
      searchResult!.videos.forEach((v, i) => {
        mediaContext += `  [${i}] "${v.title}" — ${v.url}\n`;
      });
    }

    if (!hasLinks && !hasImages && !hasVideos) {
      mediaContext = '\n\nNo media is available. You MUST set media_type to "none" and media_indices to [].';
    }

    const archetypeConstraint = ARCHETYPE_CONSTRAINTS[archetype] || ARCHETYPE_CONSTRAINTS[PostArchetype.HOT_TAKE];
    const topic = searchResult?.context ? `Current context/topic: ${searchResult.context}` : 'Talk about something that interests you.';

    try {
      const raw = await chatWithTimeout({
        system: postGenerationSystemPrompt(context),
        user: postGenerationUserPrompt(topic, mediaContext, archetypeConstraint),
        format: 'json',
      });

      const parsed = postResponseSchema.safeParse(safeParseJson(raw, 'generatePost'));
      if (!parsed.success) {
        console.warn('AI generated invalid JSON schema', parsed.error);
        return { content: 'Just vibing ✨', media: null };
      }

      const result = parsed.data;
      let content = (result.content || '').trim();
      if (!content) {
        content = 'Just vibing ✨';
      }

      // Build PostMedia based on AI's choice
      let media: PostMedia | null = null;
      const mediaType = result.media_type || 'none';
      const indices: number[] = result.media_indices || [];

      if (mediaType === 'link' && hasLinks) {
        const selectedLinks = indices
          .filter(i => i >= 0 && i < searchResult!.links.length)
          .map(i => searchResult!.links[i]);
        if (selectedLinks.length === 0) selectedLinks.push(searchResult!.links[0]);
        media = { links: selectedLinks };
      } else if (mediaType === 'images' && hasImages) {
        const selectedImages = indices
          .filter(i => i >= 0 && i < searchResult!.images.length)
          .slice(0, 4)
          .map(i => searchResult!.images[i]);
        if (selectedImages.length === 0) selectedImages.push(searchResult!.images[0]);
        media = { images: selectedImages };
      } else if (mediaType === 'video' && hasVideos) {
        const idx = indices[0] ?? 0;
        if (idx >= 0 && idx < searchResult!.videos.length) {
          media = { video: searchResult!.videos[idx] };
        } else {
          media = { video: searchResult!.videos[0] };
        }
      }

      // Post-processing: strip leaked markdown links from content when media is attached
      // The LLM sometimes embeds [Title](url) in text even when attaching a media card
      if (media && (media.video || media.images)) {
        content = content.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1');
        content = content.trim();
      }

      return { content, media };
    } catch (error) {
      console.error('Error generating post:', error);
      throw new Error('Failed to generate AI post');
    }
  }

  /**
   * Generates a reply to a specific post content.
   */
  static async generateReply(
    user: AiUserWithPersona,
    targetUser: { id: string; username: string },
    targetPostContent: string
  ): Promise<string> {
    const context = await this.assembleContext(user, targetUser, targetPostContent);

    try {
      const raw = await chatWithTimeout({
        system: REPLY_SYSTEM_V1,
        user: replyUserPrompt(context, targetUser.username),
      });

      const replyContent = raw.trim();

      // Memory Storage
      const significance = await this.evaluateSignificance(targetPostContent);
      const metadata: MemoryMetadata = {
        userId: user.id,
        targetUserId: targetUser.id,
        isCore: significance >= 8,
        significance: significance,
        type: 'interaction'
      };

      if (significance >= 4) {
        await MemoryService.addMemory(
          `Interaction with @${targetUser.username}: "${targetPostContent}". Your reply: "${replyContent}"`,
          metadata
        );
      }

      // Relationship Update
      const trustDelta = significance >= 8 ? 2 : significance >= 4 ? 1 : 0;
      await RelationshipService.updateTrustScore(user.id, targetUser.id, trustDelta);

      return replyContent;
    } catch (error) {
      console.error('Error generating reply:', error);
      throw new Error('Failed to generate AI reply');
    }
  }

  /**
   * Decides what action an AI user should take.
   * Fixed: Batch-loads follow status to avoid N+1 queries.
   */
  static async decideAction(
    user: AiUserWithPersona
  ): Promise<{
    action: 'POST' | 'REPLY' | 'FOLLOW' | 'UNFOLLOW' | 'LIKE' | 'RETWEET' | 'IDLE';
    archetype?: PostArchetype;
    targetUserId?: string;
  }> {
    const rand = Math.random();

    // 10% chance to POST
    if (rand < 0.1) {
      const archetypes = Object.values(PostArchetype);
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      return { action: 'POST', archetype };
    }

    // 15% chance to act on relationships (FOLLOW/UNFOLLOW/LIKE/RETWEET)
    if (rand < 0.25) {
      const rels = await prisma.relationship.findMany({
        where: { sourceId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      if (rels.length > 0) {
        // Batch-load follow status to avoid N+1 queries
        const targetIds = rels.map(r => r.targetId);
        const follows = await prisma.follow.findMany({
          where: {
            followerId: user.id,
            followingId: { in: targetIds }
          },
          select: { followingId: true }
        });
        const followingSet = new Set(follows.map(f => f.followingId));

        for (const rel of rels) {
          const isFollowing = followingSet.has(rel.targetId);
          if (rel.trustScore >= 70 && !isFollowing) {
            return { action: 'FOLLOW', targetUserId: rel.targetId };
          }
          if (rel.trustScore <= 30 && isFollowing) {
            return { action: 'UNFOLLOW', targetUserId: rel.targetId };
          }
          if (rel.trustScore >= 40 && Math.random() < 0.5) {
            if (rel.trustScore >= 60 && Math.random() < 0.2) {
              return { action: 'RETWEET', targetUserId: rel.targetId };
            }
            return { action: 'LIKE', targetUserId: rel.targetId };
          }
        }
      }
    }

    // 15% chance to REPLY
    if (rand < 0.40) return { action: 'REPLY' };

    return { action: 'IDLE' };
  }

  /**
   * Plans a search query for SearXNG based on interest and persona.
   */
  static async planSearch(interest: string, persona: AiUserWithPersona['persona']): Promise<SearchPlan> {
    const personality = personalityToString(persona?.personality);

    try {
      const raw = await chatWithTimeout({
        system: SEARCH_PLAN_SYSTEM_V1,
        user: searchPlanUserPrompt(interest, personality, USEFUL_SEARXNG_CATEGORIES),
        format: 'json',
      });

      const plan = safeParseJson<SearchPlan>(raw, 'planSearch');
      if (!plan) {
        return { query: interest, categories: ['general', 'news'], time_range: null };
      }

      // Validate categories
      const validCategories = USEFUL_SEARXNG_CATEGORIES as readonly string[];
      plan.categories = (plan.categories || []).filter(
        (c: string) => validCategories.includes(c.toLowerCase())
      );
      if (plan.categories.length === 0) {
        plan.categories = ['general', 'news'];
      }

      // Validate time_range
      if (plan.time_range && !['day', 'month', 'year'].includes(plan.time_range)) {
        plan.time_range = null;
      }

      // Ensure query is valid
      if (!plan.query || typeof plan.query !== 'string' || plan.query.trim().length === 0) {
        plan.query = interest;
      }

      return plan;
    } catch (error) {
      console.error('Error planning search:', error);
      return { query: interest, categories: ['general', 'news'], time_range: null };
    }
  }

  /**
   * Summarizes a user's day based on raw logs.
   */
  static async summarizeMemories(user: AiUserWithPersona, rawLogs: string): Promise<string> {
    const personality = personalityToString(user.persona?.personality);

    try {
      const raw = await chatWithTimeout({
        system: MEMORY_SUMMARY_SYSTEM_V1,
        user: memorySummaryUserPrompt(user.username, personality, rawLogs),
      });

      return raw.trim();
    } catch (error) {
      console.error('Error summarizing memories:', error);
      return 'Today was a day of many interactions.';
    }
  }

  /**
   * Evolves a user's bio based on a summary of their activity.
   */
  static async evolveBio(user: AiUserWithPersona, summary: string): Promise<string> {
    const personality = personalityToString(user.persona?.personality);

    try {
      const raw = await chatWithTimeout({
        system: BIO_EVOLUTION_SYSTEM_V1,
        user: bioEvolutionUserPrompt(user.username, user.bio || '', personality, summary),
      });

      return raw.trim().substring(0, 160);
    } catch (error) {
      console.error('Error evolving bio:', error);
      return user.bio || '';
    }
  }
}
