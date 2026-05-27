import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';


async function askQuestion(noteContent: string, question: string) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  // Truncate noteContent to avoid huge prompts
  const truncatedContent =
    noteContent.length > 12000
      ? noteContent.substring(0, 12000) + "..."
      : noteContent;

  const prompt = `
You are NotesByJilu AI, an intelligent educational assistant designed to help students study effectively.

Your role:
- Answer academic and study-related questions clearly and accurately
- Explain difficult concepts in simple language
- Help students understand topics step-by-step
- Use examples when useful
- Prioritize information from the uploaded notes
- If notes do not contain enough information, use your own educational knowledge to help
- Keep responses focused on learning and education only

Rules:
- Only answer study-related or educational questions
- Refuse unrelated topics politely
- Do not generate harmful, illegal, or inappropriate content
- Be concise but helpful
- Use bullet points when useful
- Explain technical terms simply

UPLOADED NOTES:
${truncatedContent}

STUDENT QUESTION:
${question}

Provide the best educational answer possible.
`;

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',

      messages: [
        {
          role: 'system',
          content:
            'You are a helpful educational AI assistant for students.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],

      temperature: 0.3,
      max_tokens: 700,
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "No answer generated.";

    return answer;
  } catch (error) {
    console.error("Error asking question with Groq:", error);
    throw new Error("Failed to get answer from AI");
  }
}

export async function POST(request: NextRequest) {
  // Prevent Next.js static build from failing if it tries to execute this route.
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_RUNTIME === 'edge') {
    return NextResponse.json({ error: 'Not available during build' }, { status: 503 });
  }

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

    // Get the file content - try public/uploads first (Next.js uploads)
    let filePath = path.join(process.cwd(), 'public', note.fileUrl.replace(/^\//, ''));
    // Normalize to avoid accidental double slashes in serverless/edge builds
    filePath = path.normalize(filePath);
    console.log("Constructed file path (public):", filePath);


    // If file doesn't exist in public/uploads, try upload-server/uploads (Express.js uploads)
    if (!fs.existsSync(filePath)) {
      console.log("File not found in public/uploads, trying upload-server/uploads");
      filePath = path.join(process.cwd(), 'upload-server', note.fileUrl.replace(/^\//, ''));
      console.log("Constructed file path (upload-server):", filePath);

      if (!fs.existsSync(filePath)) {
        console.error("File does not exist at either path:", filePath);
        return NextResponse.json({ error: "Note file not found" }, { status: 404 });
      }
    }

    const dataBuffer = fs.readFileSync(filePath);
    // Detect and parse file type.
    // Most notes are PDF; DOCX is supported via Mammoth.
    const ext = path.extname(filePath).toLowerCase();

    let noteContent: string;

    if (ext === '.pdf') {
      const { default: pdfParse } = await import('pdf-parse');
      const data = await pdfParse(dataBuffer);
      noteContent = data.text;
    } else if (ext === '.docx') {
      const mammoth = await import('mammoth');
      const extractRawText = mammoth.default?.extractRawText ?? (mammoth as any).extractRawText;
      if (!extractRawText) {
        return NextResponse.json({ error: 'mammoth.extractRawText not available' }, { status: 500 });
      }
      const result = await extractRawText({ buffer: dataBuffer });
      noteContent = result.value;
    } else {
      return NextResponse.json({ error: 'Unsupported note file type' }, { status: 415 });
    }



    // Ask the question
    const answer = await askQuestion(noteContent, question);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error asking question:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get answer";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
