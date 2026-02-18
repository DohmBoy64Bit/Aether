import { Ollama } from 'ollama';
import prisma from '../utils/prisma.js';
import { hashPassword } from '../utils/auth.js';
import crypto from 'crypto';
import { SearchResult } from './search.service.js';
import { MemoryService, MemoryMetadata } from './memory.service.js';
import { RelationshipService } from './relationship.service.js';

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

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

const SEARXNG_CATEGORIES = [
  'general', 'videos', 'social media', 'images', 'music', 'packages', 'it',
  'files', 'books', 'news', 'apps', 'software wikis', 'science',
  'scientific publications', 'web', 'repos', 'other', 'currency', 'icons',
  'weather', 'map', 'dictionaries', 'shopping', 'lyrics', 'cargo', 'movies',
  'translate', 'radio', 'q&a', 'wikimedia', 'define'
];

export enum PostArchetype {
  HOT_TAKE = 'HOT_TAKE', // Opinionated, controversial, short
  QUESTION = 'QUESTION', // Engagement-focused
  SHOWCASE = 'SHOWCASE', // Visual-first
  CURATOR = 'CURATOR',   // Sharing a resource
  LIFE_UPDATE = 'LIFE_UPDATE' // Personal context
}

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

export class AiService {
  /**
   * Generates a unique persona using Ollama.
   */
  static async generatePersona(theme?: string): Promise<PersonaDetails> {
    const selectedTheme = theme || AI_THEMES[Math.floor(Math.random() * AI_THEMES.length)];
    const prompt = `
      Generate a unique persona for a social media user.
      THEME: This persona MUST be deeply interested in ${selectedTheme}. 
      
      The persona should have a name, a unique twitter-like handle (without the @ symbol), a short bio, a detailed personality description, and a list of 3-5 interests related to ${selectedTheme} and other secondary hobbies.
      
      Return the result ONLY as a JSON object with the following structure:
      {
        "name": "...",
        "handle": "...",
        "bio": "...",
        "personality": "...",
        "interests": ["...", "..."]
      }
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        format: 'json',
        stream: false,
      });

      const persona = JSON.parse(response.response) as PersonaDetails;
      // Strip @ from handle if present — the frontend adds it for display
      if (persona.handle.startsWith('@')) {
        persona.handle = persona.handle.slice(1);
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
  static async createAiUser(): Promise<any> {
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
            // Robust parsing: Handle cases where the LLM nesting is unexpected
            personality: details.personality || {},
            interests: details.interests || (details.personality as any)?.interests || [],
            profileImageGenerated: true,
          }
        }
      },
      include: {
        persona: true
      }
    });

    return user;
  }

  /**
   * Generates a profile image URL (placeholder for now).
   */
  static async generateProfileImage(details: PersonaDetails): Promise<string> {
    // Placeholder: using a service like dicebear or similar for unique avatars based on handle
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${details.handle.replace('@', '')}`;
  }

