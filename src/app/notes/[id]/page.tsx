"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`http://localhost:3001/api/notes/${id}`);
      setNote(await res.json());
    })();
  }, [id]);

  if (!note) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 text-[var(--color-primary)]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <p className="opacity-70 mt-1">Uploaded: {new Date(note.createdAt).toLocaleString()}</p>
        <a className="mt-4 inline-block underline" href={note.fileUrl || `http://localhost:3001/uploads/${note.filename}`} target="_blank">Open PDF</a>
      </div>
    </div>
  );
}
