import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    const users = await User.find({
      username: { $regex: query, $options: "i" }
    }).select("username profilePicUrl firebaseUid").limit(10);

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
