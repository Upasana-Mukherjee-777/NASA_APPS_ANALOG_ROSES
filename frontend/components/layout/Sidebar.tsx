'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Compass,
  Route,
  UserCheck,
  Brain,
  History,
  FlaskConical,
  Activity,
  Box,
  Database,
  FileSpreadsheet,
  HelpCircle,
  Play
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Landing Overview', href: '/', icon: HelpCircle, badge: 'Home' },
  { label: 'Mission Control Centre', href: '/overview', icon: LayoutDashboard, badge: 'MCC Live' },
  { label: 'Martian Explorer', href: '/explorer', icon: Compass, badge: 'Interactive' },
  { label: 'Mars Mission Simulator', href: '/simulation', icon: Play, badge: 'Live Sim' },
  { label: 'Route Comparison Lab', href: '/planner', icon: Route, badge: 'A* Multi' },
  { label: 'AI Risk Intelligence', href: '/risk', icon: Brain, badge: 'Dynamic ML' },
  { label: 'Martian Experiment Lab', href: '/experiments', icon: FlaskConical, badge: 'Class A-D' },
  { label: 'Historical Safety RAG', href: '/history', icon: History, badge: 'RAG Archive' },
  { label: '3D Digital Twin', href: '/digital-twin', icon: Box, badge: 'Three.js' },
  { label: 'Multimodal Data Studio', href: '/datasets', icon: Database, badge: '8 Layers' },
  { label: 'Astronaut Field Console', href: '/field', icon: UserCheck, badge: 'Ingestion' },
  { label: 'Mission Reports', href: '/reports', icon: FileSpreadsheet, badge: 'Export' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-950/70 p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
          Planetary Modules
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/10 text-orange-400 border border-orange-700/40'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-orange-950 text-orange-300 border border-orange-800/60'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* System Status Box */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-xs font-mono">
        <div className="flex items-center justify-between text-zinc-400 mb-1.5">
          <span>AI ENGINES</span>
          <span className="text-emerald-400">ONLINE</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2 overflow-hidden">
          <div className="bg-emerald-500 h-1.5 rounded-full w-[98%]"></div>
        </div>
        <p className="text-[10px] text-zinc-400 leading-tight">
          Jezero Corridor datum: MOLA -2580m. Multi-layer planetary telemetry active.
        </p>
      </div>
    </aside>
  )
}
