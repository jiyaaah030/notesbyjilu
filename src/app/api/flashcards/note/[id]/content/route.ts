import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { extractTextFromNoteFile } from '@/lib/notes/extractTextFromNoteFile';


export const runtime = 'nodejs';

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Prevent Next.js build from trying to execute this route during `next build`.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Not available during build' },
      { status: 503 }
    );
  }

  try {
    await verifyAuth(request);
    await connectDB();

    const { id } = await params;

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    if (!note.fileUrl) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Note has no fileUrl' },
        { status: 400 }
      );
    }

    const { text } = await extractTextFromNoteFile(note.fileUrl);
    if (!text || text.trim().length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Unable to extract text from note' },
        { status: 422 }
      );
    }

    return NextResponse.json<ApiResponse<{ content: string }>>(
      { success: true, data: { content: text } },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch note content';
    console.error('flashcards note content error:', message);

    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to fetch note content' },
      { status: 500 }
    );
  }
}

