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
  Zap,
  BarChart2,
  PieChart
} from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { predictRisk, getMLMetrics } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

export default function RiskRadarPage() {
  const { playClick, playChime } = useMission()

  // Draggable Split Slider Position (0 to 100%)
  const [splitPos, setSplitPos] = useState(50)
  const [activeView, setActiveView] = useState<'RADAR' | 'FEATURE_IMPORTANCE'>('RADAR')

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

  // Radar Polygon Data
  const radarChartData = [
    { subject: 'Slope Angle', A: Math.round((slopeDeg / 18.0) * 100), fullMark: 100 },
    { subject: 'Radiation Flux', A: Math.round((radiationUsv / 160.0) * 100), fullMark: 100 },
    { subject: 'Dust Optical Depth', A: Math.round((dustTau / 2.0) * 100), fullMark: 100 },
    { subject: 'Crew Fatigue', A: Math.round((fatigueScore / 80.0) * 100), fullMark: 100 },
    { subject: 'Equipment Age', A: 28, fullMark: 100 },
    { subject: 'Atmospheric Pressure', A: 18, fullMark: 100 },
  ]

  // Machine Learning Random Forest Feature Weights
  const featureWeightsData = [
    { name: 'Terrain Slope', weight: 34, fill: '#f97316' },
    { name: 'Radiation Flux', weight: 26, fill: '#ef4444' },
    { name: 'Dust Tau', weight: 18, fill: '#eab308' },
    { name: 'Crew Fatigue', weight: 12, fill: '#ec4899' },
    { name: 'Equipment Age', weight: 10, fill: '#3b82f6' },
  ]

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-5xl mx-auto flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type="REAL" />
            <span className="text-xs font-mono font-bold text-zinc-400">
              AI RISK INTELLIGENCE & RADAR CHARTS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Multi-Factor Risk Radar & ML Feature Weights
          </h1>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md font-mono text-xs font-bold">
          <button
            onClick={() => { playClick(); setActiveView('RADAR'); }}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeView === 'RADAR' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            RADAR CHART
          </button>
          <button
            onClick={() => { playClick(); setActiveView('FEATURE_IMPORTANCE'); }}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeView === 'FEATURE_IMPORTANCE' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            ML FEATURE WEIGHTS
          </button>
        </div>
      </div>

      {/* Main Graph View: Radar Chart vs Feature Weights BarChart */}
      <div className="rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-5 shadow-2xl glass-panel">
        {activeView === 'RADAR' ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Interactive Radar Chart */}
            <div className="h-72 w-full md:w-3/5">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#3f3f46" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" stroke="#a1a1aa" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#71717a" fontSize={10} />
                  <Radar
                    name="Risk Envelope (%)"
                    dataKey="A"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.45}
                    strokeWidth={2.5}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Central Risk Gauge readout */}
            <div className="w-full md:w-2/5 flex flex-col items-center justify-center p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 text-center font-mono">
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest mb-1">
                {splitPos > 50 ? 'CURRENT RISK SCORE' : 'BASELINE RISK SCORE'}
              </span>
              <span className={`text-4xl font-black ${riskColor} mb-1`}>
                {(displayRisk * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-zinc-300 font-bold uppercase mb-3">
                {displayRisk > 0.65 ? 'CRITICAL RISK ZONE' : displayRisk > 0.4 ? 'CAUTION ZONE' : 'NOMINAL SAFE ZONE'}
              </span>

              {/* Sub-metrics */}
              <div className="grid grid-cols-2 gap-2 w-full text-[10px] text-left pt-2 border-t border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Slope Risk:</span>
                  <span className="text-white font-bold">{slopeDeg}° ({Math.round((slopeDeg / 18) * 100)}%)</span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Rad Risk:</span>
                  <span className="text-white font-bold">{radiationUsv} μSv ({Math.round((radiationUsv / 160) * 100)}%)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-72 w-full">
            <div className="flex items-center justify-between mb-2 font-mono text-xs text-zinc-300">
              <span>RANDOM FOREST FEATURE IMPORTANCE WEIGHTS (%)</span>
              <span className="text-emerald-400">R² = 0.948</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureWeightsData} layout="vertical">
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                <XAxis type="number" domain={[0, 40]} stroke="#71717a" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} width={110} />
                <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                <Bar dataKey="weight" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Draggable Split-Slider: Before / After Anomaly Comparison */}
      <div className="rounded-2xl border border-white/15 bg-zinc-950/85 backdrop-blur-2xl p-3 shadow-xl glass-panel">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-emerald-400 font-bold">◄ NOMINAL BASELINE</span>
          <span className="text-zinc-400 font-semibold">BEFORE / AFTER COMPARISON SLIDER</span>
          <span className="text-amber-400 font-bold">ACTIVE ANOMALY ►</span>
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
          <span>Baseline: 22% Risk</span>
          <span className="text-white font-bold">Split Position: {splitPos}%</span>
          <span>Simulated: {(activeRisk * 100).toFixed(0)}% Risk</span>
        </div>
      </div>
    </div>
  )
}
