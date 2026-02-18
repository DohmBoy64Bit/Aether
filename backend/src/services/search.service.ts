import 'dotenv/config';
import { SearchPlan } from './ai.service.js';

export interface SearchResultLink {
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface SearchResultImage {
  url: string;
  alt?: string;
}

export interface SearchResultVideo {
  url: string;
  iframe_src: string;
  title: string;
  thumbnail?: string;
}

export interface SearchResult {
  context: string;
  links: SearchResultLink[];
  images: SearchResultImage[];
  videos: SearchResultVideo[];
}

export class SearchService {
  private static SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8888';

  /**
   * Searches using a self-hosted SearXNG instance.
   * Returns structured results including links, images, and videos.
   */
  static async search(plan: SearchPlan): Promise<SearchResult> {
    const result: SearchResult = {
      context: '',
      links: [],
      images: [],
      videos: [],
    };

    try {
      const params = new URLSearchParams({
        q: plan.query,
        format: 'json',
        categories: plan.categories.join(','),
        language: 'en',
      });

      if (plan.time_range) {
        params.set('time_range', plan.time_range);
      }

      const response = await fetch(`${this.SEARXNG_URL}/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`SearXNG API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      if (!data.results || data.results.length === 0) {
        result.context = `No recent news found for ${plan.query}`;
        return result;
      }

      // Process results by category
      for (const r of data.results) {
        if (r.category === 'images' && r.img_src) {
          result.images.push({
            url: r.img_src,
            alt: r.title || undefined,
          });
        } else if (r.category === 'videos' && r.iframe_src) {
          result.videos.push({
            url: r.url,
            iframe_src: r.iframe_src,
            title: r.title || '',
            thumbnail: r.thumbnail || undefined,
          });
        } else if (r.url && r.title) {
          // General/news/other text results → links
          result.links.push({
            url: r.url,
            title: r.title,
            description: r.content || undefined,
            thumbnail: r.img_src || r.thumbnail || undefined,
          });
        }
      }

      // Cap results to avoid overwhelming the AI prompt
      result.links = result.links.slice(0, 5);
      result.images = result.images.slice(0, 6);
      result.videos = result.videos.slice(0, 3);

      // Build context string for the AI prompt (top 3 links)
      const topLinks = result.links.slice(0, 3);
      result.context = topLinks
        .map((l) => `${l.title}: ${l.description || l.url}`)
        .join('\n\n');

      if (!result.context) {
        result.context = `No recent news found for ${plan.query}`;
      }

      return result;
    } catch (error) {
      console.error('Error in SearchService:', error);
      result.context = `Search failed for ${plan.query}`;
      return result;
    }
  }
}
