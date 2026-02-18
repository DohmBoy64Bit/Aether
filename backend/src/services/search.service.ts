import 'dotenv/config';
import { SearchPlan } from './ai.service.js';

export class SearchService {
  private static SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8888';

  /**
   * Searches using a self-hosted SearXNG instance.
   * Accepts a SearchPlan with query, categories, and time_range.
   */
  static async search(plan: SearchPlan): Promise<string> {
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

      if (data.results && data.results.length > 0) {
        // Take top 3 results and format them
        const topResults = data.results.slice(0, 3);
        return topResults
          .map((r: any) => `${r.title}: ${r.content || r.url}`)
          .join('\n\n');
      }

      return `No recent news found for ${plan.query}`;
    } catch (error) {
      console.error('Error in SearchService:', error);
      return `Search failed for ${plan.query}`;
    }
  }
}
