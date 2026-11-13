'use client'

import React, { useState } from 'react'
import { Sparkles, X, MessageSquare, Bot, AlertTriangle } from 'lucide-react'
import { useMission } from '@/context/MissionContext'

export default function BuddyCompanion() {
  const {
    buddyMessage,
    buddyDismissed,
    setBuddyDismissed,
    telemetry,
    playClick,
    guidedMode,
    currentStep,
  } = useMission()

  const [expanded, setExpanded] = useState(true)

  if (buddyDismissed) {
    return (
      <button
        onClick={() => {
          playClick()
          setBuddyDismissed(false)
          setExpanded(true)
        }}
        className="fixed bottom-20 right-4 z-40 p-2.5 rounded-full border border-orange-500/40 bg-zinc-950/80 text-orange-400 shadow-xl backdrop-blur-md hover:scale-110 transition touch-react"
        title="Summon MARS-GUARD Buddy"
      >
        <Bot className="w-5 h-5 animate-pulse" />
      </button>
    )
  }

  const isAlert = telemetry.isAnomaly || telemetry.riskScore > 0.5

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-xs pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div
        className={`relative rounded-2xl border p-3.5 backdrop-blur-xl shadow-2xl transition-all ${
          isAlert
            ? 'border-red-500/60 bg-red-950/80 shadow-red-900/30'
            : 'border-white/10 bg-zinc-950/85 shadow-black/80'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-white font-mono flex items-center gap-1">
                <span>BUDDY AI</span>
                {guidedMode && (
                  <span className="text-[9px] px-1 rounded bg-orange-950 text-orange-400 border border-orange-800">
                    STEP {currentStep}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              playClick()
              setBuddyDismissed(true)
            }}
            className="p-1 text-zinc-400 hover:text-white rounded transition"
            title="Dismiss Buddy"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-zinc-200 leading-snug font-sans">
          {buddyMessage}
        </p>

        {/* Micro status or hint */}
        {isAlert && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-red-300 font-bold">
            <AlertTriangle className="w-3 h-3 text-red-400 animate-bounce" />
            <span>Hazard Active: Check Simulation / Risk Radar</span>
          </div>
        )}
      </div>
    </div>
  )
}
