"use client"
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { searchUsers } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const getProfilePicUrl = (profilePicUrl: string | null | undefined) => {
    if (!profilePicUrl) return "/profilepic.jpeg";
    if (profilePicUrl.startsWith("http")) return profilePicUrl;
    return `http://localhost:3001${profilePicUrl}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleUserClick = (selectedUser: any) => {
    // Check if the selected user is the current user
    if (user && selectedUser.firebaseUid === user.uid) {
      // Navigate to own profile
      router.push("/profile");
    } else {
      // Navigate to public profile
      router.push(`/profile/${selectedUser.firebaseUid}`);
    }
  };

  return (
    <>
    <main className="relative flex flex-col items-center px-4 mt-16 space-y-12 text-center overflow-hidden">
      {/* Search Bar */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border-2 border-[var(--color-primary)] rounded-full bg-[var(--color-background)] text-[var(--color-primary)] placeholder-[var(--color-secondary)] focus:outline-none focus:border-[var(--color-secondary)]"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded-full hover:bg-[var(--color-secondary)] transition font-semibold disabled:opacity-50"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="w-full max-w-2xl space-y-4">
          <h2 className="text-2xl font-bold text-[var(--color-primary)]">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((user) => (
              <button
                key={user.firebaseUid}
                onClick={() => handleUserClick(user)}
                className="bg-[var(--color-background)] border-2 border-[var(--color-primary)] rounded-2xl p-4 shadow hover:shadow-lg transition flex items-center space-x-4 text-left w-full"
              >
                <img
                  src={getProfilePicUrl(user.profilePicUrl)}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-primary)]">{user.username}</p>
                  {user.firebaseUid === user?.uid && (
                    <p className="text-xs text-[var(--color-secondary)] font-medium">(Your profile)</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)]">
          Welcome to NotesbyJilu 📝
        </h1>
        <p className="text-xl md:text-2xl italic text-[var(--color-secondary)]">
          "Sharing is caring"
        </p>
      </div>

      {/* Cards Section */}
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-9">
        {/* Browse Notes Card */}
        <div className="bg-[var(--color-background)] border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition flex flex-col items-center space-y-4">
          <div className="text-6xl">📚</div>
          <h3 className="text-2xl font-bold text-[var(--color-primary)]">Browse Notes</h3>
          <p className="text-[var(--color-primary)]">Find notes by semester & subject. Download what you need!</p>
          <Link href="/browse" className="mt-4 inline-block bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold">
            Browse Notes
          </Link>
        </div>

        {/* Upload Notes Card */}
        <div className="bg-[var(--color-background)] border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition flex flex-col items-center space-y-4">
          <div className="text-6xl">✍️</div>
          <h3 className="text-2xl font-bold text-[var(--color-primary)]">Upload Notes</h3>
          <p className="text-[var(--color-primary)]">Help other students by sharing your notes and get featured!</p>
          <Link href="/upload" className="mt-4 inline-block bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold">
            Upload Notes
          </Link>
        </div>

        {/* Flashcards Card */}
  <div className="bg-[var(--color-background)] border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition flex flex-col items-center space-y-4">
    <div className="text-6xl">🎯</div>
    <h3 className="text-2xl font-bold text-[var(--color-primary)]">Practice with Flashcards</h3>
    <p className="text-[var(--color-primary)]">Revise key concepts by flipping through flashcards!</p>
    <Link href="/flashcard" className="mt-4 inline-block bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold">
      Go to Flashcards
    </Link>
  </div>
      </section>
    </main>

    <footer className="mt-16 w-full bg-[var(--color-background)] text-[var(--color-primary)] border-t-2 border-[var(--color-primary)] rounded-t-3xl py-8 px-4 flex flex-col items-center space-y-4">
  <p className="text-lg font-semibold">💖 NotesbyJilu &copy; 2025</p>
  <p className="text-sm italic">Sharing is caring — made with love for students 🌸</p>
  <div className="flex space-x-4">
    <a href="#" className="hover:text-[var(--color-secondary)] transition">Instagram</a>
    <a href="#" className="hover:text-[var(--color-secondary)] transition">GitHub</a>
    <a href="#" className="hover:text-[var(--color-secondary)] transition">Contact</a>
  </div>
</footer>

    
  </>
  );
}
 