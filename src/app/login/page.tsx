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
      // Provide user-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email. Please check your email or create a new account.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again or reset your password.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("This email is registered with Google Sign-in. Please use 'Continue with Google' instead, or create a new account through sign up.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    try {
      await signInWithPopup(auth, provider);
      router.push("/profile");
    } catch (err: any) {
      // Provide user-friendly error messages for Google sign-in
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Google sign-in was cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with this email using a different sign-in method.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
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
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
