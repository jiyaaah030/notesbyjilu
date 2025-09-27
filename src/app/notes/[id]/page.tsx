"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Note {
  _id: string;
  title: string;
  filename: string;
  uploader: string;
  uploaderUid: string;
  year: string;
  semester: string;
  subject: string;
  fileUrl: string;
  description: string;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${process.env.MONGO_URI}/api/notes/${id}`);
      if (res.ok) {
        setNote(await res.json() as Note);
      }
    })();
  }, [id]);

  if (!note) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 text-[var(--color-primary)]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <p className="opacity-70 mt-1">Uploaded: {new Date(note.createdAt).toLocaleString()}</p>
        <a className="mt-4 inline-block underline" href={note.fileUrl || `${process.env.MONGO_URI}/uploads/${note.filename}`} target="_blank">Open PDF</a>
      </div>
    </div>
  );
}
