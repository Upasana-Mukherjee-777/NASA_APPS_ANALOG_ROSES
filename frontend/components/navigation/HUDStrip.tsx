'use client'

import React from 'react'
import Link from 'next/link'
import { Volume2, VolumeX, Shield, Battery, Wind, Info, Sparkles, Compass } from 'lucide-react'
import { useMission } from '@/context/MissionContext'

export default function HUDStrip() {
  const {
    telemetry,
    soundEnabled,
    toggleSound,
    playClick,
    guidedMode,
    setGuidedMode,
    currentStep,
    setShowDataLimits,
    missionXP,
  } = useMission()

  // Circular gauge calculations
  const batteryPct = Math.max(0, Math.min(100, telemetry.batteryPct))
  const o2Pct = Math.max(0, Math.min(100, telemetry.o2Pct))
  const radius = 11
  const circumference = 2 * Math.PI * radius
  const battOffset = circumference - (batteryPct / 100) * circumference
  const o2Offset = circumference - (o2Pct / 100) * circumference

  // Risk styling
  const riskColor =
    telemetry.riskLevel === 'CRITICAL' || telemetry.riskScore > 0.7
      ? 'text-red-400 bg-red-950/70 border-red-500/60 shadow-red-500/20'
      : telemetry.riskLevel === 'HIGH' || telemetry.riskScore > 0.45
      ? 'text-amber-400 bg-amber-950/70 border-amber-500/60 shadow-amber-500/20'
      : 'text-emerald-400 bg-emerald-950/70 border-emerald-500/60 shadow-emerald-500/20'

  return (
    <header className="fixed top-2 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-5xl pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-2 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl transition-all">
        {/* Left: Mission Clock & Sol */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            onClick={playClick}
            className="flex items-center gap-2 group cursor-pointer"
            title="Return to Mars Globe"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <span className="text-white text-[10px] font-black tracking-tighter">MG</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">MISSION</div>
              <div className="text-xs font-bold text-white font-mono leading-none">EVA-07</div>
            </div>
          </Link>

          <div className="h-6 w-px bg-zinc-800" />

          {/* Sol & Clock */}
          <div className="flex items-center gap-2 font-mono">
            <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-orange-400">
              SOL {telemetry.sol}
            </span>
            <span className="text-[11px] font-semibold text-zinc-300 hidden md:inline-block">
              {telemetry.clock}
            </span>
          </div>
        </div>

        {/* Center: Risk Gauge */}
        <div className="flex items-center gap-2 font-mono">
          <Link
            href="/risk"
            onClick={playClick}
            className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold tracking-wide shadow-md transition touch-react ${riskColor}`}
            title="Inspect Dynamic Risk Radar"
          >
            <Shield className="w-3.5 h-3.5 animate-pulse" />
            <span>RISK {(telemetry.riskScore * 100).toFixed(0)}%</span>
            <span className="text-[9px] uppercase tracking-wider opacity-80 hidden sm:inline">
              {telemetry.riskLevel}
            </span>
          </Link>
        </div>

        {/* Right: Battery, O2 Rings & Quick Toggles */}
        <div className="flex items-center gap-3">
          {/* Battery Ring */}
          <div className="flex items-center gap-1.5" title={`Rover Battery: ${batteryPct.toFixed(0)}%`}>
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg className="w-7 h-7 -rotate-90">
                <circle cx="14" cy="14" r={radius} stroke="#272f44" strokeWidth="2.5" fill="none" />
                <circle
                  cx="14"
                  cy="14"
                  r={radius}
                  stroke={batteryPct > 40 ? '#10b981' : '#f59e0b'}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={battOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <Battery className="w-3 h-3 text-zinc-200 absolute" />
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-300 hidden lg:inline">
              {batteryPct.toFixed(0)}%
            </span>
          </div>

          {/* O2 Ring */}
          <div className="flex items-center gap-1.5" title={`Suit Oxygen: ${o2Pct.toFixed(0)}%`}>
            <div className="relative w-7 h-7 flex items-center justify-center">
              <svg className="w-7 h-7 -rotate-90">
                <circle cx="14" cy="14" r={radius} stroke="#272f44" strokeWidth="2.5" fill="none" />
                <circle
                  cx="14"
                  cy="14"
                  r={radius}
                  stroke={o2Pct > 40 ? '#38bdf8' : '#ef4444'}
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={o2Offset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <Wind className="w-3 h-3 text-cyan-200 absolute" />
            </div>
            <span className="text-[10px] font-mono font-bold text-zinc-300 hidden lg:inline">
              {o2Pct.toFixed(0)}%
            </span>
          </div>

          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

          {/* Mode & Sound Toggles */}
          <div className="flex items-center gap-1.5">
            {/* Guided Mode Pill */}
            <button
              onClick={() => {
                playClick()
                setGuidedMode(!guidedMode)
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition hidden sm:flex items-center gap-1 ${
                guidedMode
                  ? 'border-orange-500/60 bg-orange-950/60 text-orange-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
              title="Toggle Step-by-Step Guided Mission"
            >
              <Compass className="w-3 h-3" />
              <span>{guidedMode ? 'GUIDED' : 'FREE'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                toggleSound()
              }}
              className={`p-1.5 rounded-xl border transition ${
                soundEnabled
                  ? 'border-cyan-500/50 bg-cyan-950/50 text-cyan-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
              title={soundEnabled ? 'Mute Soundscape' : 'Enable Space Soundscape & Audio Clicks'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Data & Limits Info Chip */}
            <button
              onClick={() => {
                playClick()
                setShowDataLimits(true)
              }}
              className="p-1.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
              title="View NASA Data Provenance & Real vs Simulated Limits"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
