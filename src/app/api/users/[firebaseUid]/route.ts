import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { User, Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ firebaseUid: string }> }
) {
  try {
    await connectDB();
    const { firebaseUid } = await params;
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    if (status === 'true') {
      // Get follow status
      const decodedToken = await verifyAuth(request);
      const currentUser = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const isFollowing = currentUser.following.includes(firebaseUid);
      return NextResponse.json({ isFollowing });
    } else {
      // Get user profile with follow counts
      const user = await User.findOne({ firebaseUid });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const sharedNotes = await Note.countDocuments({ uploaderUid: firebaseUid });
      const userWithCounts = {
        ...user.toObject(),
        counts: {
          sharedNotes,
          followers: user.followers?.length || 0,
          following: user.following?.length || 0
        }
      };

      return NextResponse.json(userWithCounts);
    }
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ firebaseUid: string }> }
) {
  try {
    await connectDB();
    const decodedToken = await verifyAuth(request);
    const { firebaseUid } = await params;

    if (firebaseUid === decodedToken.uid) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const targetUser = await User.findOne({ firebaseUid });
    const currentUser = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!targetUser || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    if (currentUser.following.includes(firebaseUid)) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 });
    }

    // Add to following and followers
    currentUser.following.push(firebaseUid);
    targetUser.followers.push(decodedToken.uid);

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({ message: "Followed successfully" });
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ firebaseUid: string }> }
) {
  try {
    await connectDB();
    const decodedToken = await verifyAuth(request);
    const { firebaseUid } = await params;

    const targetUser = await User.findOne({ firebaseUid });
    const currentUser = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!targetUser || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter((uid: string) => uid !== firebaseUid);
    targetUser.followers = targetUser.followers.filter((uid: string) => uid !== decodedToken.uid);

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error('Unfollow API error:', error);
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
