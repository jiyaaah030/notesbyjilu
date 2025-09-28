'use client'
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const confirm = window.confirm("Are you sure you want to logout?");
    if (confirm) {
      await logout();
      router.push("/"); // redirect home
    }
  };

  return (
    <nav className="bg-[var(--color-background)] text-[var(--color-primary)] shadow-md py-4 flex justify-center px-4">
      <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-lg">

        {/* Left links */}
        <div className="flex gap-x-6">
          <Link href="/browse" className="hover:text-[var(--color-secondary)] transition-colors">Browse</Link>
          <Link href="/upload" className="hover:text-[var(--color-secondary)] transition-colors">Upload</Link>
        </div>

        {/* Logo */}
        <Link href="/" className="font-extrabold text-2xl hover:text-[var(--color-secondary)] flex items-center space-x-1">
          <span>NotesbyJilu</span>
        </Link>

        {/* Right links */}
        <div className="flex gap-x-6">
          {loading ? null : !user ? (
            <>
              <Link href="/login" className="hover:text-[var(--color-secondary)] transition-colors">Login</Link>
              <Link href="/signup" className="hover:text-[var(--color-secondary)] transition-colors font-semibold">Signup</Link>
            </>
          ) : (
            <>
              <Link href="/profile" className="hover:text-[var(--color-secondary)] transition-colors">Profile</Link>
              <button
                onClick={handleLogout}
                className="hover:text-[var(--color-secondary)] transition-colors font-semibold"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
