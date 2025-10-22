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
      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: () => ({
            generateContent: () => { throw new Error('AI error'); }
          })
        }))
      }));

      // Re-require the routes to use the new mock
      jest.resetModules();
      const flashcardRoutesMock = require('../routes/flashcardRoutes');
      const appMock = express();
      appMock.use(express.json());
      appMock.use('/api/flashcards', flashcardRoutesMock);

      const res = await request(appMock)
        .post('/api/flashcards/generate')
        .send({ noteContent: 'test content' });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to generate flashcards from AI');
    });

    it('should return 200 and flashcards array on success', async () => {
      process.env.GOOGLE_API_KEY = 'valid_key';

      // Mock the AI model to return success
      jest.doMock('@google/generative-ai', () => ({
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
          getGenerativeModel: () => ({
            generateContent: jest.fn().mockResolvedValue({
              response: {
                text: () => JSON.stringify([
                  { question: "What is AI?", answer: "Artificial Intelligence" },
                  { question: "What is a flashcard?", answer: "A study aid" }
                ])
              }
            })
          })
        }))
      }));

      // Re-require the routes to use the new mock
      jest.resetModules();
      const flashcardRoutesMock = require('../routes/flashcardRoutes');
      const appMock = express();
      appMock.use(express.json());
      appMock.use('/api/flashcards', flashcardRoutesMock);

      const res = await request(appMock)
        .post('/api/flashcards/generate')
        .send({ noteContent: 'This is a test note content' });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('question');
      expect(res.body[0]).toHaveProperty('answer');
    });
  });
});
