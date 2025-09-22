
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

  const prompt = `Act as a flashcard generator for students. Create a set of flashcards from the provided note content. Each flashcard must be a JSON object with two fields: "question" (string) and "answer" (string). Return the entire set of flashcards as a single JSON array. Respond with only the JSON array and no additional text, explanation, or markdown formatting.

Note content: ${truncatedContent}`;

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

module.exports = router;

