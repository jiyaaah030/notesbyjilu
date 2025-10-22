import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    await connectDB();

    const notes = await Note.find({ uploaderUid: decodedToken.uid })
      .sort({ createdAt: -1 })
      .select('-fileUrl'); // Don't return file URLs for security

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching user notes:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
