'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Compass,
  Play,
  Route,
  FlaskConical,
  ShieldAlert,
  Box,
  Database,
  History,
  Activity,
  FileText,
  X,
  Orbit,
  ChevronUp
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'

interface DockItem {
  id: string
  name: string
  shortLabel: string
  href: string
  icon: React.ElementType
  color: string
  bgHover: string
}

const DOCK_MODULES: DockItem[] = [
  { id: 'globe', name: 'Mars Globe', shortLabel: 'Globe Hub', href: '/', icon: Orbit, color: 'text-orange-400', bgHover: 'hover:border-orange-500/60 hover:bg-orange-950/40' },
  { id: 'sim', name: 'Mission Simulator', shortLabel: 'Simulator', href: '/simulation', icon: Play, color: 'text-amber-400', bgHover: 'hover:border-amber-500/60 hover:bg-amber-950/40' },
  { id: 'route', name: 'Route Lab', shortLabel: 'Route Lab', href: '/planner', icon: Route, color: 'text-emerald-400', bgHover: 'hover:border-emerald-500/60 hover:bg-emerald-950/40' },
  { id: 'exp', name: 'Experiment Lab', shortLabel: 'Lab Bench', href: '/experiments', icon: FlaskConical, color: 'text-purple-400', bgHover: 'hover:border-purple-500/60 hover:bg-purple-950/40' },
  { id: 'risk', name: 'Risk Radar', shortLabel: 'Risk Radar', href: '/risk', icon: ShieldAlert, color: 'text-rose-400', bgHover: 'hover:border-rose-500/60 hover:bg-rose-950/40' },
  { id: 'twin', name: '3D Digital Twin', shortLabel: 'Digital Twin', href: '/digital-twin', icon: Box, color: 'text-cyan-400', bgHover: 'hover:border-cyan-500/60 hover:bg-cyan-950/40' },
  { id: 'data', name: 'Data Studio', shortLabel: '8 Layers', href: '/datasets', icon: Database, color: 'text-blue-400', bgHover: 'hover:border-blue-500/60 hover:bg-blue-950/40' },
  { id: 'safety', name: 'Safety Archive', shortLabel: 'Safety Hist.', href: '/history', icon: History, color: 'text-yellow-400', bgHover: 'hover:border-yellow-500/60 hover:bg-yellow-950/40' },
  { id: 'live', name: 'Live Telemetry', shortLabel: 'Telemetry', href: '/overview', icon: Activity, color: 'text-teal-400', bgHover: 'hover:border-teal-500/60 hover:bg-teal-950/40' },
  { id: 'report', name: 'Mission Report', shortLabel: 'Report Log', href: '/reports', icon: FileText, color: 'text-indigo-400', bgHover: 'hover:border-indigo-500/60 hover:bg-indigo-950/40' },
]

export default function MissionDock() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { playClick, playChime } = useMission()

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      {/* Expanded Radial / Orbital Grid */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
            onClick={() => { playClick(); setIsOpen(false); }}
          />

          <div className="relative z-40 mb-3 w-[92vw] max-w-2xl rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-5 shadow-2xl glass-panel animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">
                  MISSION DOCK — SELECT DESTINATION WORLD
                </span>
              </div>
              <button
                onClick={() => { playClick(); setIsOpen(false); }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {DOCK_MODULES.map(mod => {
                const Icon = mod.icon
                const isActive = pathname === mod.href
                return (
                  <Link
                    key={mod.id}
                    href={mod.href}
                    onClick={() => {
                      playChime()
                      setIsOpen(false)
                    }}
                    className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center touch-react ${
                      isActive
                        ? 'border-orange-500/80 bg-orange-950/50 shadow-lg shadow-orange-900/30'
                        : `border-zinc-800/80 bg-zinc-900/60 ${mod.bgHover}`
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 ${
                        isActive ? 'bg-orange-500 text-white' : `bg-zinc-800/80 ${mod.color}`
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight line-clamp-1">
                      {mod.shortLabel}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 tracking-tighter">
                      {mod.id === 'globe' ? '3D MARS' : 'WORLD'}
                    </span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Persistent Floating Orb Trigger */}
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => {
            playClick()
            setIsOpen(!isOpen)
          }}
          className={`group flex items-center gap-2.5 px-5 py-2.5 rounded-full border shadow-2xl transition-all duration-300 touch-react ${
            isOpen
              ? 'border-orange-500 bg-orange-600 text-white shadow-orange-600/40'
              : 'border-white/15 bg-zinc-950/85 text-zinc-200 hover:border-orange-500/50 hover:bg-zinc-900 shadow-black/80'
          }`}
          title="Toggle Orbital Mission Dock"
        >
          <div className="relative flex items-center justify-center">
            <Orbit className={`w-5 h-5 transition-transform duration-500 ${isOpen ? 'rotate-180' : 'group-hover:rotate-45 text-orange-400'}`} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
          <span className="text-xs font-mono font-bold tracking-wider uppercase">
            {isOpen ? 'Close Dock' : 'Mission Dock'}
          </span>
          <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  )
}

