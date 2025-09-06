"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {

  const { user } = useAuth();
  const router = useRouter();

  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  if (!user) {
    alert("Please login to upload notes.");
    return;
  }

  const formData = new FormData();
  formData.append("year", year);
  formData.append("semester", semester);
  formData.append("subject", subject);
  formData.append("title", title);
  formData.append("file", file);
  formData.append("uploader", user.uid);

  try {
    const res = await fetch("http://localhost:3001/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
  setSuccess(true);
  setFile(null);
  setYear("");
  setSemester("");
  setSubject("");
  setTitle("");
}
else {
      const error = await res.text();
      alert("Upload failed: " + error);
    }
  } catch (error) {
    alert("Something went wrong!");
    console.error("Upload error:", error);
  }
};


  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] px-4">
        <div className="max-w-md w-full space-y-6 border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition text-center">
          <h1 className="text-3xl font-extrabold mb-2">Login Required 🚀</h1>
          <p className="text-[var(--color-secondary)] mb-6">
            Please login or signup to upload your notes.
          </p>
          <div className="flex justify-center space-x-6">
            <Link
              href="/login"
              className="bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="border-2 border-[var(--color-primary)] px-6 py-3 rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition font-semibold"
            >
              Signup
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] px-4">
      <div className="max-w-xl w-full border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition space-y-6">
        <h1 className="text-3xl font-extrabold text-center mb-2">Upload Notes 📚</h1>
        <p className="text-center text-[var(--color-secondary)] mb-4">Help others by sharing your notes!</p>
        
        {!success ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
              required
            >
              <option value="">Select Year</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
              required
            >
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Eg: Data Structures"
              className="border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Title / Description</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Eg: DSA important questions"
              className="border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
              required
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Upload PDF</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="border rounded-full px-4 py-2 file:bg-[var(--color-primary)] file:text-[var(--color-background)] file:rounded-full file:px-4 file:py-1 hover:file:bg-[var(--color-secondary)]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-[var(--color-background)] py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold"
          >
            Upload Notes
          </button>
        </form>
        ) : (
          <div className="max-w-xl w-full text-center border-2 border-green-500 rounded-3xl p-8 shadow-lg space-y-6 bg-green-50">
    <div className="text-5xl text-green-600">✔️</div>
    <h2 className="text-2xl font-bold text-green-700">Notes uploaded successfully!</h2>
    <div className="flex justify-center gap-4 mt-4">
      <button
        onClick={() => setSuccess(false)}
        className="bg-[var(--color-primary)] text-[var(--color-background)] px-6 py-3 rounded-full hover:bg-[var(--color-secondary)] font-semibold transition"
      >
        Upload More
      </button>
      <button
        onClick={() => router.push("/browse")}
        className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] px-6 py-3 rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] font-semibold transition"
      >
        See Notes
      </button>
    </div>
  </div>
        )}
      </div>
    </main>
  );
}
