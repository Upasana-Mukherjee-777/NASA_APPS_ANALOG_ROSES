'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShieldAlert,
  Compass,
  MapPin,
  Flame,
  Radio,
  Activity,
  Layers,
  FlaskConical,
  BookOpen,
  Cpu,
  FileText,
  User,
  Clock,
  ChevronDown
} from 'lucide-react'
import { getTelemetryStream } from '@/services/api'

export const ROLES = [
  { id: 'COMMANDER', name: 'Commander Sarah Chen', role: 'MISSION COMMANDER', badge: 'bg-red-950 text-red-300 border-red-700' },
  { id: 'ASTRONAUT', name: 'Dr. Mark Thorne', role: 'EVA FIELD SPECIALIST', badge: 'bg-amber-950 text-amber-300 border-amber-700' },
  { id: 'RESEARCHER', name: 'Dr. Elena Rostova', role: 'PLANETARY SCIENTIST', badge: 'bg-cyan-950 text-cyan-300 border-cyan-700' },
  { id: 'ADMIN', name: 'Mission Operations', role: 'SYSTEM ADMIN', badge: 'bg-purple-950 text-purple-300 border-purple-700' }
]

export default function Navbar() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [telemetry, setTelemetry] = useState<any>({
    temperature_c: -42.5,
    radiation_usv_hr: 26.5,
    pressure_pa: 718.0,
    dust_tau: 0.48
  })

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const stream = await getTelemetryStream()
        setTelemetry(stream)
      } catch (err) {
        // use baseline fallback
      }
    }
    fetchStream()
    const interval = setInterval(fetchStream, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-6 backdrop-blur-md">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-700 shadow-md">
            <ShieldAlert className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wider text-zinc-100">MARS-GUARD</span>
              <span className="rounded bg-orange-950/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-orange-400 border border-orange-800/60">
                NASA SPACE APPS
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Explore intelligently. Return safely.</p>
          </div>
        </Link>

        {/* Active Mission Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 md:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs text-zinc-300">
            ACTIVE SORTIE: <strong className="text-orange-400">EVA-07 Jezero Crater</strong>
          </span>
        </div>
      </div>

      {/* Live Martian Telemetry Ticker */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-zinc-400">SURFACE:</span>
          <span className="font-semibold text-zinc-200">{telemetry.temperature_c}°C</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
          <Radio className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-zinc-400">RAD FLUX:</span>
          <span className="font-semibold text-zinc-200">{telemetry.radiation_usv_hr} μSv/h</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
          <Activity className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-zinc-400">PRESSURE:</span>
          <span className="font-semibold text-zinc-200">{telemetry.pressure_pa} Pa</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1">
          <Layers className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-zinc-400">DUST TAU:</span>
          <span className="font-semibold text-zinc-200">{telemetry.dust_tau}</span>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="relative">
        <button
          onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 hover:border-zinc-700 transition"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-zinc-200">{selectedRole.name}</p>
            <p className="text-[10px] font-mono text-zinc-400">{selectedRole.role}</p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>

        {roleDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl z-50">
            <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Select Operating Role
            </div>
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRole(r)
                  setRoleDropdownOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                  selectedRole.id === r.id ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">{r.role}</div>
                </div>
                {selectedRole.id === r.id && (
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

