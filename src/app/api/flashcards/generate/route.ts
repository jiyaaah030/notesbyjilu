import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { generateFlashcardsFromNoteText } from '@/lib/ai/flashcards';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request);

    const body = await request.json();
    const noteContent = body?.noteContent;

    if (!noteContent || typeof noteContent !== 'string') {
      return NextResponse.json(
        { error: 'noteContent is required and must be a string' },
        { status: 400 }
      );
    }

    const flashcards = await generateFlashcardsFromNoteText(noteContent);

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error('Error generating flashcards:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to generate flashcards';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

