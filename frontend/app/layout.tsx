import type { Metadata } from 'next'
import '../styles/globals.css'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'MARS-GUARD — Martian Adaptive Risk, Safety & Guidance Platform',
  description: 'AI-Powered Martian Safety, Navigation and Mission Intelligence Platform for NASA Space Apps Challenge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col font-sans antialiased">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 mars-grid-pattern">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
