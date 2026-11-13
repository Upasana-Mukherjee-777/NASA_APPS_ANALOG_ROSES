'use client'

import React, { useState, useEffect } from 'react'
import {
  Route,
  Compass,
  Clock,
  Heart,
  Shield,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react'
import { getMissions, planRoutes, selectRouteCandidate } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

interface RouteCandidate {
  id: string
  name: string
  color: string
  glowColor: string
  pathD: string
  timeHours: number
  comfortPct: number
  riskScore: number
  maxSlope: number
  isSafe: boolean
  violationReason?: string
  costJ: number
}

export default function RouteLabPage() {
  const { playClick, playChime, playWarning, addXP } = useMission()

  // Single large tactile Speed vs Comfort slider (0.0 = Max Comfort, 1.0 = Max Speed)
  const [sliderVal, setSliderVal] = useState<number>(0.25)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('aegis')
  const [activeLockInfo, setActiveLockInfo] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  // Cost function calculation: J = alpha * Risk + beta * (1 - Comfort) + gamma * Time
  const alpha = 0.55 - sliderVal * 0.25 // Risk weight
  const beta = 0.35 - sliderVal * 0.25  // Comfort weight
  const gamma = 0.10 + sliderVal * 0.50 // Speed weight

  const routes: RouteCandidate[] = [
    {
      id: 'aegis',
      name: 'Aegis SafePath',
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      pathD: 'M 70 380 Q 220 330 380 270 T 700 130',
      timeHours: 1.95,
      comfortPct: 88,
      riskScore: 0.22,
      maxSlope: 12.2,
      isSafe: true,
      costJ: +(alpha * 0.22 + beta * 0.12 + gamma * (1.95 / 3.0)).toFixed(3),
    },
    {
      id: 'ares',
      name: 'Ares Balanced',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      pathD: 'M 70 380 Q 260 280 440 210 T 700 130',
      timeHours: 2.30,
      comfortPct: 75,
      riskScore: 0.34,
      maxSlope: 14.8,
      isSafe: true,
      costJ: +(alpha * 0.34 + beta * 0.25 + gamma * (2.30 / 3.0)).toFixed(3),
    },
    {
      id: 'apex',
      name: 'Apex Direct',
      color: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.4)',
      pathD: 'M 70 380 L 700 130',
      timeHours: 1.45,
      comfortPct: 42,
      riskScore: 0.68,
      maxSlope: 19.5,
      isSafe: false,
      violationReason: 'Safety Violation: 19.5° slope exceeds NASA 18° rover rollover limit on Delta Scarp.',
      costJ: +(alpha * 0.68 + beta * 0.58 + gamma * (1.45 / 3.0)).toFixed(3),
    },
  ]

  // Rank routes dynamically based on cost J
  const validRoutes = routes.filter(r => r.isSafe)
  const winningRoute = validRoutes.reduce((best, cur) => (cur.costJ < best.costJ ? cur : best), validRoutes[0])

  useEffect(() => {
    if (winningRoute && winningRoute.id !== selectedRouteId) {
      setSelectedRouteId(winningRoute.id)
    }
  }, [sliderVal]) // eslint-disable-line

  const handleSelectRoute = async (route: RouteCandidate) => {
    if (!route.isSafe) {
      playWarning()
      setActiveLockInfo(route.violationReason || 'Safety constraint violated')
      return
    }
    playChime()
    setSelectedRouteId(route.id)
    setActiveLockInfo(null)
  }

  const handleConfirmRoute = async () => {
    playChime()
    setConfirmed(true)
    addXP(100)
    try {
      await selectRouteCandidate(selectedRouteId)
    } catch (e) {}
    setTimeout(() => setConfirmed(false), 3000)
  }

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden flex flex-col justify-between bg-black">
      {/* Visual Canvas: Tactical Terrain with 3 Glowing Route Lines */}
      <div className="absolute inset-0 select-none">
        <img
          src="/assets/nasa/PIA24379.jpg"
          alt="Jezero Routes Terrain"
          className="w-full h-full object-cover filter contrast-125 brightness-75"
        />
        <div className="absolute inset-0 mars-grid-pattern opacity-35 pointer-events-none" />

        {/* 3 Coloured Glowing Route Paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 800 500" preserveAspectRatio="none">
          <defs>
            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {routes.map(r => {
            const isWinner = r.id === selectedRouteId
            return (
              <path
                key={r.id}
                d={r.pathD}
                fill="none"
                stroke={r.color}
                strokeWidth={isWinner ? 7 : 3.5}
                strokeDasharray={r.isSafe ? (isWinner ? 'none' : '8 4') : '4 4'}
                filter="url(#routeGlow)"
                className="transition-all duration-300"
                opacity={isWinner ? 1 : 0.45}
              />
            )
          })}

          {/* Start & Destination Waypoints */}
          <circle cx="70" cy="380" r="10" fill="#3b82f6" stroke="#fff" strokeWidth="2.5" />
          <circle cx="700" cy="130" r="10" fill="#10b981" stroke="#fff" strokeWidth="2.5" />
        </svg>

        {/* Start / Dest Labels */}
        <div className="absolute left-6 bottom-32 px-3 py-1 rounded-xl bg-black/80 border border-blue-500/50 text-blue-300 font-mono text-[10px] font-bold">
          START: Octavia Butler Base
        </div>
        <div className="absolute right-6 top-16 px-3 py-1 rounded-xl bg-black/80 border border-emerald-500/50 text-emerald-300 font-mono text-[10px] font-bold">
          TARGET: Delta Front Mudstones
        </div>
      </div>

      {/* Top Header: Speed vs Comfort Tactile Slider */}
      <div className="relative z-20 p-4 max-w-2xl mx-auto w-full pointer-events-auto">
        <div className="rounded-3xl border border-white/15 bg-zinc-950/85 backdrop-blur-2xl p-4 shadow-2xl glass-panel">
          <div className="flex items-center justify-between mb-2 font-mono">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Heart className="w-3.5 h-3.5" />
              <span>MAX COMFORT</span>
            </div>
            <div className="flex items-center gap-2">
              <SimulatedBadge type="REAL" />
              <span className="text-[10px] text-zinc-400">J = αR + βC + γT</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>MAX SPEED</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Single Large Slider */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sliderVal}
            onChange={e => {
              playClick()
              setSliderVal(Number(e.target.value))
            }}
            className="w-full accent-orange-500 cursor-pointer h-3 bg-zinc-800 rounded-lg shadow-inner"
          />

          <div className="mt-2 text-center text-[11px] font-mono text-zinc-300">
            Current Optimization: <strong className="text-white">{winningRoute.name}</strong> is ranked #1 (Cost J = {winningRoute.costJ})
          </div>
        </div>
      </div>

      {/* Violation Alert Sheet */}
      {activeLockInfo && (
        <div className="relative z-30 mx-auto w-[92%] max-w-md rounded-2xl border border-red-500/60 bg-red-950/90 backdrop-blur-xl p-3 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-red-300 font-mono text-xs font-bold mb-1">
            <Lock className="w-4 h-4 text-red-400" />
            <span>DISALLOWED TRAVERSAL PATH</span>
          </div>
          <p className="text-xs text-zinc-200">{activeLockInfo}</p>
        </div>
      )}

      {/* Bottom Section: 3 Swipeable Route Cards */}
      <div className="relative z-20 p-4 max-w-4xl mx-auto w-full pointer-events-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {routes.map(route => {
            const isWinner = route.id === selectedRouteId
            return (
              <div
                key={route.id}
                onClick={() => handleSelectRoute(route)}
                className={`relative rounded-2xl border p-3.5 cursor-pointer transition-all touch-react backdrop-blur-xl ${
                  isWinner
                    ? 'border-orange-500 bg-zinc-900/90 shadow-xl shadow-orange-950/40 scale-102 ring-1 ring-orange-500/50'
                    : 'border-white/10 bg-zinc-950/75 hover:border-zinc-700'
                }`}
              >
                {/* Header: Name and Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                    <h4 className="text-xs font-bold text-white font-mono">{route.name}</h4>
                  </div>
                  {route.isSafe ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      NOMINAL
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-950 text-red-400 border border-red-800 flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* 3 Icons: Time, Comfort, Risk */}
                <div className="grid grid-cols-3 gap-1.5 my-2 text-center font-mono text-[10px]">
                  <div className="p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <Clock className="w-3 h-3 mx-auto text-zinc-400 mb-0.5" />
                    <span className="text-white font-bold">{route.timeHours}h</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <Heart className="w-3 h-3 mx-auto text-emerald-400 mb-0.5" />
                    <span className="text-white font-bold">{route.comfortPct}%</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <Shield className="w-3 h-3 mx-auto text-amber-400 mb-0.5" />
                    <span className="text-white font-bold">{route.riskScore}</span>
                  </div>
                </div>

                {/* Slope Info */}
                <div className="text-[10px] font-mono text-zinc-400 flex justify-between pt-1 border-t border-zinc-800/80">
                  <span>Max Slope: {route.maxSlope}°</span>
                  <span className="text-orange-400 font-bold">Cost J: {route.costJ}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirm Route Button */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleConfirmRoute}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-mono text-xs font-bold shadow-xl hover:from-orange-500 hover:to-amber-500 transition glow-orange"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{confirmed ? 'ROUTE CONFIRMED FOR EVA-07!' : 'ENGAGE OPTIMAL ROUTE'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
