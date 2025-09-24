import { NextRequest, NextResponse } from 'next/server';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get the limit from query parameters
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const limitNum = limit ? parseInt(limit) : undefined;

    let query = Note.find();

    // Apply limit if provided
    if (limitNum && limitNum > 0) {
      query = query.limit(limitNum);
    }

    const notes = await query.sort({ year: -1, semester: -1, createdAt: -1 });
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
