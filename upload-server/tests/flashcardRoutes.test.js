const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  verifyFirebaseToken: jest.fn((req, res, next) => next()),
}));

jest.mock('../models/Note');

const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

// Mock dependencies
jest.mock('fs');
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('axios');

const axios = require('axios');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Mock the extractTextFromFile function specifically
jest.mock('../routes/flashcardRoutes', () => {
  const actual = jest.requireActual('../routes/flashcardRoutes');
  return {
    ...actual,
    extractTextFromFile: jest.fn(),
  };
});

const flashcardRoutes = require('../routes/flashcardRoutes');
const { extractTextFromFile } = flashcardRoutes;

const { verifyFirebaseToken } = require('../middleware/auth');
const Note = require('../models/Note');

const app = express();
app.use(express.json());
app.use('/api/flashcards', flashcardRoutes);

describe('Flashcard Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /note/:noteId/content', () => {
    it('should return note content on success', async () => {
      const mockNote = {
        _id: 'noteId123',
        title: 'Test Note',
        subject: 'Math',
        year: '2023',
        semester: '1',
        fileUrl: 'http://example.com/test.pdf',
        uploader: 'user123',
      };

      Note.findById.mockResolvedValue(mockNote);

      // Mock extractTextFromFile to return the expected content
      extractTextFromFile.mockResolvedValue('Extracted text content from PDF.');

      const res = await request(app)
        .get('/api/flashcards/note/noteId123/content');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('content');
      expect(res.body.content).toBe('Extracted text content from PDF.');
      expect(Note.findById).toHaveBeenCalledWith('noteId123');
    });

    it('should return 404 if note not found', async () => {
      Note.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/flashcards/note/invalidId/content');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Note not found');
    });

    it('should return fallback content if extraction fails', async () => {
      const mockNote = {
        _id: 'noteId123',
        title: 'Test Note',
        subject: 'Math',
        year: '2023',
        semester: '1',
        fileUrl: 'http://example.com/test.pdf',
        uploader: 'user123',
      };

      Note.findById.mockResolvedValue(mockNote);

      // Mock extractTextFromFile to throw error
      const extractTextFromFile = require('../routes/flashcardRoutes').extractTextFromFile;
      extractTextFromFile.mockRejectedValue(new Error('Extraction failed'));

      const res = await request(app)
        .get('/api/flashcards/note/noteId123/content');

      expect(res.statusCode).toBe(200);
      expect(res.body.content).toContain('sample content from "Test Note"');
      expect(res.body.content).toContain('text extraction failed');
    });

    it('should return generic content if no fileUrl', async () => {
      const mockNote = {
        _id: 'noteId123',
        title: 'Test Note',
        subject: 'Math',
        year: '2023',
        semester: '1',
        fileUrl: null,
        uploader: 'user123',
      };

      Note.findById.mockResolvedValue(mockNote);

      const res = await request(app)
        .get('/api/flashcards/note/noteId123/content');

      expect(res.statusCode).toBe(200);
      expect(res.body.content).toContain('sample content from "Test Note"');
      expect(res.body.content).toContain('not available for text extraction');
    });
  });

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

      mockGenerateContent.mockRejectedValue(new Error('AI error'));

      const res = await request(app)
        .post('/api/flashcards/generate')
        .send({ noteContent: 'test content' });

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBe('Failed to generate flashcards from AI');
    });

    it('should return 200 and flashcards array on success', async () => {
      process.env.GOOGLE_API_KEY = 'valid_key';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            { question: "What is AI?", answer: "Artificial Intelligence" },
            { question: "What is a flashcard?", answer: "A study aid" }
          ])
        }
      });

      const res = await request(app)
        .post('/api/flashcards/generate')
        .send({ noteContent: 'This is a test note content' });

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('question');
      expect(res.body[0]).toHaveProperty('answer');
    });
  });

  describe('POST /ask', () => {
    it('should return 400 if noteId is missing', async () => {
      const res = await request(app)
        .post('/api/flashcards/ask')
        .send({ question: 'What is AI?' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('noteId and question are required');
    });

    it('should return 400 if question is missing', async () => {
      const res = await request(app)
        .post('/api/flashcards/ask')
        .send({ noteId: 'noteId123' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('noteId and question are required');
    });

    it('should return 400 if question is not a string or empty', async () => {
      const res = await request(app)
        .post('/api/flashcards/ask')
        .send({ noteId: 'noteId123', question: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('noteId and question are required');
    });

    it('should return 404 if note not found', async () => {
      Note.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/flashcards/ask')
        .send({ noteId: 'invalidId', question: 'What is AI?' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Note not found');
    });

    it('should return 200 and answer on success', async () => {
      const mockNote = {
        _id: 'noteId123',
        title: 'Test Note',
        subject: 'Math',
        year: '2023',
        semester: '1',
        fileUrl: 'http://example.com/test.pdf',
        uploader: 'user123',
      };

      Note.findById.mockResolvedValue(mockNote);

      // Mock extractTextFromFile
      const extractTextFromFile = require('../routes/flashcardRoutes').extractTextFromFile;
      extractTextFromFile.mockResolvedValue('Extracted text content from PDF.');

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'AI stands for Artificial Intelligence, which is a field of computer science.'
        }
      });

      const res = await request(app)
        .post('/api/flashcards/ask')
        .send({ noteId: 'noteId123', question: 'What is AI?' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('answer');
      expect(typeof res.body.answer).toBe('string');
    });

    it('should return fallback content and answer if extraction fails', async () => {
      const mockNote = {
        _id: 'noteId123',
        title: 'Test Note',
        subject: 'Math',
        year: '2023',
        semester: '1',
        fileUrl: 'http://example.com/test.pdf',
        uploader: 'user123',
      };

      Note.findById.mockResolvedValue(mockNote);

      // Mock extractTextFromFile to throw error
      const extractTextFromFile = require('../routes/flashcardRoutes').extractTextFromFile;
      extractTextFromFile.mockRejectedValue(new Error('Extraction failed'));

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'This is a sample answer based on fallback content.'
        }
      });

      const res = await request(app)
        .post('/api/flashcards/ask')
        .send({ noteId: 'noteId123', question: 'What is AI?' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('answer');
    });
  });

  describe('Real User Flow: Select Note and Generate Flashcards', () => {
    it('should simulate user selecting a note and generating flashcards', async () => {
      // Step 1: Mock note selection (GET content)
      const mockNote = {
        _id: 'noteId123',
        title: 'Selected Note',
        subject: 'Science',
        year: '2023',
        semester: '2',
        fileUrl: 'http://example.com/note.pdf',
        uploader: 'user123',
      };

      Note.findById.mockResolvedValue(mockNote);

      const extractTextFromFile = require('../routes/flashcardRoutes').extractTextFromFile;
      extractTextFromFile.mockResolvedValue('This is the content of the selected note for flashcard generation.');

      // Fetch content
      const contentRes = await request(app)
        .get('/api/flashcards/note/noteId123/content');

      expect(contentRes.statusCode).toBe(200);
      const noteContent = contentRes.body.content;

      // Step 2: Generate flashcards from the fetched content
      process.env.GOOGLE_API_KEY = 'valid_key';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            { question: "What is the main topic?", answer: "Science concepts" },
            { question: "Explain the content.", answer: "Detailed explanation here" }
          ])
        }
      });

      const generateRes = await request(app)
        .post('/api/flashcards/generate')
        .send({ noteContent });

      expect(generateRes.statusCode).toBe(200);
      expect(Array.isArray(generateRes.body)).toBe(true);
      expect(generateRes.body.length).toBe(2);
    });
  });
});
