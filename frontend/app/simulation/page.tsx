'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Wind,
  Flame,
  Radio,
  Shield,
  AlertTriangle,
  Sparkles,
  Compass,
  CheckCircle2,
  Crosshair,
  Eye,
  Camera,
  Activity,
  Layers,
  Zap,
  Battery,
  Navigation
} from 'lucide-react'
import { runSimulation, injectAnomaly, clearAnomaly } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

const DISASTER_CARDS = [
  {
    id: 'DUST_STORM',
    title: 'Severe Dust Storm',
    icon: Wind,
    color: 'from-amber-600 to-yellow-700',
    border: 'border-amber-500',
    desc: 'Atmospheric opacity spikes (Tau > 2.4). Solar power down 70%.',
    lesson: 'Historical Lesson: Apollo 17 lunar dust fouled thermal radiators and suit bearings within 3 EVAs.',
  },
  {
    id: 'RADIATION_SPIKE',
    title: 'Solar Particle Event',
    icon: Radio,
    color: 'from-purple-600 to-indigo-800',
    border: 'border-purple-500',
    desc: 'Solar flare pushes surface dose > 120 μSv/hr. Regolith shelter needed.',
    lesson: 'Historical Lesson: Apollo 16 narrowly missed the massive August 1972 solar proton event.',
  },
  {
    id: 'EQUIPMENT_FAULT',
    title: 'Rover Drive Failure',
    icon: Zap,
    color: 'from-rose-600 to-red-800',
    border: 'border-rose-500',
    desc: 'Motor thermal trip on right bogie. Traversal speed capped at 0.8 km/h.',
    lesson: 'Historical Lesson: Opportunity rover right-front wheel seized at Sol 779; drove backward for 13 years.',
  },
  {
    id: 'O2_LEAK',
    title: 'Suit Oxygen Leak',
    icon: Flame,
    color: 'from-red-600 to-orange-800',
    border: 'border-red-500',
    desc: 'Primary loop pressure falling (-15 Pa/min). Immediate abort required.',
    lesson: 'Historical Lesson: ISS EVA 23 (Luca Parmitano) suffered water intrusion choking helmet comms and vision.',
  },
]

