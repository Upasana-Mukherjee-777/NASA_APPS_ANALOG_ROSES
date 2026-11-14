'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  Play,
  RotateCw,
  Eye,
  Shield,
  Activity,
  Database,
  Route,
  Camera,
  Gamepad2,
  Sun,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Award,
  Layers
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'
import MarsGlobeHero from '@/components/globe/MarsGlobeHero'
import LivingMartianEnvironment from '@/components/game/LivingMartianEnvironment'
import MartianGameStation from '@/components/game/MartianGameStation'
import BeginnerOnboardingModal from '@/components/game/BeginnerOnboardingModal'

export default function MarsGlobeHomePage() {
  const { playClick, playChime, missionXP } = useMission()

  // Primary View Mode: Defaults strictly to 'globe' to ensure the rotating 3D Mars globe is the signature centerpiece
  const [activeViewMode, setActiveViewMode] = useState<'globe' | 'game' | 'surface'>('globe')
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <div className="relative w-full min-h-screen px-3 sm:px-6 lg:px-8 py-5 space-y-8 bg-[#020408]">
      {/* 3D MARS GLOBE HERO VIEWPORT (CENTERPIECE HERO) */}
      {activeViewMode === 'globe' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          {/* Main 3D Interactive Rotating Mars Globe */}
          <MarsGlobeHero
            activeMode={activeViewMode}
            onSelectMode={(mode) => setActiveViewMode(mode)}
            onOpenTutorial={() => setShowTutorial(true)}
          />

          {/* EXPEDITION EXPANSIONS & SCIENTIFIC LABS SHOWCASE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Ares Expedition Game Card */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between hover:border-orange-500/40 transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-2xl bg-orange-950/80 border border-orange-700/60 text-orange-400">
                    <Gamepad2 className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-[10px] text-orange-400 bg-orange-950/50 px-2.5 py-1 rounded-full border border-orange-800/40">
                    ARES STATION
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-orange-400 transition">
                  Ares Expedition Game
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Drive the surface rover, perform multi-spectral scans, extract geological cores, and complete field objectives.
                </p>
              </div>
              <button
                onClick={() => {
                  playClick()
                  setActiveViewMode('game')
                }}
                className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-orange-600/90 hover:bg-orange-500 text-white font-mono text-xs font-bold transition shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>LAUNCH GAME STATION</span>
              </button>
            </div>

            {/* Living Martian Surface Card */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between hover:border-cyan-500/40 transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
                    <Sun className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/50 px-2.5 py-1 rounded-full border border-cyan-800/40">
                    SURFACE SIM
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                  Living Martian Environment
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Real-time diurnal day/night cycles, blue Martian sunsets, atmospheric dust particle storms, and terrain illumination.
                </p>
              </div>
              <button
                onClick={() => {
                  playClick()
                  setActiveViewMode('surface')
                }}
                className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition shadow-lg"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>ENTER LIVING SURFACE</span>
              </button>
            </div>

            {/* Field Explorer Tutorial Card */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between hover:border-purple-500/40 transition group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="p-2.5 rounded-2xl bg-purple-950/80 border border-purple-700/60 text-purple-400">
                    <HelpCircle className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-[10px] text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded-full border border-purple-800/40">
                    ONBOARDING
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition">
                  Interactive Field Tutorial
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Plain-English walkthrough covering 3D globe navigation, GIS layers, route optimization, and safety protocols.
                </p>
              </div>
              <button
                onClick={() => {
                  playClick()
                  setShowTutorial(true)
                }}
                className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-mono text-xs font-bold transition shadow-lg"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>START TUTORIAL</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* EXPEDITION GAME STATION VIEWPORT */}
      {activeViewMode === 'game' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playClick()
                  setActiveViewMode('globe')
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-orange-500/50 bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 font-mono text-xs font-bold transition shadow-lg"
              >
                <Eye className="w-4 h-4" />
                <span>← RETURN TO 3D MARS GLOBE</span>
              </button>
              <div>
                <h2 className="text-xl font-black text-white">ARES EXPEDITION GAME STATION</h2>
                <p className="text-xs text-zinc-400">Multi-spectral scanning & rover field survival</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClick()
                  setActiveViewMode('surface')
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs font-bold transition"
              >
                <Sun className="w-3.5 h-3.5 inline mr-1.5 text-cyan-400" />
                <span>Living Surface</span>
              </button>
              <button
                onClick={() => {
                  playClick()
                  setShowTutorial(true)
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs font-bold transition"
              >
                <HelpCircle className="w-3.5 h-3.5 inline mr-1.5 text-purple-400" />
                <span>Tutorial</span>
              </button>
            </div>
          </div>

          <MartianGameStation />
        </section>
      )}

      {/* LIVING MARTIAN ENVIRONMENT VIEWPORT */}
      {activeViewMode === 'surface' && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playClick()
                  setActiveViewMode('globe')
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-orange-500/50 bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 font-mono text-xs font-bold transition shadow-lg"
              >
                <Eye className="w-4 h-4" />
                <span>← RETURN TO 3D MARS GLOBE</span>
              </button>
              <div>
                <h2 className="text-xl font-black text-white">LIVING MARTIAN ENVIRONMENT</h2>
                <p className="text-xs text-zinc-400">Atmospheric simulation, dust storms & diurnal lighting</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playClick()
                  setActiveViewMode('game')
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs font-bold transition"
              >
                <Gamepad2 className="w-3.5 h-3.5 inline mr-1.5 text-orange-400" />
                <span>Expedition Game</span>
              </button>
              <button
                onClick={() => {
                  playClick()
                  setShowTutorial(true)
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs font-bold transition"
              >
                <HelpCircle className="w-3.5 h-3.5 inline mr-1.5 text-purple-400" />
                <span>Tutorial</span>
              </button>
            </div>
          </div>

          <LivingMartianEnvironment />
        </section>
      )}

      {/* INTERACTIVE BEGINNER TUTORIAL MODAL */}
      <BeginnerOnboardingModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  )
}
