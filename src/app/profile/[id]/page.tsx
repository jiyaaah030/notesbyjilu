"use client"
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { authedFetch } from "@/lib/api";

export default function UserProfile() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user profile
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) throw new Error("User not found");
        const userData = await userResponse.json();
        setUser(userData);

        // Fetch user's notes
        const notesResponse = await fetch(`/api/users/${userId}/notes`);
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setNotes(notesData);
        }
      } catch (err) {
        setError("Failed to load user profile");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-primary)]">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-4">User Not Found</h1>
          <Link href="/" className="text-[var(--color-secondary)] hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Profile Header */}
      <div className="bg-[var(--color-background)] border-b-2 border-[var(--color-primary)] py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-6">
          <img
            src={user.profilePicUrl || "/default-profile.png"}
            alt={user.username}
            className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-primary)]"
          />
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-primary)]">{user.username}</h1>
            <p className="text-[var(--color-secondary)]">{user.bio || "No bio available"}</p>
            <div className="flex space-x-4 mt-2 text-sm text-[var(--color-primary)]">
              <span>{user.followers?.length || 0} followers</span>
              <span>{user.following?.length || 0} following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Shared Notes</h2>
        {notes.length === 0 ? (
          <p className="text-[var(--color-secondary)]">No notes shared yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note._id}
                className="bg-[var(--color-background)] border-2 border-[var(--color-primary)] rounded-2xl p-6 shadow hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-[var(--color-primary)] mb-2">{note.title}</h3>
                <p className="text-sm text-[var(--color-secondary)] mb-2">
                  {note.subject} - {note.semester} {note.year}
                </p>
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[var(--color-primary)] text-[var(--color-background)] px-4 py-2 rounded-full text-sm hover:bg-[var(--color-secondary)] transition"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
