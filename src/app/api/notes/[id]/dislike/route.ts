import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const decodedToken = await verifyAuth(request);

    if (!decodedToken || !decodedToken.uid || typeof decodedToken.uid !== 'string') {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const note = await Note.findById(params.id);
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Ensure arrays exist and are arrays
    if (!Array.isArray(note.likedBy)) {
      note.likedBy = [];
    }
    if (!Array.isArray(note.dislikedBy)) {
      note.dislikedBy = [];
    }

    // Ensure likes and dislikes are numbers
    if (typeof note.likes !== 'number') {
      note.likes = 0;
    }
    if (typeof note.dislikes !== 'number') {
      note.dislikes = 0;
    }

    let updateQuery = {};
    let likesChange = 0;
    let dislikesChange = 0;

    // Check if user has already liked this note
    if (note.likedBy.includes(decodedToken.uid)) {
      // Remove like and add dislike
      likesChange = -1;
      dislikesChange = 1;
      updateQuery = {
        $inc: { likes: likesChange, dislikes: dislikesChange },
        $pull: { likedBy: decodedToken.uid },
        $push: { dislikedBy: decodedToken.uid }
      };
    } else if (note.dislikedBy.includes(decodedToken.uid)) {
      // User already disliked, remove dislike
      dislikesChange = -1;
      updateQuery = {
        $inc: { dislikes: dislikesChange },
        $pull: { dislikedBy: decodedToken.uid }
      };
    } else {
      // New dislike
      dislikesChange = 1;
      updateQuery = {
        $inc: { dislikes: dislikesChange },
        $push: { dislikedBy: decodedToken.uid }
      };
    }

    await Note.updateOne({ _id: params.id }, updateQuery);

    const updatedNote = await Note.findById(params.id);
    return NextResponse.json({ likes: updatedNote.likes, dislikes: updatedNote.dislikes });
  } catch (error) {
    console.error("Error in dislike route:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
