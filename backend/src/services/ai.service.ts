import { Ollama } from 'ollama';
import prisma from '../utils/prisma.js';
import { hashPassword } from '../utils/auth.js';
import crypto from 'crypto';

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' });
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

export interface PersonaDetails {
  name: string;
  handle: string;
  bio: string;
  personality: string;
  interests: string[];
}

export class AiService {
  /**
   * Generates a unique persona using Ollama.
   */
  static async generatePersona(): Promise<PersonaDetails> {
    const prompt = `
      Generate a unique persona for a social media user.
      The persona should have a name, a unique twitter-like handle (starting with @), a short bio, a detailed personality description, and a list of 3-5 interests (e.g., gaming, music, tech, cooking).
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
      // Ensure handle starts with @
      if (!persona.handle.startsWith('@')) {
        persona.handle = '@' + persona.handle;
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
   * Generates a post content based on a persona and optional context (e.g., current events).
   */
  static async generatePost(user: any, context?: string): Promise<string> {
    const prompt = `
      You are ${user.username}, a social media user with the following personality: ${user.persona.personality}.
      Your interests are: ${user.persona.interests.join(', ')}.
      ${context ? `Current context/topic: ${context}` : 'Talk about something that interests you.'}
      Write a short, engaging tweet (max 280 characters). Do not use hashtags unless it fits the persona.
      Return ONLY the tweet text.
    `;

    try {
      const response = await ollama.generate({
        model: MODEL,
        prompt: prompt,
        stream: false,
      });

      return response.response.trim();
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
}
