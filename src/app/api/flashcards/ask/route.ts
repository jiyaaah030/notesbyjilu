import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { extractNoteTextFromFile } from '@/lib/notes/extractNoteText';
import { askQuestionWithNotes } from '@/lib/ai/ask';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Prevent Next.js static build from failing if it tries to execute this route.
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    return NextResponse.json(
      { error: 'Not available during build' },
      { status: 503 }
    );
  }

  try {
    await verifyAuth(request);
    await connectDB();

    const body = await request.json();
    const noteId = body?.noteId;
    const question = body?.question;

    if (!noteId || typeof noteId !== 'string') {
      return NextResponse.json({ error: 'noteId is required' }, { status: 400 });
    }
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'question is required and must be a string' },
        { status: 400 }
      );
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const { text: noteText } = await extractNoteTextFromFile({
      noteFilename: (note as any).filename,
      noteFileUrl: (note as any).fileUrl,
    });

    if (!noteText || noteText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Unable to extract text from this note' },
        { status: 422 }
      );
    }

    const answer = await askQuestionWithNotes({
      noteText,
      question,
    });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Error asking question:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get answer';

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}



