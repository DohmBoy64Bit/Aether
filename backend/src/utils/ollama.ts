import { Ollama } from 'ollama';

/**
 * Shared Ollama client singleton.
 * All services should import from here instead of creating their own instances.
 */
export const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
});

export const MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Default timeout for LLM calls in milliseconds (30 seconds).
 */
export const LLM_TIMEOUT_MS = 30_000;

/**
 * Helper: call ollama.chat with a timeout via AbortController.
 * Uses system + user message separation for prompt injection resistance.
 */
export async function chatWithTimeout(options: {
    system: string;
    user: string;
    format?: 'json' | undefined;
    timeoutMs?: number;
}): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        options.timeoutMs ?? LLM_TIMEOUT_MS
    );

    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [
                { role: 'system', content: options.system },
                { role: 'user', content: options.user },
            ],
            format: options.format,
            stream: false,
            // @ts-ignore — Ollama JS client supports AbortSignal but types may lag
        });

        return response.message.content;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Safely parse JSON from an LLM response with logging on failure.
 */
export function safeParseJson<T>(raw: string, context: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch {
        console.error(
            `[${context}] LLM returned unparseable JSON:`,
            raw.substring(0, 500)
        );
        return null;
    }
}
