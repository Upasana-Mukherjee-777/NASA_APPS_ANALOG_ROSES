'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Compass,
  Sparkles,
  Heart,
  Battery,
  AlertTriangle,
  Award
} from 'lucide-react'
import { getMissions, getMissionReport } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

interface HighlightEvent {
  time: string
  title: string
  desc: string
  image: string
  tag: string
}

const HIGHLIGHT_REEL: HighlightEvent[] = [
  {
    time: 'T+00h 15m',
    title: 'Octavia Butler Camp Departure',
    desc: 'Crew egressed base camp on nominal Aegis SafePath corridor.',
    image: '/assets/nasa/PIA24331.jpg',
    tag: 'EGRESS',
  },
  {
    time: 'T+01h 45m',
    title: 'Delta Scarp Scree Standoff',
    desc: 'AI identified 19.4° scree slide. Enforced mandatory 25m safety perimeter.',
    image: '/assets/nasa/PIA24814.jpg',
    tag: 'HAZARD AVOIDED',
  },
  {
    time: 'T+02h 30m',
    title: 'Contingency Dust Storm Reaction',
    desc: 'Atmospheric opacity peaked at Tau 2.45. Reduced rover velocity to 1.2 km/h.',
    image: '/assets/nasa/PIA25290.jpg',
    tag: 'CONTINGENCY',
  },
  {
    time: 'T+03h 40m',
    title: 'Smectite Core Bedrock Drilling',
    desc: 'Cached core sample in hermetic titanium tube for Mars Sample Return.',
    image: '/assets/nasa/PIA26575.jpg',
    tag: 'SCIENCE SUCCESS',
  },
]

export default function MissionReportStoryPage() {
  const { playClick, playChime, missionXP } = useMission()
  const [replayIdx, setReplayIdx] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)

  // Replay animation loop
  useEffect(() => {
    if (!isReplaying) return
    const interval = setInterval(() => {
      setReplayIdx(prev => {
        if (prev >= HIGHLIGHT_REEL.length - 1) {
          setIsReplaying(false)
          return HIGHLIGHT_REEL.length - 1
        }
        return prev + 1
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [isReplaying])

  const handlePrint = () => {
    playClick()
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-4xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type="REAL" />
            <span className="text-xs font-mono font-bold text-zinc-400">
              MISSION EVALUATION DOSSIER
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            EVA-07 Mission Report & Story
          </h1>
          <p className="text-xs text-zinc-400">Jezero Western Delta Front Surface Excursion</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold shadow-lg transition touch-react"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>EXPORT / PRINT PDF</span>
          </button>
        </div>
      </div>

      {/* Mission Scorecard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-center backdrop-blur-xl">
          <Shield className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">Safety Score</span>
          <span className="text-2xl font-black font-mono text-white">96%</span>
          <span className="text-[9px] font-mono text-emerald-400">Zero Violations</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-center backdrop-blur-xl">
          <Award className="w-6 h-6 mx-auto text-amber-400 mb-1" />
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">Samples Cached</span>
          <span className="text-2xl font-black font-mono text-white">3 Tubes</span>
          <span className="text-[9px] font-mono text-amber-400">Smectite Clays</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-center backdrop-blur-xl">
          <Heart className="w-6 h-6 mx-auto text-rose-400 mb-1" />
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">Cardiac Margin</span>
          <span className="text-2xl font-black font-mono text-white">38%</span>
          <span className="text-[9px] font-mono text-rose-400">Avg 82 BPM</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4 text-center backdrop-blur-xl">
          <Battery className="w-6 h-6 mx-auto text-cyan-400 mb-1" />
          <span className="text-[10px] font-mono text-zinc-400 block uppercase">Battery Reserve</span>
          <span className="text-2xl font-black font-mono text-white">74%</span>
          <span className="text-[9px] font-mono text-cyan-400">Nominal Thermal</span>
        </div>
      </div>

      {/* Mission Story Timeline Replay Bar */}
      <div className="rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-5 shadow-2xl glass-panel">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              INTERACTIVE STORY REPLAY ANIMATION
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick()
                setIsReplaying(!isReplaying)
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold transition"
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isReplaying ? 'PAUSE' : 'PLAY REPLAY'}</span>
            </button>
            <button
              onClick={() => {
                playClick()
                setReplayIdx(0)
                setIsReplaying(false)
              }}
              className="p-1.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition"
              title="Reset Replay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Highlight Reel Featured Event Card */}
        {HIGHLIGHT_REEL[replayIdx] && (
          <div className="flex flex-col md:flex-row gap-5 items-center animate-in fade-in">
            <div className="relative w-full md:w-80 h-52 rounded-2xl overflow-hidden border border-zinc-700 shrink-0">
              <img
                src={HIGHLIGHT_REEL[replayIdx].image}
                alt={HIGHLIGHT_REEL[replayIdx].title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-zinc-700 text-[10px] font-mono font-bold text-orange-400">
                {HIGHLIGHT_REEL[replayIdx].time}
              </span>
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-[10px] font-mono font-bold text-emerald-300">
                {HIGHLIGHT_REEL[replayIdx].tag}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {HIGHLIGHT_REEL[replayIdx].title}
              </h3>
              <p className="text-sm text-zinc-300 font-sans leading-relaxed">
                {HIGHLIGHT_REEL[replayIdx].desc}
              </p>
              <div className="pt-2 text-xs font-mono text-zinc-400">
                Step {replayIdx + 1} of {HIGHLIGHT_REEL.length} in EVA-07 Traversal Log
              </div>
            </div>
          </div>
        )}

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mt-5">
          {HIGHLIGHT_REEL.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                playClick()
                setReplayIdx(i)
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                i === replayIdx ? 'bg-orange-500 scale-125' : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
