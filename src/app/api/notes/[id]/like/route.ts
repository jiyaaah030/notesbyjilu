import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const decodedToken = await verifyAuth(request);

    if (!decodedToken || !decodedToken.uid || typeof decodedToken.uid !== 'string') {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    const { id } = await params;
    const note = await Note.findById(id);
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

    // Check if user has already disliked this note
    if (note.dislikedBy.includes(decodedToken.uid)) {
      // Remove dislike and add like
      dislikesChange = -1;
      likesChange = 1;
      updateQuery = {
        $inc: { dislikes: dislikesChange, likes: likesChange },
        $pull: { dislikedBy: decodedToken.uid },
        $push: { likedBy: decodedToken.uid }
      };
    } else if (note.likedBy.includes(decodedToken.uid)) {
      // User already liked, remove like
      likesChange = -1;
      updateQuery = {
        $inc: { likes: likesChange },
        $pull: { likedBy: decodedToken.uid }
      };
    } else {
      // New like
      likesChange = 1;
      updateQuery = {
        $inc: { likes: likesChange },
        $push: { likedBy: decodedToken.uid }
      };
    }

    await Note.updateOne({ _id: id }, updateQuery);

    const updatedNote = await Note.findById(id);
    return NextResponse.json({ likes: updatedNote.likes, dislikes: updatedNote.dislikes });
  } catch (error) {
    console.error("Error in like route:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
