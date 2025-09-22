"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export const dynamic = "force-dynamic";

export default function BrowsePage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // new state for search
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [userInteractions, setUserInteractions] = useState({}); // Track user's likes/dislikes

  useEffect(() => {
    axios
      .get("http://localhost:3001/api/public/notes")
      .then((res) => {
        setNotes(res.data);
        setFilteredNotes(res.data); // initially, show all
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();

    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerQuery) ||
        (note.uploader && note.uploader.toLowerCase().includes(lowerQuery))
    );

    setFilteredNotes(filtered);
  }, [searchQuery, notes]);

  const handleLike = async (noteId) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `http://localhost:3001/api/notes/${noteId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the note in the local state
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId
            ? { ...note, likes: response.data.likes, dislikes: response.data.dislikes }
            : note
        )
      );
    } catch (error) {
      console.error("Error liking note:", error);
    }
  };

  const handleDislike = async (noteId) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await axios.post(
        `http://localhost:3001/api/notes/${noteId}/dislike`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the note in the local state
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note._id === noteId
            ? { ...note, likes: response.data.likes, dislikes: response.data.dislikes }
            : note
        )
      );
    } catch (error) {
      console.error("Error disliking note:", error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* 🔍 Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title or uploader..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      
      {/* 📄 Notes List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">No notes found.</p>
        ) : (
          filteredNotes.map((note) => (
            <div key={note._id} className="p-4 border rounded-lg shadow bg-white">
              <h2 className="text-lg font-bold">{note.title}</h2>
              <p className="text-sm text-gray-600">Uploaded by: {note.uploader || 'Unknown'}</p>
              <p className="text-sm text-gray-600">Year: {note.year}, Semester: {note.semester}</p>
              <a
                className="mt-2 inline-block text-blue-500 hover:underline"
                href={`http://localhost:3001/uploads/${note.filename}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View File
              </a>
              <div className="mt-4 flex gap-4 text-sm">
                <button
                  onClick={() => handleLike(note._id)}
                  disabled={!user}
                  className={`px-3 py-1 rounded transition-colors ${
                    user && note.likedBy && note.likedBy.includes(user.uid)
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'text-green-600 hover:bg-green-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  👍 {note.likes}
                </button>
                <button
                  onClick={() => handleDislike(note._id)}
                  disabled={!user}
                  className={`px-3 py-1 rounded transition-colors ${
                    user && note.dislikedBy && note.dislikedBy.includes(user.uid)
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'text-red-600 hover:bg-red-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  👎 {note.dislikes}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
