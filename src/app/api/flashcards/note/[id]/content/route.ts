import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAuth(request);
    await connectDB();

    const { id } = await params;
    console.log("Fetching note content for ID:", id);

    const note = await Note.findById(id);
    console.log("Note found:", note ? { id: note._id, fileUrl: note.fileUrl } : "null");

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Get the file path
    const filePath = path.join(process.cwd(), 'public', note.fileUrl.replace(/^\//, ''));
    console.log("Constructed file path:", filePath);
    console.log("Current working directory:", process.cwd());
    console.log("Note fileUrl:", note.fileUrl);

    if (!fs.existsSync(filePath)) {
      console.error("File does not exist at path:", filePath);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    console.log("File exists, reading...");
    // Read and parse the PDF
    const dataBuffer = fs.readFileSync(filePath);
    console.log("File read successfully, size:", dataBuffer.length);

    console.log("Parsing PDF...");
    const data = await pdfParse(dataBuffer);
    console.log("PDF parsed successfully, text length:", data.text.length);

    return NextResponse.json({ content: data.text });
  } catch (error) {
    console.error("Error fetching note content:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    console.error("Error details:", errorMessage);
    console.error("Error stack:", errorStack);
    return NextResponse.json({ error: "Failed to fetch note content" }, { status: 500 });
  }
}
