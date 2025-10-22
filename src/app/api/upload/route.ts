import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { User, Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const year = formData.get('year') as string;
    const semester = formData.get('semester') as string;
    const subject = formData.get('subject') as string;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file locally with timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    const uploader = user ? user.username : (decodedToken.displayName || decodedToken.email || decodedToken.uid);

    const newNote = new Note({
      title,
      filename,
      uploader,
      uploaderUid: decodedToken.uid,
      year,
      semester,
      subject,
      fileUrl: `/uploads/${filename}`
    });

    await newNote.save();
    return NextResponse.json({ message: "Note uploaded successfully" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
