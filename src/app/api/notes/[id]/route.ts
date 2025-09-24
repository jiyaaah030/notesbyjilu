import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const decodedToken = await verifyAuth(request);

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (note.uploaderUid !== decodedToken.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await note.deleteOne();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const decodedToken = await verifyAuth(request);

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.uploaderUid !== decodedToken.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, filename, year, semester, subject, description } = await request.json();
    if (title !== undefined) note.title = title;
    if (filename !== undefined) note.filename = filename;
    if (year !== undefined) note.year = year;
    if (semester !== undefined) note.semester = semester;
    if (subject !== undefined) note.subject = subject;
    if (description !== undefined) note.description = description;

    await note.save();
    return NextResponse.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
