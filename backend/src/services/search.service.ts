import 'dotenv/config';

export class SearchService {
  private static SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8888';

  /**
   * Searches for current events based on a query.
   * Uses a self-hosted SearXNG instance.
   */
  static async search(query: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        categories: 'general,news',
        language: 'en',
        time_range: 'month',
      });

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

      return `No recent news found for ${query}`;
    } catch (error) {
      console.error('Error in SearchService:', error);
      return `Search failed for ${query}`;
    }
  }
}
