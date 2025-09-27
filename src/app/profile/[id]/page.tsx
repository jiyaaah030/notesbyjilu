"use client"
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface User {
  _id: string;
  firebaseUid: string;
  username: string;
  college: string;
  profession: string;
  bio: string;
  profilePicUrl: string;
  followers: string[];
  following: string[];
  createdAt: string;
  updatedAt: string;
}

interface Note {
  _id: string;
  title: string;
  filename: string;
  subject: string;
  semester: string;
  year: string;
  description: string;
  uploaderUid: string;
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserProfile() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user profile
        const userResponse = await fetch(`/api/users/${userId}`);
        if (!userResponse.ok) throw new Error("User not found");
        const userData = await userResponse.json() as User;
        setUser(userData);

        // Fetch user's notes
        const notesResponse = await fetch(`/api/users/${userId}/notes`);
        if (notesResponse.ok) {
          const notesData = await notesResponse.json() as Note[];
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

  useEffect(() => {
    const fetchFollowStatus = async () => {
      if (!currentUser || !userId || currentUser.uid === userId) return;

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/users/${userId}?status=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json() as {isFollowing: boolean};
          setIsFollowing(data.isFollowing);
        }
      } catch (err) {
        console.error("Failed to fetch follow status:", err);
      }
    };

    fetchFollowStatus();
  }, [currentUser, userId]);

  const handleFollow = async () => {
    if (!currentUser || followLoading) return;

    setFollowLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/${userId}/follow`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Update counts
        setUser((prev: User | null) => {
          if (!prev) return prev;
          return {
            ...prev,
            followers: isFollowing
              ? prev.followers.filter((uid: string) => uid !== currentUser.uid)
              : [...prev.followers, currentUser.uid],
          };
        });
      } else {
        const error = await response.json() as {error: string};
        alert(error.error || 'Failed to update follow status');
      }
    } catch (err) {
      console.error("Follow action failed:", err);
      alert("Failed to update follow status");
    } finally {
      setFollowLoading(false);
    }
  };

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
          <Image
            src={user.profilePicUrl ? `http://localhost:3001${user.profilePicUrl}` : "/default-profile.png"}
            alt={user.username}
            width={96}
            height={96}
            className="w-24 h-24 rounded-full object-cover border-2 border-[var(--color-primary)]"
            unoptimized={true}
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[var(--color-primary)]">{user.username}</h1>
            {user.profession && (
              <p className="text-lg text-[var(--color-secondary)] font-medium">{user.profession}</p>
            )}
            {user.college && (
              <p className="text-[var(--color-secondary)]">{user.college}</p>
            )}
            <p className="text-[var(--color-secondary)] mt-2">{user.bio || "No bio available"}</p>
            <div className="flex space-x-4 mt-2 text-sm text-[var(--color-primary)]">
              <span>{user.followers?.length || 0} followers</span>
              <span>{user.following?.length || 0} following</span>
            </div>
          </div>
          {currentUser && currentUser.uid !== userId && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)]'
              } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
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
                  href={`http://localhost:3001/uploads/${note.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[var(--color-primary)] text-[var(--color-background)] px-4 py-2 rounded-full text-sm hover:bg-[var(--color-secondary)] transition"
                >
                  View Notes
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
