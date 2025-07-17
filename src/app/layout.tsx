import './globals.css'
import Navbar from './components/Navbar'
import { Quicksand } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '600', '700']
})

export const metadata = {
  title: "NotesbyJilu | A note-sharing app",
  description: "A cute place to share & find college notes. Sharing is caring!",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={quicksand.className}>
        <AuthProvider>
        <Navbar />
        {children}
        </AuthProvider>
      </body>
    </html>
  )
}
