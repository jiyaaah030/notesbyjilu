"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      await signInWithPopup(auth, provider);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] px-4">
      <div className="max-w-md w-full space-y-8 border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition">
        <h1 className="text-3xl font-extrabold text-center mb-2">Welcome Back 👋</h1>
        <p className="text-center text-[var(--color-secondary)] mb-6">Login to access your notes and profile</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
            />
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[var(--color-primary)] text-[var(--color-background)] py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold"
          >
            Login
          </button>
        </form>

        <div className="flex items-center justify-center my-4">
          <span className="border-t border-[var(--color-primary)] w-1/4"></span>
          <span className="mx-2 text-[var(--color-secondary)]">or</span>
          <span className="border-t border-[var(--color-primary)] w-1/4"></span>
        </div>
        
        <button
          onClick={handleGoogleSignup}
          className="w-full border border-[var(--color-primary)] py-3 rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition font-semibold flex items-center justify-center gap-2"
        >
          <img src="/google-icon.png" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>
      </div>
    </main>
  );
}
