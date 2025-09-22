const request = require('supertest');
const express = require('express');
const flashcardRoutes = require('../routes/flashcardRoutes');
const { verifyFirebaseToken } = require('../middleware/auth');

jest.mock('../middleware/auth', () => ({
  verifyFirebaseToken: jest.fn((req, res, next) => next()),
}));

const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);

describe('Flashcard Routes', () => {
  describe('POST /generate', () => {
    it('should return 400 if noteContent is missing', async () => {
      const res = await request(app)
        .post('/api/flashcards/generate')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('noteContent is required and must be a string');
    });

    it('should return 400 if noteContent is not a string', async () => {
      const res = await request(app)
        .post('/api/flashcards/generate')
        .send({ noteContent: 123 });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('noteContent is required and must be a string');
    });

    it('should return 500 if API key is missing', async () => {
      const originalApiKey = process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const res = await request(app)
        .post('/api/flashcards/generate')
        .send({ noteContent: 'test content' });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('GOOGLE_API_KEY environment variable is not set');

      process.env.GOOGLE_API_KEY = originalApiKey;
    });

    it('should return 500 if AI service throws error', async () => {
      process.env.GOOGLE_API_KEY = 'fake_key';

      // Mock the AI model to throw error
      jest.mock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: () => ({
            generateContent: () => { throw new Error('AI error'); }
          })
        }))
      }));

      const res = await request(app)
        .post('/api/flashcards/generate')
        .send({ noteContent: 'test content' });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to generate flashcards from AI');
    });

    // Additional tests for successful response can be added with proper mocking
  });
});
