import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import OpenAI from 'openai';

async function generateFlashcards(noteContent: string) {
  const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}

const client = new OpenAI({
  apiKey,
  baseURL: 'https://api.groq.com/openai/v1',
});

  // Truncate noteContent to avoid exceeding API limits
  const truncatedContent = noteContent.length > 5000 ? noteContent.substring(0, 5000) + '...' : noteContent;

  const prompt = `Act as an expert educational content creator for students. Create a comprehensive set of flashcards from the provided note content. 
                  Each flashcard should be a JSON object with:\n-
                   \"question\" (string): A clear, specific question that tests understanding\n-
                   \"answer\" (string): A short, comprehensive answer that explains the concept thoroughly\n\nGuidelines for creating effective flashcards:\n-
                    Create 5-8 flashcards covering the most important concepts\n-
                     Make questions progressively more challenging\n- 
                     Include practical examples and applications when relevant\n- 
                     Provide explanations in answers, not just basic facts\n- 
                     Connect related concepts when appropriate\n-
                     Focus on understanding rather than rote memorization\n\n
                     Note content: ${truncatedContent}\n\n
                     Return ONLY valid JSON in this exact format:

{
  "flashcards": [
    {
      "question": "Question here",
      "answer": "Answer here"
    }
  ]
}

Do not use markdown.
Do not explain anything.`;

  try {
    const completion = await client.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    {
      role: 'system',
      content:
        'Return ONLY valid JSON arrays. No markdown. No explanations.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ],
  temperature: 0.1,
  max_tokens: 1500,
  response_format: { type: 'json_object' },
});

    const text = completion.choices?.[0]?.message?.content ?? '';

    // Clean the response to remove markdown formatting
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let flashcards;

try {
  const parsed = JSON.parse(cleaned);
  flashcards = parsed.flashcards;
  if (!flashcards) {
  throw new Error("Flashcards array missing from AI response");
}
} catch (err) {
  console.error("RAW AI RESPONSE:", cleaned);
  throw new Error("AI returned invalid JSON");
}



    // Validate the structure
    if (!Array.isArray(flashcards)) {
      throw new Error('Response is not a valid JSON array');
    }

    for (const card of flashcards) {
      if (typeof card !== 'object' || !card.question || !card.answer) {
        throw new Error('Invalid flashcard structure');
      }
    }

    return flashcards;
  } catch (error) {
    console.error(error);
throw error;
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
