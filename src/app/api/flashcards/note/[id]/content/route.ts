import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Prevent Next.js build from trying to execute this route during `next build`.
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Not available during build' }, { status: 503 });
  }

  try {
    await verifyAuth(request);
    await connectDB();

    const { id } = await params;

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (!note.fileUrl) {
      return NextResponse.json({ error: 'Note has no fileUrl' }, { status: 400 });
    }

    // Normalize file path
    let fileUrl = note.fileUrl.replace(/\/uploads\/uploads\//, '/uploads/');

    // Remote file handling
    if (/^https?:\/\//i.test(fileUrl)) {
      const res = await fetch(fileUrl);
      if (!res.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch remote file URL', details: `${res.status} ${res.statusText}` },
          { status: 404 }
        );
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = path.extname(new URL(fileUrl).pathname).toLowerCase();

      if (ext === '.pdf') {
        const { default: pdfParse } = await import('pdf-parse');
        const data = await pdfParse(buffer);
        return NextResponse.json({ content: data.text });
      }

      if (ext === '.docx') {
        const mammoth = await import('mammoth');
        const extractRawText = mammoth.default?.extractRawText ?? (mammoth as any).extractRawText;
        if (!extractRawText) {
          return NextResponse.json({ error: 'mammoth.extractRawText not available' }, { status: 500 });
        }
        const result = await extractRawText({ buffer });
        return NextResponse.json({ content: result.value });
      }

      return NextResponse.json({ error: 'Unsupported remote file type' }, { status: 415 });
    }

    // Local file handling
    let filePath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));

    if (!fs.existsSync(filePath)) {
      filePath = path.join(
        process.cwd(),
        'upload-server',
        'uploads',
        path.basename(fileUrl)
      );

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found at paths' }, { status: 404 });
      }
    }

    const dataBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const { default: pdfParse } = await import('pdf-parse');
      const data = await pdfParse(dataBuffer);
      return NextResponse.json({ content: data.text });
    }

    if (ext === '.docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return NextResponse.json({ content: result.value });
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: 'Failed to fetch note content',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

