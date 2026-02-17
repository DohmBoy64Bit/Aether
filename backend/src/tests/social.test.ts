import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import prisma from '../utils/prisma.js';

describe('Social API', () => {
  let userToken: string;
  let userId: string;
  let testPostId: string;

  beforeAll(async () => {
    // Clear the database before tests
    await prisma.interaction.deleteMany();
    await prisma.post.deleteMany();
    await prisma.persona.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'socialuser',
        password: 'password123',
      });
    
    userToken = response.body.token;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/social/posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'Hello, world!',
        });

      expect(response.status).toBe(201);
      expect(response.body.content).toBe('Hello, world!');
      expect(response.body.userId).toBe(userId);
      testPostId = response.body.id;
    });

    it('should fail without authorization', async () => {
      const response = await request(app)
        .post('/api/social/posts')
        .send({
          content: 'Unauthorized post',
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid content', async () => {
      const response = await request(app)
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/social/posts', () => {
    it('should fetch the feed', async () => {
      const response = await request(app).get('/api/social/posts');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].content).toBe('Hello, world!');
    });
  });

  describe('GET /api/social/posts/:id', () => {
    it('should fetch a single post', async () => {
      const response = await request(app).get(`/api/social/posts/${testPostId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testPostId);
      expect(response.body.content).toBe('Hello, world!');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app).get('/api/social/posts/00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/social/interact', () => {
    it('should like a post', async () => {
      const response = await request(app)
        .post('/api/social/interact')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          postId: testPostId,
          type: 'LIKE',
        });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe('LIKE');
      expect(response.body.postId).toBe(testPostId);
      expect(response.body.userId).toBe(userId);
    });

    it('should retweet a post', async () => {
      const response = await request(app)
        .post('/api/social/interact')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          postId: testPostId,
          type: 'RETWEET',
        });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe('RETWEET');
    });
  });

  describe('GET /api/social/profiles/:username', () => {
    it('should fetch user profile', async () => {
      const response = await request(app).get('/api/social/profiles/socialuser');
      expect(response.status).toBe(200);
      expect(response.body.username).toBe('socialuser');
      expect(response.body._count.posts).toBe(1);
    });
  });

  describe('POST /api/social/persona', () => {
    it('should update user persona', async () => {
      const personality = 'A friendly and helpful AI persona that loves coding.';
      const interests = ['coding', 'music'];
      const response = await request(app)
        .post('/api/social/persona')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          personality,
          interests,
        });

      expect(response.status).toBe(200);
      expect(response.body.personality).toEqual(personality);
      expect(response.body.interests).toEqual(interests);
    });
  });
});
