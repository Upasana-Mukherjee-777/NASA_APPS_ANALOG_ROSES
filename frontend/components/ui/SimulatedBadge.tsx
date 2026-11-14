'use client'

import React from 'react'
import { Sparkles, CheckCircle2 } from 'lucide-react'

interface Props {
  type?: 'SIMULATED' | 'REAL' | 'DERIVED'
  className?: string
}

export default function SimulatedBadge({ type = 'SIMULATED', className = '' }: Props) {
  if (type === 'REAL') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 shadow-sm ${className}`}
      >
        <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
        REAL OBSERVATION
      </span>
    )
  }

  if (type === 'DERIVED') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-purple-500/40 bg-purple-950/60 text-purple-300 shadow-sm ${className}`}
      >
        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
        SCIENCE DERIVED
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-amber-500/50 bg-amber-950/70 text-amber-300 shadow-sm animate-pulse ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      GAME SIMULATION
    </span>
  )
}
