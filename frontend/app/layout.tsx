import type { Metadata } from 'next'
import '../styles/globals.css'
import { MissionProvider } from '@/context/MissionContext'
import HUDStrip from '@/components/navigation/HUDStrip'
import GuidedMissionBanner from '@/components/navigation/GuidedMissionBanner'
import MissionDock from '@/components/navigation/MissionDock'
import BuddyCompanion from '@/components/navigation/BuddyCompanion'
import DataLimitsModal from '@/components/ui/DataLimitsModal'

export const metadata: Metadata = {
  title: 'MARS-GUARD — Martian Adaptive Risk, Safety & Guidance Platform',
  description: 'AI-Powered Game-Quality Space Exploration & Safety Platform for NASA Space Apps Challenge',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050608] text-zinc-100 min-h-screen flex flex-col font-sans antialiased overflow-x-hidden selection:bg-orange-600 selection:text-white">
        <MissionProvider>
          {/* Persistent Mini HUD Strip */}
          <HUDStrip />

          {/* Guided Mode Mission Director Banner */}
          <GuidedMissionBanner />

          {/* Main Full-Bleed World Canvas */}
          <main className="flex-1 w-full relative min-h-screen pt-12 pb-24">
            {children}
          </main>

          {/* Floating Circular Mission Dock */}
          <MissionDock />

          {/* Interactive MARS-GUARD Buddy Character */}
          <BuddyCompanion />

          {/* NASA Data Provenance & Real vs Simulated Modal */}
          <DataLimitsModal />
        </MissionProvider>
      </body>
    </html>
  )
}
