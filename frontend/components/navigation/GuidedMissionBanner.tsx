'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useMission, GUIDED_STEPS } from '@/context/MissionContext'

export default function GuidedMissionBanner() {
  const {
    guidedMode,
    currentStep,
    nextGuidedStep,
    prevGuidedStep,
    jumpToStep,
    playClick,
    playChime,
  } = useMission()
  const router = useRouter()

  if (!guidedMode) return null

  const step = GUIDED_STEPS.find(s => s.id === currentStep) || GUIDED_STEPS[0]

  const handleNext = () => {
    playChime()
    const nextIdx = Math.min(currentStep + 1, GUIDED_STEPS.length)
    const target = GUIDED_STEPS.find(s => s.id === nextIdx)
    nextGuidedStep()
    if (target) {
      router.push(target.path)
    }
  }

  const handlePrev = () => {
    playClick()
    const prevIdx = Math.max(currentStep - 1, 1)
    const target = GUIDED_STEPS.find(s => s.id === prevIdx)
    prevGuidedStep()
    if (target) {
      router.push(target.path)
    }
  }

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-3xl pointer-events-auto animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-2xl border border-orange-500/30 bg-zinc-950/85 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-2 py-0.5 rounded-md bg-orange-600/30 text-orange-400 border border-orange-500/40 text-[10px] font-mono font-bold whitespace-nowrap">
            STEP {step.id}/{GUIDED_STEPS.length}
          </span>
          <div className="truncate">
            <span className="text-xs font-bold text-white tracking-tight mr-2">{step.title}:</span>
            <span className="text-xs text-zinc-300 font-sans hidden sm:inline">{step.action} — </span>
            <span className="text-[11px] text-zinc-400 italic hidden md:inline">{step.hint}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="p-1 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
            title="Previous Step"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-mono text-[10px] font-bold shadow-sm transition"
            title="Next Step"
          >
            <span>{currentStep === GUIDED_STEPS.length ? 'COMPLETE' : 'NEXT'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
