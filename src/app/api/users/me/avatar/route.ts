import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { User } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    await connectDB();

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Generate filename
    const filename = `${Date.now()}-${file.name}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save file
    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/avatars/${filename}`;

    const user = await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      { $set: { profilePicUrl: url } },
      { new: true, upsert: true }
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const decodedToken = await verifyAuth(request);
    await connectDB();

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Set to default
    user.profilePicUrl = null; // or "/default-profile.png" if you want to store it
    await user.save();

    return NextResponse.json({ message: 'Profile picture deleted', profilePicUrl: null });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
