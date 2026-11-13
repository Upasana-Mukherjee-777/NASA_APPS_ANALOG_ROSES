'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Brain,
  Sliders,
  Sparkles,
  Info,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { predictRisk, getMLMetrics } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

export default function RiskRadarPage() {
  const { playClick, playChime } = useMission()

  // Draggable Split Slider Position (0 to 100%)
  const [splitPos, setSplitPos] = useState(50)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Sliders for dynamic tuning
  const [slopeDeg, setSlopeDeg] = useState(8.5)
  const [radiationUsv, setRadiationUsv] = useState(28.0)
  const [dustTau, setDustTau] = useState(0.52)
  const [fatigueScore, setFatigueScore] = useState(35.0)

  // Baseline vs Active Anomaly
  const baselineRisk = 0.22
  const activeRisk = +(
    0.15 +
    (slopeDeg / 18.0) * 0.35 +
    (radiationUsv / 160.0) * 0.3 +
    (dustTau / 2.0) * 0.2
  ).toFixed(2)

  // Displayed Risk based on Split Slider Position
  const displayRisk = splitPos > 50 ? activeRisk : baselineRisk
  const riskColor =
    displayRisk > 0.65 ? 'text-red-400 stroke-red-500' : displayRisk > 0.4 ? 'text-amber-400 stroke-amber-500' : 'text-emerald-400 stroke-emerald-500'

  const radarNodes = [
    { label: 'Slope', angle: 30, dist: (slopeDeg / 18) * 120, val: `${slopeDeg}°` },
    { label: 'Radiation', angle: 90, dist: (radiationUsv / 160) * 120, val: `${radiationUsv} μSv` },
    { label: 'Dust (τ)', angle: 150, dist: (dustTau / 2) * 120, val: `${dustTau}` },
    { label: 'Fatigue', angle: 210, dist: (fatigueScore / 80) * 120, val: `${fatigueScore}%` },
    { label: 'Equipment', angle: 270, dist: 35, val: '94%' },
    { label: 'Pressure', angle: 330, dist: 25, val: '718 Pa' },
  ]

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden flex flex-col justify-between bg-black">
      {/* Background Starfield and Mars Mesh */}
      <div className="absolute inset-0 select-none space-stars opacity-80" />

      {/* Top Header */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <SimulatedBadge type="REAL" />
          <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
            AI MULTI-FACTOR RISK RADAR
          </span>
        </div>
        <div className="px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          MODEL CONFIDENCE: <strong className="text-emerald-400">94.8%</strong>
        </div>
      </div>

      {/* Central Radar / Sonar Visual Display */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-auto">
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
          {/* Animated Sweeping Radar Beam */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 bg-cyan-950/10 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 animate-radar origin-center bg-gradient-to-tr from-transparent via-cyan-500/10 to-cyan-400/30 rounded-full pointer-events-none" />
          </div>

          {/* Concentric Radar Distance Rings */}
          <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/25 pointer-events-none" />
          <div className="absolute w-1/2 h-1/2 rounded-full border border-cyan-500/30 pointer-events-none" />
          <div className="absolute w-1/4 h-1/4 rounded-full border border-cyan-500/35 pointer-events-none" />

          {/* Crosshairs */}
          <div className="absolute w-full h-px bg-cyan-500/20 pointer-events-none" />
          <div className="absolute h-full w-px bg-cyan-500/20 pointer-events-none" />

          {/* Plotted Risk Factor Nodes on Radar */}
          {radarNodes.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180
            const x = Math.cos(rad) * node.dist
            const y = Math.sin(rad) * node.dist
            return (
              <div
                key={i}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-white shadow-lg animate-ping" />
                <div className="w-3.5 h-3.5 rounded-full bg-orange-600 border border-white shadow-lg absolute" />
                <span className="mt-1 px-1.5 py-0.5 rounded bg-black/80 border border-zinc-700 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-md">
                  {node.label}: {node.val}
                </span>
              </div>
            )
          })}

          {/* Central Composite Risk Gauge Core */}
          <div className="relative z-10 w-28 h-28 rounded-full border-2 border-white/20 bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl">
            <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">
              {splitPos > 50 ? 'CURRENT RISK' : 'BASELINE RISK'}
            </span>
            <span className={`text-2xl font-black font-mono ${riskColor}`}>
              {(displayRisk * 100).toFixed(0)}%
            </span>
            <span className="text-[8px] font-mono text-zinc-400">
              {displayRisk > 0.65 ? 'CRITICAL' : displayRisk > 0.4 ? 'ELEVATED' : 'NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Draggable Split-Slider: Before / After Anomaly Comparison */}
      <div className="relative z-20 max-w-xl mx-auto w-full px-4 mb-2 pointer-events-auto">
        <div className="rounded-2xl border border-white/15 bg-zinc-950/85 backdrop-blur-2xl p-3 shadow-xl glass-panel">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-emerald-400 font-bold">◄ BASELINE EVA-07</span>
            <span className="text-zinc-400 font-semibold">BEFORE / AFTER SPLIT COMPARISON</span>
            <span className="text-amber-400 font-bold">ACTIVE SIMULATION ►</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={splitPos}
            onChange={e => setSplitPos(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-400 mt-1">
            <span>Nominal: 22% Risk</span>
            <span className="text-white font-bold">Split: {splitPos}%</span>
            <span>Simulated: {(activeRisk * 100).toFixed(0)}% Risk</span>
          </div>
        </div>
      </div>

      {/* Tap-to-open Details Sheet (<40 words on main view) */}
      <div className="relative z-20 max-w-xl mx-auto w-full px-4 pb-2 pointer-events-auto">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-200">
              Explainable Decision Weights
            </span>
            <button
              onClick={() => {
                playClick()
                setDetailsOpen(!detailsOpen)
              }}
              className="text-xs text-orange-400 flex items-center gap-1 hover:underline"
            >
              <span>{detailsOpen ? 'Hide' : 'Expand Details'}</span>
              {detailsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>

          {detailsOpen && (
            <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-300 space-y-2 animate-in fade-in">
              <p className="line-clamp-2">
                Random Forest ML model weights: Terrain Slope 34%, Radiation Flux 26%, Dust Tau 18%, Crew Fatigue 12%, Equipment Age 10%.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                  <span>Hard Limit: Slope &lt; 18.0°</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900 border border-zinc-800">
                  <span>Hard Limit: Rad &lt; 160 μSv/h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
