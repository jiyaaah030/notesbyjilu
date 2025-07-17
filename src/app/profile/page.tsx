"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleLogout = async () => {
    const confirm = window.confirm("Are you sure you want to logout?");
    if (confirm) {
      await logout();
      router.push("/"); // optional: redirect home
    }
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-background)] text-[var(--color-primary)] px-4">
      <div className="max-w-lg w-full space-y-8 border-2 border-[var(--color-primary)] rounded-3xl p-8 shadow hover:shadow-lg transition text-center">
        <h1 className="text-3xl font-extrabold mb-2">Welcome to your Profile 🎉</h1>
        <p className="text-[var(--color-secondary)] mb-6">Manage your account & see your details</p>

        <div className="space-y-4">
          <p className="text-lg">
            <span className="font-semibold">Email:</span> {user.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 bg-[var(--color-primary)] text-[var(--color-background)] py-3 px-6 rounded-full hover:bg-[var(--color-secondary)] transition font-semibold"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
