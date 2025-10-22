import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

async function askQuestion(noteContent: string, question: string) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Truncate noteContent to avoid exceeding API limits
  const truncatedContent = noteContent.length > 5000 ? noteContent.substring(0, 5000) + "..." : noteContent;

  const prompt = `You are an AI assistant helping students understand their notes. Based on the following note content, please answer the student's question comprehensively and accurately.

Note content: ${truncatedContent}

Student's question: ${question}

Please provide a clear answer based on the note content. If the question cannot be answered from the provided content, say so politely.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text().trim();

    return answer;
  } catch (error) {
    console.error("Error asking question with Gemini:", error);
    throw new Error("Failed to get answer from AI");
  }
}

export async function POST(request: NextRequest) {
  try {
    await verifyAuth(request);
    await connectDB();

    const { noteId, question } = await request.json();

    if (!noteId || !question || typeof question !== 'string') {
      return NextResponse.json({ error: "noteId and question are required" }, { status: 400 });
    }

    // Get the note
    const note = await Note.findById(noteId);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Get the file content
    const filePath = path.join(process.cwd(), 'public', note.fileUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Note file not found" }, { status: 404 });
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const noteContent = data.text;

    // Ask the question
    const answer = await askQuestion(noteContent, question);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error asking question:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get answer";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
