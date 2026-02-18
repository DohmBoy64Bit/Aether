
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LinkPreview {
    url: string;
    title: string;
    description?: string;
    image?: string;
    siteName?: string;
}

export class LinkPreviewService {
    /**
     * Fetches the URL and parses OpenGraph tags to return a link preview.
     */
    static async getPreview(url: string): Promise<LinkPreview> {
        try {
            // Basic validation
            new URL(url);

            const response = await axios.get(url, {
                timeout: 5000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; AetherBot/1.0; +http://localhost:3000)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                },
                maxContentLength: 5 * 1024 * 1024, // 5MB max
            });

            const html = response.data;
            const $ = cheerio.load(html);

            const getMeta = (prop: string) =>
                $(`meta[property="${prop}"]`).attr('content') ||
                $(`meta[name="${prop}"]`).attr('content');

            const title = getMeta('og:title') || $('title').text() || url;
            const description = getMeta('og:description') || getMeta('description');
            const image = getMeta('og:image');
            const siteName = getMeta('og:site_name');

            return {
                url,
                title,
                description,
                image,
                siteName,
            };
        } catch (error) {
            console.error('Error fetching link preview for:', url, error);
            // Return basic preview on failure
            return {
                url,
                title: url,
            };
        }
    }
}
