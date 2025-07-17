"use client"
import Link from "next/link";

export default function Home() {
  return (
    <>
    <main className="relative flex flex-col items-center px-4 mt-16 space-y-12 text-center overflow-hidden">
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--color-primary)]">
          Welcome to NotesbyJilu 📝
        </h1>
        <p className="text-xl md:text-2xl italic text-[var(--color-secondary)]">
          “Sharing is caring”
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
    <Link href="/flashcards" className="mt-4 inline-block bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold">
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
 