export default function MissionSimulatorPage() {
  const { playClick, playChime, playWarning, triggerAnomalyEvent } = useMission()

  // View Mode: Map vs Helmet HUD
  const [viewMode, setViewMode] = useState<'MAP' | 'HELMET'>('HELMET')

  // Simulation Controls
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState<number>(1) // 1x, 2x, 5x, 10x
  const [timelineStep, setTimelineStep] = useState<number>(12) // 0 to 100%

  // Tactile Environmental Sliders
  const [dustTau, setDustTau] = useState<number>(0.49)
  const [radiationUsv, setRadiationUsv] = useState<number>(26.8)
  const [tempC, setTempC] = useState<number>(-43.2)
  const [slopeDeg, setSlopeDeg] = useState<number>(7.2)

  // Disaster State
  const [activeDisaster, setActiveDisaster] = useState<any>(null)
  const [lessonToast, setLessonToast] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Simulation run loop
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const interval = Math.max(150, Math.round(1000 / speed))
    timerRef.current = setInterval(() => {
      setTimelineStep(prev => {
        if (prev >= 100) {
          setIsRunning(false)
          playChime()
          return 100
        }
        return prev + 1
      })
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning, speed])

  const triggerDisaster = async (card: any) => {
    playWarning()
    setActiveDisaster(card)
    setLessonToast(card.lesson)
    triggerAnomalyEvent(card.id, 'HIGH')

    if (card.id === 'DUST_STORM') {
      setDustTau(2.45)
    } else if (card.id === 'RADIATION_SPIKE') {
      setRadiationUsv(135.0)
    }

    try {
      await injectAnomaly(card.id, 'HIGH', card.desc)
    } catch (e) {}
  }

  const resetSimulation = async () => {
    playClick()
    setIsRunning(false)
    setTimelineStep(0)
    setActiveDisaster(null)
    setLessonToast(null)
    setDustTau(0.49)
    setRadiationUsv(26.8)
    try {
      await clearAnomaly()
    } catch (e) {}
  }

  // Calculate dynamic risk based on sliders + disasters
  const dynamicRisk = Math.min(
    0.98,
    +(0.18 + (dustTau / 3.0) * 0.35 + (radiationUsv / 160) * 0.3 + (activeDisaster ? 0.3 : 0)).toFixed(2)
  )

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden flex flex-col justify-between bg-black">
      {/* Visual Effects Overlays */}
      {/* 1. Dust Particles when Tau is high */}
      {dustTau > 1.2 && (
        <div className="absolute inset-0 pointer-events-none z-20 bg-amber-900/25 mix-blend-color-burn animate-dust" />
      )}

      {/* 2. Red Alert Vignette when risk is high */}
      {dynamicRisk > 0.65 && (
        <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_90px_rgba(239,68,68,0.5)] animate-pulse" />
      )}

      {/* 3. Screen Flicker when disaster is active */}
      {activeDisaster && (
        <div className="absolute inset-0 pointer-events-none z-20 bg-red-950/10 backdrop-brightness-95" />
      )}

      {/* View Canvas: Top-down Map or Helmet HUD */}
      <div className="absolute inset-0 select-none">
        {viewMode === 'HELMET' ? (
          // Helmet HUD View
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Real NASA Mars Panorama Background */}
            <img
              src="/assets/nasa/PIA24331.jpg"
              alt="Martian Horizon"
              className="w-full h-full object-cover scale-105 filter contrast-125 brightness-90 transition-transform duration-1000"
              style={{
                transform: `scale(${1.05 + timelineStep * 0.001}) translateY(${dustTau > 1.5 ? '-5px' : '0px'})`,
              }}
            />

            {/* Astronaut Visor Curve and Scanlines */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-zinc-950/80 rounded-[48px] shadow-inner" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />

            {/* Tactical Crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-70">
              <Crosshair className="w-16 h-16 text-cyan-400/80 stroke-1 animate-pulse" />
            </div>

            {/* Real-time Compass Arc */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>HEADING 284° WNW (JEZERO DELTA FRONT)</span>
            </div>
          </div>
        ) : (
          // Top-down Tactical Map View
          <div className="relative w-full h-full">
            <img
              src="/assets/nasa/PIA24096.jpg"
              alt="Tactical Map"
              className="w-full h-full object-cover filter contrast-150 brightness-75"
            />
            <div className="absolute inset-0 mars-grid-pattern opacity-40 pointer-events-none" />

            {/* Simulated Rover Marker */}
            <div
              className="absolute w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white shadow-xl transition-all duration-300"
              style={{
                left: `${25 + timelineStep * 0.5}%`,
                top: `${40 - Math.sin(timelineStep * 0.1) * 10}%`,
              }}
            >
              <Navigation className="w-4 h-4 fill-current rotate-45" />
            </div>
          </div>
        )}
      </div>

      {/* Top Floating View Switcher & Live Badges */}
      <div className="relative z-30 p-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2">
          <SimulatedBadge type={activeDisaster ? 'SIMULATED' : 'REAL'} />
          <button
            onClick={() => {
              playClick()
              setViewMode(viewMode === 'HELMET' ? 'MAP' : 'HELMET')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-white/15 bg-zinc-950/80 backdrop-blur-md text-zinc-200 text-xs font-mono font-bold hover:bg-zinc-900 transition shadow-lg touch-react"
          >
            <Camera className="w-3.5 h-3.5 text-orange-400" />
            <span>{viewMode === 'HELMET' ? 'SWITCH TO 2D MAP' : 'HELMET HUD VIEW'}</span>
          </button>
        </div>

        {/* Dynamic Risk Gauge */}
        <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-md shadow-xl font-mono text-xs font-bold">
          <span className="text-zinc-400 text-[10px]">RISK:</span>
          <span
            className={
              dynamicRisk > 0.7 ? 'text-red-400' : dynamicRisk > 0.4 ? 'text-amber-400' : 'text-emerald-400'
            }
          >
            {(dynamicRisk * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Lesson from History Slide-in Toast */}
      {lessonToast && (
        <div className="relative z-30 mx-auto w-[92%] max-w-lg rounded-2xl border border-amber-500/50 bg-amber-950/90 backdrop-blur-xl p-3.5 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 mb-1 text-[11px] font-mono font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HISTORICAL SAFETY LESSON (NASA RAG)</span>
          </div>
          <p className="text-xs text-zinc-200 leading-snug">{lessonToast}</p>
        </div>
      )}

      {/* Chunky Game-like Controls & Disaster Deck */}
      <div className="relative z-30 p-4 space-y-3 pointer-events-auto">
        {/* Disaster Deck of Illustrated Cards */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest pl-1 shrink-0">
            DISASTER DECK:
          </span>
          {DISASTER_CARDS.map(card => {
            const Icon = card.icon
            const isCardActive = activeDisaster?.id === card.id
            return (
              <button
                key={card.id}
                onClick={() => triggerDisaster(card)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-2xl border bg-gradient-to-r transition-all touch-react shrink-0 ${
                  isCardActive
                    ? `${card.border} ${card.color} text-white shadow-xl scale-105`
                    : 'border-white/10 bg-zinc-950/80 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <Icon className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold font-mono whitespace-nowrap">{card.title}</span>
              </button>
            )
          })}
        </div>

        {/* Bottom Cockpit Control Bar */}
        <div className="rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-4 shadow-2xl glass-panel">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Play, Pause, Speed & Reset */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <button
                onClick={() => {
                  playClick()
                  setIsRunning(!isRunning)
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-mono text-xs font-bold text-white shadow-lg transition touch-react ${
                  isRunning
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-orange-600 hover:bg-orange-500 glow-orange'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isRunning ? 'PAUSE EVA' : 'RUN SIMULATION'}</span>
              </button>

              {/* Speed Dial Buttons: 1x, 2x, 5x, 10x */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      playClick()
                      setSpeed(s)
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
                      speed === s ? 'bg-orange-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={resetSimulation}
                className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition"
                title="Reset Simulation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Sol Timeline Scrubber */}
            <div className="flex-1 w-full flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-zinc-400 whitespace-nowrap">
                PROGRESS:
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={timelineStep}
                onChange={e => setTimelineStep(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
              <span className="text-xs font-mono font-bold text-orange-400 min-w-[36px]">
                {timelineStep}%
              </span>
            </div>

            {/* Tactile Slider Quick Feedback Chips */}
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-300">
              <span className="p-1 rounded bg-zinc-900 border border-zinc-800">
                TAU {dustTau.toFixed(2)}
              </span>
              <span className="p-1 rounded bg-zinc-900 border border-zinc-800">
                RAD {radiationUsv.toFixed(0)} μSv
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
