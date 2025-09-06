const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../middleware/auth");
const Note = require("../models/Note");
const User = require("../models/User");

// Generate flashcards from note content
router.post("/generate", verifyFirebaseToken, async (req, res) => {
  try {
    const { noteId, content, title } = req.body;

    if (!content || !title) {
      return res.status(400).json({ error: "Note content and title are required" });
    }

    // For now, we'll create sample flashcards
    // In a real implementation, you would integrate with OpenAI or another AI service
    const flashcards = generateSampleFlashcards(content, title);

    res.json(flashcards);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
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
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "..", "uploads", note.filename);

    let sampleContent;
    if (fs.existsSync(filePath)) {
      // File exists, use it
      sampleContent = `This is sample content from ${note.title}. In a real implementation, this would be the actual content extracted from the uploaded file (PDF, DOC, etc.). The AI would then analyze this content to generate relevant flashcards.`;
    } else {
      // File doesn't exist (might be a public note), provide generic content
      sampleContent = `This is sample content from "${note.title}" uploaded by ${note.uploader || 'another user'}. This note covers ${note.subject} topics for ${note.year} year, semester ${note.semester}. In a real implementation, this would be the actual content extracted from the uploaded file.`;
    }

    res.json({ content: sampleContent });
  } catch (error) {
    console.error("Error fetching note content:", error);
    res.status(500).json({ error: "Failed to fetch note content" });
  }
});

// Sample flashcard generation function
function generateSampleFlashcards(content, title) {
  // This is a simplified version. In production, you would use AI to generate these
  const flashcards = [
    {
      question: `What is the main topic of "${title}"?`,
      answer: "This note covers key concepts and information related to the subject matter."
    },
    {
      question: "What are the key learning objectives?",
      answer: "To understand fundamental concepts, apply knowledge practically, and retain important information."
    },
    {
      question: "How can this knowledge be applied?",
      answer: "Through practical examples, problem-solving, and real-world scenarios."
    },
    {
      question: "What are the most important points to remember?",
      answer: "Core concepts, definitions, and relationships between different ideas."
    },
    {
      question: "How does this topic connect to other subjects?",
      answer: "It builds foundational knowledge that supports advanced topics and interdisciplinary understanding."
    },
    {
      question: "What are common challenges in this area?",
      answer: "Understanding complex relationships, applying concepts correctly, and memorizing key details."
    },
    {
      question: "What are the practical implications?",
      answer: "Real-world applications, problem-solving approaches, and decision-making frameworks."
    },
    {
      question: "How can you test your understanding?",
      answer: "Through practice questions, examples, and self-assessment techniques."
    },
    {
      question: "What are the next steps after learning this?",
      answer: "Apply knowledge, explore advanced topics, and integrate with existing understanding."
    },
    {
      question: "Why is this topic important?",
      answer: "It provides essential knowledge for academic success and practical application."
    }
  ];

  return flashcards;
}

module.exports = router;
