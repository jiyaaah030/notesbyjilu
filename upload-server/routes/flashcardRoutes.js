
const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../middleware/auth");
const Note = require("../models/Note");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extracts text content from a file based on its extension.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} The extracted text content.
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * @typedef {Object} Flashcard
 * @property {string} question - The question for the flashcard
 * @property {string} answer - The answer for the flashcard
 */

/**
 * Generates flashcards from the provided note content using Google's Gemini API.
 * @param {string} noteContent - The text content of the note to generate flashcards from.
 * @returns {Promise<Flashcard[]>} A promise that resolves to an array of flashcard objects.
 */
async function generateFlashcards(noteContent) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Truncate noteContent to avoid exceeding API limits
  const truncatedContent = noteContent.length > 5000 ? noteContent.substring(0, 5000) + "..." : noteContent;

  const prompt = `Act as an expert educational content creator for students. Create a comprehensive set of flashcards from the provided note content. Each flashcard should be a JSON object with:
- "question" (string): A clear, specific question that tests understanding
- "answer" (string): A short, comprehensive answer that explains the concept thoroughly

Guidelines for creating effective flashcards:
- Create 10-20 flashcards covering the most important concepts
- Make questions progressively more challenging
- Include practical examples and applications when relevant
- Provide explanations in answers, not just basic facts
- Connect related concepts when appropriate
- Focus on understanding rather than rote memorization

Note content: ${truncatedContent}

Return the entire set of flashcards as a single JSON array. Respond with only the JSON array and no additional text, explanation, or markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response to remove markdown formatting
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    const flashcards = JSON.parse(text);

    // Validate the structure
    if (!Array.isArray(flashcards)) {
      throw new Error("Response is not a valid JSON array");
    }

    for (const card of flashcards) {
      if (typeof card !== 'object' || !card.question || !card.answer) {
        throw new Error("Invalid flashcard structure");
      }
    }

    return flashcards;
  } catch (error) {
    console.error("Error generating flashcards with Gemini:", error);
    throw new Error("Failed to generate flashcards from AI");
  }
}

/**
 * Generates an answer to a question based on the provided note content using Google's Gemini API.
 * @param {string} noteContent - The text content of the note to base the answer on.
 * @param {string} question - The user's question.
 * @returns {Promise<string>} A promise that resolves to the AI-generated answer.
 */
async function generateAnswer(noteContent, question) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Truncate noteContent to avoid exceeding API limits
  const truncatedContent = noteContent.length > 4000 ? noteContent.substring(0, 4000) + "..." : noteContent;

  const prompt = `You are a helpful AI tutor assisting students with their academic questions. Use the provided note content as your primary knowledge base, but feel free to draw on general knowledge to provide more comprehensive and detailed explanations when helpful.

Note content: ${truncatedContent}

Question: ${question}

Guidelines:
- Act as an expert mentor who answers in point to point statements and easy way
- Provide detailed, comprehensive answers with examples when appropriate
- Explain concepts thoroughly with step-by-step reasoning
- If the question relates to the notes, connect your answer directly to the content
- If the question goes beyond the notes, provide helpful context while noting the connection to the material
- Be encouraging and supportive in your tone
- Use clear, educational language suitable for students
- Feel free to elaborate on related concepts that would help with understanding

Respond with a detailed, helpful answer that goes beyond basic responses.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();

    return answer;
  } catch (error) {
    console.error("Error generating answer with Gemini:", error);
    throw new Error("Failed to generate answer from AI");
  }
}

// Generate flashcards from note content
router.post("/generate", verifyFirebaseToken, async (req, res) => {
  try {
    const { noteContent } = req.body;

    if (!noteContent || typeof noteContent !== 'string') {
      return res.status(400).json({ error: "noteContent is required and must be a string" });
    }

    const flashcards = await generateFlashcards(noteContent);

    res.status(200).json(flashcards);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: error.message || "Failed to generate flashcards" });
  }
});

// Get note content for flashcard generation
router.get("/note/:noteId/content", verifyFirebaseToken, async (req, res) => {
  try {
    const { noteId } = req.params;

    // Find the note (allow any public note)
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Try to read the file content, but provide fallback for public notes
    const filePath = path.join(__dirname, "..", "uploads", note.filename);

    let content;
    if (fs.existsSync(filePath)) {
      try {
        // Extract actual content from the file
        content = await extractTextFromFile(filePath);
      } catch (extractionError) {
        console.error("Error extracting text from file:", extractionError);
        // Fallback to generic content if extraction fails
        content = `This is sample content from "${note.title}". The file exists but text extraction failed. This note covers ${note.subject} topics for ${note.year} year, semester ${note.semester}.`;
      }
    } else {
      // File doesn't exist (might be a public note), provide generic content
      content = `This is sample content from "${note.title}" uploaded by ${note.uploader || 'another user'}. This note covers ${note.subject} topics for ${note.year} year, semester ${note.semester}. The uploaded file is not available for text extraction.`;
    }

    res.json({ content });
  } catch (error) {
    console.error("Error fetching note content:", error);
    res.status(500).json({ error: "Failed to fetch note content" });
  }
});

// Ask questions about note content
router.post("/ask", verifyFirebaseToken, async (req, res) => {
  try {
    const { noteId, question } = req.body;

    if (!noteId || !question) {
      return res.status(400).json({ error: "noteId and question are required" });
    }

    if (typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: "question must be a non-empty string" });
    }

    // Find the note
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    // Get note content
    const filePath = path.join(__dirname, "..", "uploads", note.filename);
    let content;

    if (fs.existsSync(filePath)) {
      try {
        content = await extractTextFromFile(filePath);
      } catch (extractionError) {
        console.error("Error extracting text from file:", extractionError);
        content = `This is sample content from "${note.title}". The file exists but text extraction failed. This note covers ${note.subject} topics for ${note.year} year, semester ${note.semester}.`;
      }
    } else {
      content = `This is sample content from "${note.title}" uploaded by ${note.uploader || 'another user'}. This note covers ${note.subject} topics for ${note.year} year, semester ${note.semester}. The uploaded file is not available for text extraction.`;
    }

    // Generate answer using AI
    const answer = await generateAnswer(content, question);

    res.status(200).json({ answer });
  } catch (error) {
    console.error("Error generating answer:", error);
    res.status(500).json({ error: error.message || "Failed to generate answer" });
  }
});

module.exports = router;

