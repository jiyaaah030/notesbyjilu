import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { User, Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    await connectDB();

    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid,
        username: decodedToken.email?.split("@")[0] || "New User"
      });
    }

    const sharedNotes = await Note.countDocuments({ uploaderUid: decodedToken.uid });
    const userWithCounts = {
      ...user.toObject(),
      counts: {
        sharedNotes,
        followers: user.followers?.length || 0,
        following: user.following?.length || 0
      }
    };

    return NextResponse.json(userWithCounts);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    await connectDB();

    const { username, college, profession, bio } = await request.json();
    const user = await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      { $set: { username, college, profession, bio } },
      { new: true, upsert: true }
    );

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
