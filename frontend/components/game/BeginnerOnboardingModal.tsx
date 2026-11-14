'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Compass,
  Zap,
  Mountain,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Bot,
  CheckCircle,
  HelpCircle,
  Radio
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'

interface TutorialSlide {
  title: string
  subtitle: string
  icon: React.ElementType
  iconColor: string
  content: string
  eli5: string
  tip: string
}

const TUTORIAL_SLIDES: TutorialSlide[] = [
  {
    title: 'Welcome to Mars, Explorer!',
    subtitle: 'Meet PIP — Your Autonomous AI Companion',
    icon: Bot,
    iconColor: 'text-cyan-400',
    content: "You've just landed inside Jezero Crater, an ancient 45-kilometer-wide Martian lake basin. I'm PIP, your robotic exploration partner. I'll translate complex scientific sensors into simple, fun insights as you explore!",
    eli5: "Think of me as your GPS, scientist, and safety co-pilot rolled into one friendly floating robot.",
    tip: 'Click on PIP anytime in the bottom-right corner for mission hints or fun Mars facts.'
  },
  {
    title: 'Driving & Reading the Terrain',
    subtitle: 'MOLA Elevation, Regolith & Rollover Hazards',
    icon: Mountain,
    iconColor: 'text-amber-400',
    content: "Mars terrain ranges from soft sand dunes to rocky basalt plains. Slopes below 10° are smooth sailing. But watch out for steep cliff walls: our rover has a strict 18° rollover safety threshold!",
    eli5: "If a slope is over 18°, it's like trying to drive up a loose gravel slide. Steer around it to keep your rover upright!",
    tip: 'Look for the green (Safe), amber (Caution), or red (Danger) badges before moving.'
  },
  {
    title: 'Scanning for Ancient Clays & Ice',
    subtitle: 'How Multi-Spectral Radar Works',
    icon: Radio,
    iconColor: 'text-purple-400',
    content: "Billions of years ago, Jezero Crater was filled with deep liquid water! When you click 'Run Terrain Scan', our sensors measure reflected light to find minerals like Smectite Clay and subsurface ice.",
    eli5: "Smectite clay is like ancient dried mud from a calm lake. Finding it proves water once flowed right where you are standing!",
    tip: 'Each scan earns you Exploration XP and reveals whether you can cache a rock core.'
  },
  {
    title: 'Survival Systems & Mission Badges',
    subtitle: 'Battery, Oxygen & Ranking Up',
    icon: Zap,
    iconColor: 'text-emerald-400',
    content: "Driving and scanning consume rover battery. Keep an eye on your solar charge gauge during the Martian noon, and complete mission objectives to earn original exploration badges and rank up to Planetary Pioneer!",
    eli5: "Park in the sunlight when your battery gets low, and complete all 3 mission objectives to unlock new landing zones.",
    tip: 'Review your collected core samples anytime in the Martian Field Codex.'
  }
]

interface BeginnerOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BeginnerOnboardingModal({ isOpen, onClose }: BeginnerOnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { playClick, playChime, addXP } = useMission()

  if (!isOpen) return null

  const slide = TUTORIAL_SLIDES[currentSlide]
  const Icon = slide.icon
  const isLast = currentSlide === TUTORIAL_SLIDES.length - 1

  const handleNext = () => {
    playClick()
    if (isLast) {
      playChime()
      addXP(50)
      onClose()
    } else {
      setCurrentSlide(s => s + 1)
    }
  }

  const handlePrev = () => {
    playClick()
    setCurrentSlide(s => Math.max(0, s - 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-zinc-950 p-6 shadow-2xl glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
                EXPLORER TUTORIAL • STEP {currentSlide + 1} OF {TUTORIAL_SLIDES.length}
              </span>
              <h3 className="font-mono text-base font-bold text-white">
                {slide.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              playClick()
              onClose()
            }}
            className="p-1 text-zinc-500 hover:text-white transition"
            title="Skip Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slide Body */}
        <div className="space-y-4">
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            {slide.content}
          </p>

          {/* ELI5 Plain English Box */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-300 mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>PLAIN ENGLISH EXPLANATION</span>
            </div>
            <p className="text-xs text-zinc-200 font-sans leading-relaxed italic">
              &quot;{slide.eli5}&quot;
            </p>
          </div>

          {/* Pro Tip */}
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Explorer Tip:</strong> {slide.tip}</span>
          </div>
        </div>

        {/* Slide Dots & Action Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-zinc-800/80 pt-4">
          <div className="flex items-center gap-1.5">
            {TUTORIAL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  playClick()
                  setCurrentSlide(idx)
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-mono font-bold text-white shadow-lg shadow-cyan-950 hover:from-cyan-500 hover:to-blue-500 transition"
            >
              <span>{isLast ? 'Begin Exploration (+50 XP)' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

