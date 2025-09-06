"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Note {
  _id: string;
  title: string;
  filename: string;
  subject: string;
  year: string;
  semester: string;
}

interface Flashcard {
  question: string;
  answer: string;
}

export default function FlashcardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchNotes();
  }, [user, router]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = await user!.getIdToken();

      const response = await fetch("http://localhost:3001/api/public/notes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const notesData = await response.json();
      setNotes(notesData);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateFlashcards = async () => {
    if (!selectedNote) return;

    try {
      setGenerating(true);
      const token = await user!.getIdToken();

      const response = await fetch(`http://localhost:3001/api/flashcards/note/${selectedNote._id}/content`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch note content");
      }

      const noteContent = await response.json();

      // Generate flashcards using AI
      const flashcardsResponse = await fetch("http://localhost:3001/api/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          noteId: selectedNote._id,
          content: noteContent.content,
          title: selectedNote.title,
        }),
      });

      if (!flashcardsResponse.ok) {
        throw new Error("Failed to generate flashcards");
      }

      const generatedFlashcards = await flashcardsResponse.json();
      setFlashcards(generatedFlashcards);
      setCurrentCardIndex(0);
      setFlippedCards(new Set());
    } catch (error) {
      console.error("Error generating flashcards:", error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleCard = (index: number) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Flashcards</h1>
                <p className="mt-2 text-gray-600">
                  Generate study flashcards from your notes using AI
                </p>
              </div>
              <Link
                href="/browse"
                className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-colors font-medium"
              >
                Browse Notes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Note Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select a Note
              </h2>

              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note._id}
                      onClick={() => setSelectedNote(note)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedNote?._id === note._id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] bg-opacity-5 text-white"
                          : "border-gray-200 hover:border-[var(--color-primary)]"
                      }`}
                    >
                      <h3 className={`font-medium ${selectedNote?._id === note._id ? 'text-white' : 'text-gray-900'}`}>{note.title}</h3>
                      <p className={`text-sm mt-1 ${selectedNote?._id === note._id ? 'text-gray-300' : 'text-gray-500'}`}>
                        {note.subject} • {note.year} • Semester {note.semester}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
                  <p className="text-gray-500 mb-4">Upload some notes to get started!</p>
                  <Link
                    href="/upload"
                    className="inline-flex items-center px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    Upload Notes
                  </Link>
                </div>
              )}

              {selectedNote && (
                <button
                  onClick={generateFlashcards}
                  disabled={generating}
                  className="w-full mt-6 bg-[var(--color-primary)] text-white py-3 px-4 rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    "Generate Flashcards"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Flashcard Display */}
          <div className="lg:col-span-2">
            {flashcards.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Flashcards ({flashcards.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={prevCard}
                      disabled={currentCardIndex === 0}
                      className="p-2 rounded-lg border border-gray-200 hover:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-500">
                      {currentCardIndex + 1} of {flashcards.length}
                    </span>
                    <button
                      onClick={nextCard}
                      disabled={currentCardIndex === flashcards.length - 1}
                      className="p-2 rounded-lg border border-gray-200 hover:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div
                    onClick={() => toggleCard(currentCardIndex)}
                    className="w-full max-w-lg h-64 cursor-pointer perspective-1000"
                  >
                    <div
                      className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                        flippedCards.has(currentCardIndex) ? "rotate-y-180" : ""
                      }`}
                    >
                      {/* Front of card */}
                      <div className="absolute inset-0 w-full h-full backface-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl p-6 flex flex-col justify-center items-center text-white shadow-lg">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold mb-4">Question</h3>
                            <p className="text-xl leading-relaxed">
                              {flashcards[currentCardIndex].question}
                            </p>
                          </div>
                          <div className="mt-6 text-sm opacity-75">
                            Click to reveal answer
                          </div>
                        </div>
                      </div>

                      {/* Back of card */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                        <div className="w-full h-full bg-white border-2 border-[var(--color-primary)] rounded-xl p-6 flex flex-col justify-center items-center shadow-lg">
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4">Answer</h3>
                            <p className="text-lg text-gray-800 leading-relaxed">
                              {flashcards[currentCardIndex].answer}
                            </p>
                          </div>
                          <div className="mt-6 text-sm text-gray-500">
                            Click to see question
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress indicators */}
                <div className="flex justify-center mt-6 space-x-2">
                  {flashcards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCardIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentCardIndex
                          ? "bg-[var(--color-primary)]"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedNote ? "Ready to Generate Flashcards" : "Select a Note First"}
                </h3>
                <p className="text-gray-500">
                  {selectedNote
                    ? "Click the generate button to create AI-powered flashcards from your selected note."
                    : "Choose a note from the list to start generating flashcards."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