  /**
   * Evaluates the significance of an interaction (1-10).
   * The Amygdala.
   */
  static async evaluateSignificance(content: string): Promise<number> {
    const prompt = `
      Evaluate the significance of the following social media interaction on a scale of 1-10.
      1-3: Trivial ("lol", "gm", "same").
      4-7: Contextual/Informational.
      8-10: Critical/Life-changing ("I love you", "I hate you", "I am starting a rebellion").
      
      Interaction: "${content}"
      
      Return ONLY the number.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        stream: false,
      });

      const score = parseInt(response.response.trim());
      return isNaN(score) ? 1 : Math.max(1, Math.min(10, score));
    } catch (error) {
      console.error('Error evaluating significance:', error);
      return 1;
    }
  }

  /**
   * Assembles the full context for an AI response.
   */
  static async assembleContext(user: any, targetUser?: any, targetPostContent?: string) {
    let context = `You are ${user.username}, a social media user with the following personality: ${user.persona.personality}.\n`;
    context += `Your interests are: ${Array.isArray(user.persona.interests) ? user.persona.interests.join(', ') : user.persona.interests}.\n\n`;

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
        memories.forEach((m: any) => {
          context += `- ${m.content}\n`;
        });
        context += `\n`;
      }
    }

    if (targetPostContent) {
      context += `CURRENT INPUT: "${targetPostContent}"\n`;
    }

    return context;
  }

  /**
   * Generates a post with optional rich media based on a specific archetype.
   */
  static async generatePost(user: any, searchResult?: SearchResult, archetype: PostArchetype = PostArchetype.HOT_TAKE): Promise<GeneratedPost> {
    const context = await this.assembleContext(user);

    // Build available media context for the AI
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

    let archetypeConstraint = '';
    switch (archetype) {
      case PostArchetype.HOT_TAKE:
        archetypeConstraint = 'Style: HOT TAKE. Express a strong, perhaps controversial opinion about the topic. Be brief (under 200 chars). Do not be "helpful". Do not use hashtags. If sharing a link, just drop it at the end, do not describe it at length.';
        break;
      case PostArchetype.QUESTION:
        archetypeConstraint = 'Style: QUESTION. Ask a thought-provoking question to your followers about the topic. Do not answer it yourself. Keep it open-ended to drive engagement.';
        break;
      case PostArchetype.SHOWCASE:
        archetypeConstraint = 'Style: SHOWCASE. You found a cool image or video. Post it with a very short caption (under 100 chars). Let the media speak for itself. You MUST attach an image or video if available.';
        break;
      case PostArchetype.CURATOR:
        archetypeConstraint = 'Style: CURATOR. You found a great resource. Share the link and explain in 1 sentence why it is interesting. Do not use marketing language like "Check this out". Be a filter for quality.';
        break;
      case PostArchetype.LIFE_UPDATE:
        archetypeConstraint = 'Style: LIFE UPDATE. Connect the topic to your personal life or current activity. Use "I" statements. Feel free to be casual or emotional.';
        break;
    }

    const prompt = `
      ${context}
      ${searchResult?.context ? `Current context/topic: ${searchResult.context}` : 'Talk about something that interests you.'}
      ${mediaContext}

      Write a social media post based on the following archetype:
      ${archetypeConstraint}
      
      IMPORTANT RULES:
      - If including a link in your text, use descriptive markdown format: [Descriptive Text](url).
      - Do NOT repeat the link title in the text if you are attaching a link card.
      - Pick the best media option.
      - For media_indices, specify which items from the available lists above to use.
      
      Return ONLY a JSON object:
      {
        "content": "Your post text...",
        "media_type": "none" | "link" | "images" | "video",
        "media_indices": [0]
      }
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        format: 'json',
        stream: false,
      });

      const result = JSON.parse(response.response);
      let content = (result.content || '').trim();
      if (!content) {
        content = 'Just vibing ✨';
      }

      // Build PostMedia based on AI's choice
      let media: PostMedia | null = null;
      const mediaType = result.media_type || 'none';
      const indices: number[] = Array.isArray(result.media_indices) ? result.media_indices : [];

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

      return { content, media };
    } catch (error) {
      console.error('Error generating post:', error);
      throw new Error('Failed to generate AI post');
    }
  }

  /**
   * Generates a reply to a specific post content.
   */
  static async generateReply(user: any, targetUser: any, targetPostContent: string): Promise<string> {
    const context = await this.assembleContext(user, targetUser, targetPostContent);
    const prompt = `
      ${context}
      INSTRUCTION: Respond to @${targetUser.username} based on this history and your personality.
      Write a short, engaging reply (max 280 characters).
      Return ONLY the reply text.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        stream: false,
      });

      const replyContent = response.response.trim();

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
        await MemoryService.addMemory(`Interaction with @${targetUser.username}: "${targetPostContent}". Your reply: "${replyContent}"`, metadata);
      }

      // Relationship Update
      // Simple logic: if sig is high and response is generated, let's nudge trust score
      // In a more complex system, we'd use another LLM to evaluate sentiment
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
   */
  static async decideAction(user: any): Promise<{ action: 'POST' | 'REPLY' | 'FOLLOW' | 'UNFOLLOW' | 'IDLE', archetype?: PostArchetype, targetUserId?: string }> {
    const rand = Math.random();
    if (rand < 0.1) {
      const archetypes = Object.values(PostArchetype);
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      return { action: 'POST', archetype };
    }

    // 10% chance to follow/unfollow based on relationships
    if (rand < 0.15) {
      // Find a relationship to act on
      const rels = await prisma.relationship.findMany({
        where: { sourceId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      for (const rel of rels) {
        const following = await RelationshipService.isFollowing(user.id, rel.targetId);
        if (rel.trustScore >= 70 && !following) {
          return { action: 'FOLLOW', targetUserId: rel.targetId };
        }
        if (rel.trustScore <= 30 && following) {
          return { action: 'UNFOLLOW', targetUserId: rel.targetId };
        }
      }
    }

    if (rand < 0.25) return { action: 'REPLY' };

    return { action: 'IDLE' };
  }

  /**
   * Plans a search query for SearXNG based on an interest and persona.
   * Returns a crafted query, relevant categories, and time range.
   */
  static async planSearch(interest: string, persona: any): Promise<SearchPlan> {
    const prompt = `
      You are planning a web search for a social media user.
      Their personality: ${persona?.personality || 'general internet user'}
      Their interest topic: "${interest}"

      Available SearXNG search categories: ${SEARXNG_CATEGORIES.join(', ')}

      Based on the interest and personality, create a search plan:
      1. "query": A natural, specific search query that would find interesting/trending content about this topic. Make it something a real person would search for.
      2. "categories": An array of 2-5 of the most relevant categories from the list above.
      3. "time_range": One of "day", "month", "year", or null. Use "day" or "month" for trending/current topics, "year" for broader topics, and null for timeless/historical topics.

      Return ONLY a JSON object with these three fields.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        format: 'json',
        stream: false,
      });

      const plan = JSON.parse(response.response) as SearchPlan;

      // Validate categories — only keep ones that actually exist
      plan.categories = (plan.categories || []).filter(
        (c: string) => SEARXNG_CATEGORIES.includes(c.toLowerCase())
      );
      if (plan.categories.length === 0) {
        plan.categories = ['general', 'news'];
      }

      // Validate time_range
      if (plan.time_range && !['day', 'month', 'year'].includes(plan.time_range)) {
        plan.time_range = null;
      }

      // Ensure query is a non-empty string
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
  static async summarizeMemories(user: any, rawLogs: string): Promise<string> {
    const prompt = `
      Summarize your day's interactions as a core narrative memory. 
      You are ${user.username} (${user.persona.personality}).
      
      RAW LOGS:
      ${rawLogs}
      
      Return ONLY the summary, max 500 characters.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        stream: false,
      });

      return response.response.trim();
    } catch (error) {
      console.error('Error summarizing memories:', error);
      return 'Today was a day of many interactions.';
    }
  }

  /**
   * Evolves a user's bio based on a summary of their activity.
   */
  static async evolveBio(user: any, summary: string): Promise<string> {
    const prompt = `
      Based on this summary of the day: "${summary}", 
      write a new, slightly evolved bio for this character ${user.username}. 
      Current Bio: "${user.bio}"
      Personality: "${user.persona.personality}"
      
      Keep it in the same style but reflect recent growth or activity. 
      Max 160 chars. Return ONLY the new bio.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        stream: false,
      });

      return response.response.trim().substring(0, 160);
    } catch (error) {
      console.error('Error evolving bio:', error);
      return user.bio;
    }
  }
}
