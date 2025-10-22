import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateFlashcards(noteContent: string) {
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

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request);
    const { noteContent } = await request.json();

    if (!noteContent || typeof noteContent !== 'string') {
      return NextResponse.json({ error: "noteContent is required and must be a string" }, { status: 400 });
    }

    const flashcards = await generateFlashcards(noteContent);

    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate flashcards";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
