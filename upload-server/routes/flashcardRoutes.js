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
const fetch = require("node-fetch"); // IMPORTANT FIX

/**
 * Extract text from uploaded note file
 */
async function extractTextFromFile(fileSource) {
  const ext = path.extname(fileSource).toLowerCase();
  let dataBuffer;

  if (fileSource.startsWith("http")) {
    const response = await fetch(fileSource);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    dataBuffer = Buffer.from(await response.arrayBuffer());
  } else {
    dataBuffer = fs.readFileSync(fileSource);
  }

  if (ext === ".pdf") {
    const data = await pdfParse(dataBuffer);
    if (!data.text.trim()) throw new Error("No text found in PDF");
    return data.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    if (!result.value.trim()) throw new Error("No text found in DOCX");
    return result.value;
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Generate flashcards using Gemini AI
 */
async function generateFlashcards(noteContent) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const truncatedContent =
    noteContent.length > 5000 ? noteContent.slice(0, 5000) + "..." : noteContent;

  const prompt = `
You are generating HIGH-QUALITY revision flashcards based ONLY on the provided note content.

RULES:
- DO NOT create generic flashcards
- Only use content from the notes
- Create 12–18 flashcards
- Answers must be MAX 25 words

FORMAT:
[
 { "question": "...", "answer": "..." }
]

CONTENT:
${truncatedContent}

Return ONLY the JSON array.`;

  try {
    const result = await model.generateContent(prompt);
    let text = await result.response.text();

    text = text.replace(/```json|```/g, "").trim();

    // Parse safely
    const flashcards = JSON.parse(text);

    if (!Array.isArray(flashcards)) throw new Error("AI output is not an array");

    flashcards.forEach(card => {
      if (!card.question || !card.answer) {
        throw new Error("Invalid flashcard format");
      }
    });

    return flashcards;
  } catch (err) {
    console.error("Flashcard AI Error:", err);
    throw new Error("Flashcard generation failed");
  }
}

/**
 * Generate AI Answer for a question
 */
async function generateAnswer(noteContent, question) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const truncatedContent =
    noteContent.length > 4000 ? noteContent.slice(0, 4000) + "..." : noteContent;

  const prompt = `
You are a helpful tutor. Use ONLY the provided note content.
Explain concepts in a simple way.

NOTES:
${truncatedContent}

QUESTION:
${question}

ANSWER:
`;

  try {
    const result = await model.generateContent(prompt);
    return (await result.response.text()).trim();
  } catch (err) {
    console.error("Answer AI Error:", err);
    throw new Error("Failed to generate answer");
  }
}

/**
 * ROUTES
 */
router.post("/generate", verifyFirebaseToken, async (req, res) => {
  try {
    const { noteContent } = req.body;
    if (!noteContent) return res.status(400).json({ error: "noteContent missing" });

    const flashcards = await generateFlashcards(noteContent);
    res.json(flashcards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/note/:noteId/content", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("📌 Backend received noteId:", req.params.noteId); // 👈 ADD THIS HERE

    const note = await Note.findById(req.params.noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (!note.fileUrl) {
      console.error('Note missing fileUrl for id:', req.params.noteId);
      return res.status(400).json({ error: 'Note has no fileUrl' });
    }

    // Extract just the filename from fileUrl (e.g., /uploads/filename.pdf -> filename.pdf)
    const filename = path.basename(String(note.fileUrl));
    
    // Resolve paths relative to project root (parent of upload-server)
    const projectRoot = path.resolve(__dirname, "..", "..");
    const paths = [
      path.join(projectRoot, "public", "uploads", filename),
      path.join(projectRoot, "upload-server", "uploads", filename),
    ];

    console.log("Looking for file at paths:", paths);
    console.log("Exists? at public/uploads:", fs.existsSync(paths[0]));
    console.log("Exists? at upload-server/uploads:", fs.existsSync(paths[1]));

    let content;
    for (const p of paths) {
      if (fs.existsSync(p)) {
        console.log("Found file at:", p);
        content = await extractTextFromFile(p);
        break;
      }
    }

    if (!content) return res.status(404).json({ error: "File not found on server" });

    res.json({ content });
  } catch (err) {
    console.error("🔥 Error in content route:", err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/ask", verifyFirebaseToken, async (req, res) => {
  try {
    const { noteId, question } = req.body;

    if (!noteId || !question) {
      return res.status(400).json({ error: "noteId and question required" });
    }

    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ error: "Note not found" });

    if (!note.fileUrl) {
      return res.status(400).json({ error: "Note has no fileUrl" });
    }

    // Extract just the filename from fileUrl
    const filename = path.basename(String(note.fileUrl));
    
    // Resolve paths relative to project root
    const projectRoot = path.resolve(__dirname, "..", "..");
    const paths = [
      path.join(projectRoot, "public", "uploads", filename),
      path.join(projectRoot, "upload-server", "uploads", filename),
    ];
    
    let filePath;
    for (const p of paths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }
    
    if (!filePath)
      return res.status(404).json({ error: "File missing" });

    const content = await extractTextFromFile(filePath);
    const answer = await generateAnswer(content, question);

    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
