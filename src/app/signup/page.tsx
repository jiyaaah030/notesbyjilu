"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/profile");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
      </main>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSigningUp(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Don't push here; let useEffect handle redirect when user state updates
    } catch (err: unknown) {
      // Provide user-friendly error messages
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Try logging in instead, or use a different email.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Email/password signup is not enabled. Please contact support or use Google Sign-in.");
      } else {
        setError("Signup failed. Please check your information and try again.");
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setIsSigningUp(true);
    try {
      await signInWithPopup(auth, provider);
      // Don't push here; let useEffect handle redirect when user state updates
    } catch (err: unknown) {
      // Provide user-friendly error messages for Google sign-in
      const error = err as { code?: string; message?: string };
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Google sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with this email using a different sign-in method.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] px-4">
      <div className="max-w-md w-full space-y-8 border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition">
        <h1 className="text-3xl font-extrabold text-center mb-2">Join NotesbyJilu ✨</h1>
        <p className="text-center text-[var(--color-secondary)] mb-6">Create your account to start sharing & exploring notes</p>
        <form onSubmit={handleSignup} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSigningUp}
            className="w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:opacity-50"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSigningUp}
            className="w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] disabled:opacity-50"
          />
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={isSigningUp}
            className="w-full bg-[var(--color-primary)] text-[var(--color-background)] py-3 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningUp ? "Signing up..." : "Signup"}
          </button>
        </form>

        <div className="flex items-center justify-center my-4">
          <span className="border-t border-[var(--color-primary)] w-1/4"></span>
          <span className="mx-2 text-[var(--color-secondary)]">or</span>
          <span className="border-t border-[var(--color-primary)] w-1/4"></span>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={isSigningUp}
          className="w-full border border-[var(--color-primary)] py-3 rounded-full hover:bg-[var(--color-primary)] hover:text-[var(--color-background)] transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isSigningUp ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </main>
  );
}
