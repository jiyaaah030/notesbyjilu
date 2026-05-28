import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { User, Note } from '@/lib/models';
import connectDB from '@/lib/mongodb';
import cloudinary from '@/lib/cloudinary';
import streamifier from 'streamifier';

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

    const buffer = Buffer.from(await file.arrayBuffer());

const uploadResult: any = await new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      resource_type: 'auto',
      folder: 'notesbyjilu-notes',
      public_id: `${Date.now()}-${file.name.replace('.pdf', '')}`,
    },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  );

  streamifier.createReadStream(buffer).pipe(uploadStream);
});

console.log(uploadResult);

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    const uploader = user ? user.username : (decodedToken.displayName || decodedToken.email || decodedToken.uid);

    const newNote = new Note({
      title,
      filename: uploadResult.public_id,
      uploader,
      uploaderUid: decodedToken.uid,
      year,
      semester,
      subject,
      fileUrl: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${uploadResult.public_id}.pdf`
    });

    await newNote.save();
    return NextResponse.json({
  message: "Note uploaded successfully",
  fileUrl: uploadResult.secure_url,
});
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
