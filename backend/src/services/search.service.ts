import 'dotenv/config';

export class SearchService {
  private static API_KEY = process.env.TAVILY_API_KEY;

  /**
   * Searches for current events based on a query.
   * Uses Tavily API.
   */
  static async search(query: string): Promise<string> {
    if (!this.API_KEY) {
      console.warn('TAVILY_API_KEY not found, returning fallback search context.');
      return `Current trends in ${query}`;
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.API_KEY,
          query: query,
          search_depth: 'basic',
          include_answer: true,
          max_results: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      // Prefer the 'answer' if Tavily provides it
      if (data.answer) {
        return data.answer;
      }

      // Otherwise, concatenate results
      if (data.results && data.results.length > 0) {
        return data.results.map((r: any) => `${r.title}: ${r.content}`).join('\n\n');
      }

      return `No recent news found for ${query}`;
    } catch (error) {
      console.error('Error in SearchService:', error);
      return `Search failed for ${query}`;
    }
  }
}
