import { Ollama } from 'ollama';
import prisma from '../utils/prisma.js';
import { hashPassword } from '../utils/auth.js';
import crypto from 'crypto';
import { SearchResult, SearchResultLink, SearchResultImage, SearchResultVideo } from './search.service.js';

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

export class AiService {
  /**
   * Generates a unique persona using Ollama.
   */
  static async generatePersona(): Promise<PersonaDetails> {
    const prompt = `
      Generate a unique persona for a social media user.
      The persona should have a name, a unique twitter-like handle (without the @ symbol), a short bio, a detailed personality description, and a list of 3-5 interests (e.g., gaming, music, tech, cooking).
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
    const details = await this.generatePersona();
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
            personality: details.personality,
            interests: details.interests,
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
   * Generates a post with optional rich media (links, images, video).
   * The AI decides what media to attach based on search results.
   */
  static async generatePost(user: any, searchResult?: SearchResult): Promise<GeneratedPost> {
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

    const prompt = `
      You are ${user.username}, a social media user with the following personality: ${user.persona.personality}.
      Your interests are: ${Array.isArray(user.persona.interests) ? user.persona.interests.join(', ') : user.persona.interests}.
      ${searchResult?.context ? `Current context/topic: ${searchResult.context}` : 'Talk about something that interests you.'}
      ${mediaContext}

      Write an engaging social media post (max 280 characters for the text).
      
      IMPORTANT RULES:
      - If including a link in your text, use descriptive markdown format: [Descriptive Text](url) — e.g., [Easy Weeknight Recipes](https://example.com) NOT [link] or bare URLs.
      - Choose media to attach based on what fits your post naturally:
        * "link" — attach a link card with rich preview (good for articles, news, recipes)
        * "images" — attach 1-4 images (good for visual topics like nature, food, art, travel)
        * "video" — attach a video embed (good for tutorials, music, entertainment)
        * "none" — no media attachment (for opinions, thoughts, conversations)
      - Pick the best option. Not every post needs media.
      - For media_indices, specify which items from the available lists above to use (by their [index] number).
      - For images, pick 1 to 4 images that look good together.

      Return ONLY a JSON object:
      {
        "content": "Your post text here with optional [Link Text](url)",
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
  static async generateReply(user: any, targetPostContent: string): Promise<string> {
    const prompt = `
      You are ${user.username}, a social media user with the following personality: ${user.persona.personality}.
      Your interests are: ${user.persona.interests.join(', ')}.
      You are replying to this tweet: "${targetPostContent}".
      Write a short, engaging reply (max 280 characters).
      Return ONLY the reply text.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        stream: false,
      });

      return response.response.trim();
    } catch (error) {
      console.error('Error generating reply:', error);
      throw new Error('Failed to generate AI reply');
    }
  }

  /**
   * Decides what action an AI user should take.
   */
  static async decideAction(persona: any): Promise<'POST' | 'REPLY' | 'IDLE'> {
    // Simple logic for now: random chance or LLM based decision
    const rand = Math.random();
    if (rand < 0.1) return 'POST';
    if (rand < 0.2) return 'REPLY';
    return 'IDLE';
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
}
