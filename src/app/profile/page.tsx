"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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
  counts: {
    followers: number;
    following: number;
    sharedNotes: number;
  };
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
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'about'>('posts');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("avatar", e.target.files[0]);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedUser = await response.json() as User;
      setMe(updatedUser);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    }
  };

  useEffect(() => {
    if (!user) return router.push("/login");

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!user) return;

        const token = await user.getIdToken();

        const [userResponse, notesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me/notes`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        ]);

        if (!userResponse.ok || !notesResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`);
        }

        const userData = await userResponse.json() as User;
        const notesData = await notesResponse.json() as Note[];

        console.log("User data:", userData);
        console.log("Profile picture URL:", userData.profilePicUrl);

        setMe(userData);
        setNotes(notesData);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, router]);

  const handleEditNote = (note: Note) => {
    router.push(`/notes/edit/${note._id}`);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete note with status: ${response.status}`);
      }

      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Failed to delete note. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header Section */}
      <div className="relative bg-white shadow-lg">
        <div className="h-48 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"></div>
        <div className="absolute -bottom-16 left-8">
          <div className="relative">
            <Image
              src={me.profilePicUrl ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${me.profilePicUrl}` : "/default-profile.png"}
              alt="Profile"
              width={128}
              height={128}
              className="rounded-full border-4 border-white shadow-lg object-cover"
              unoptimized={true}
            />
            <label
              htmlFor="profile-avatar-upload"
              className="absolute bottom-2 right-2 bg-[var(--color-primary)] text-white p-2 rounded-full hover:opacity-90 transition-colors cursor-pointer"
              title="Change Profile Photo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </label>
            <input
              type="file"
              id="profile-avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-20 px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{me.username}</h1>
                <p className="text-lg text-gray-600 mb-1">{me.profession}</p>
                <p className="text-gray-500">{me.college}</p>
              </div>
              <Link
                href="/profile/edit"
                className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors font-medium"
              >
                Edit Profile
              </Link>
            </div>

            {me.bio && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{me.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 border-t pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">{me.counts?.followers ?? 0}</div>
                <div className="text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">{me.counts?.following ?? 0}</div>
                <div className="text-gray-500">Following</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-primary)]">{me.counts?.sharedNotes ?? 0}</div>
                <div className="text-gray-500">Notes</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`px-8 py-4 font-medium transition-colors ${
                    activeTab === 'posts'
                      ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Notes
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  className={`px-8 py-4 font-medium transition-colors ${
                    activeTab === 'about'
                      ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  About
                </button>
              </div>
            </div>

            <div className="p-8">
              {activeTab === 'posts' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">My Shared Notes</h3>
                  {notes.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {notes.map((note) => (
                        <div
                          key={note._id}
                          className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors group relative"
                        >
                          <Link href={`/notes/${note._id}`}>
                            <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                              {note.title}
                            </h4>
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                              <span>👍 {note.likes}</span>
                              <span>👎 {note.dislikes}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </div>
                          </Link>
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              onClick={() => handleEditNote(note)}
                              className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600 transition-colors"
                              title="Edit Note"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note._id)}
                              className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                              title="Delete Note"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                      <p className="text-gray-500 mb-4">Start sharing your knowledge with the community!</p>
                      <Link
                        href="/upload"
                        className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors"
                      >
                        Upload First Note
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">About Me</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 w-24">Name:</span>
                      <span className="text-gray-900">{me.username}</span>
                    </div>
                    {me.college && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">College:</span>
                        <span className="text-gray-900">{me.college}</span>
                      </div>
                    )}
                    {me.profession && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700 w-24">Profession:</span>
                        <span className="text-gray-900">{me.profession}</span>
                      </div>
                    )}
                    {me.bio && (
                      <div>
                        <span className="font-medium text-gray-700 block mb-2">Bio:</span>
                        <p className="text-gray-900 leading-relaxed">{me.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
