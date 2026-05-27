import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("=== FLASHCARD CONTENT API CALLED ===");
    
    try {
      await verifyAuth(request);
      console.log("Authentication successful");
    } catch (authError) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ 
        error: "Authentication failed",
        details: authError instanceof Error ? authError.message : String(authError)
      }, { status: 401 });
    }

    try {
      await connectDB();
      console.log("Database connected");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json({ 
        error: "Database connection failed",
        details: dbError instanceof Error ? dbError.message : String(dbError)
      }, { status: 500 });
    }

    const { id } = await params;
    console.log("Fetching note content for ID:", id);

    const note = await Note.findById(id);
    console.log("Note found:", note ? { id: note._id, fileUrl: note.fileUrl, title: note.title } : "null");

    if (!note) {
      console.log("Note not found in database");
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (!note.fileUrl) {
      console.error("Note has no fileUrl set:", note._id);
      return NextResponse.json({ error: "Note has no fileUrl" }, { status: 400 });
    }

    // Get the file URL/path - try public/uploads first (Next.js uploads)
    let fileUrl = note.fileUrl;

    // Clean up the path - remove duplicate uploads directories
    fileUrl = fileUrl.replace(/\/uploads\/uploads\//, '/uploads/');

    console.log("Cleaned fileUrl:", fileUrl);

    // If the fileUrl is a remote URL, fetch it and parse directly
    if (/^https?:\/\//i.test(fileUrl)) {
      console.log("Detected remote file URL, fetching:", fileUrl);
      const res = await fetch(fileUrl);
      if (!res.ok) {
        console.error("Failed to fetch remote file URL", res.status, res.statusText);
        return NextResponse.json({ error: "Failed to fetch remote file URL", details: `${res.status} ${res.statusText}` }, { status: 404 });
      }

      const buffer = Buffer.from(await res.arrayBuffer());

      const ext = path.extname(new URL(fileUrl).pathname).toLowerCase();
      if (ext === '.pdf') {
        const data = await pdfParse(buffer);
        return NextResponse.json({ content: data.text });
      }

      if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        return NextResponse.json({ content: result.value });
      }

      return NextResponse.json({ error: 'Unsupported remote file type' }, { status: 415 });
    }

    let filePath = path.join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
    console.log("Constructed file path (public):", filePath);
    console.log("Current working directory:", process.cwd());

    // If file doesn't exist in public/uploads, try upload-server/uploads (Express.js uploads)
    if (!fs.existsSync(filePath)) {
      console.log("File not found in public/uploads, trying upload-server/uploads");
      filePath = path.join(process.cwd(), 'upload-server', 'uploads', path.basename(fileUrl));
      console.log("Constructed file path (upload-server):", filePath);

      if (!fs.existsSync(filePath)) {
        console.error("File does not exist at either path:", filePath);
        return NextResponse.json({ error: "File not found at paths" }, { status: 404 });
      }
    }

    console.log("File exists, reading...");
    // Read file and determine type
    const dataBuffer = fs.readFileSync(filePath);
    console.log("File read successfully, size:", dataBuffer.length);

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      console.log("Parsing PDF...");
      const data = await pdfParse(dataBuffer);
      console.log("PDF parsed successfully, text length:", data.text.length);
      return NextResponse.json({ content: data.text });
    }

    if (ext === '.docx') {
      console.log("Parsing DOCX...");
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      console.log("DOCX parsed successfully, text length:", result.value.length);
      return NextResponse.json({ content: result.value });
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  } catch (error) {
    console.error("=== ERROR IN FLASHCARD CONTENT API ===");
    console.error("Error object:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);
    
    return NextResponse.json({ 
      error: "Failed to fetch note content",
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}
