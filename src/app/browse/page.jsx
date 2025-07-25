"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export const dynamic = "force-dynamic"; 

export default function BrowsePage() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/notes")
      .then((res) => setNotes(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">📚 Browse Notes</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((notes) => (
          <div key={notes._id} className="p-4 border rounded-lg shadow bg-white">
            <h2 className="text-lg font-bold">{notes.title}</h2>
            <p className="text-sm text-gray-600">Uploaded by: {notes.uploader}</p>
            <a
              className="mt-2 inline-block text-blue-500 hover:underline"
              href={`http://localhost:3001/uploads/${notes.filename}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View File
            </a>

            <div className="mt-4 flex gap-4 text-sm">
              <button className="text-green-600">👍 {notes.likes}</button>
              <button className="text-red-600">👎 {notes.dislikes}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
