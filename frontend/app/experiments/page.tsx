'use client'

import React, { useState, useEffect } from 'react'
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Check,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react'
import { getMissions, getExperiments, createExperiment, approveExperiment, classifyExperiment } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

interface ExpTemplate {
  id: string
  name: string
  category: string
  image: string
  durationMin: number
  powerWatts: number
  classLevel: 'CLASS_A' | 'CLASS_B' | 'CLASS_C' | 'CLASS_D'
  levelLabel: string
  reason: string
  slope: number
  drilling: boolean
}

const TEMPLATES: ExpTemplate[] = [
  {
    id: 'exp-1',
    name: 'Delta Core Drilling',
    category: 'Geological Sampling',
    image: '/assets/nasa/PIA26575.jpg',
    durationMin: 60,
    powerWatts: 420,
    classLevel: 'CLASS_C',
    levelLabel: 'HUMAN APPROVAL REQUIRED',
    reason: 'Drilling generates high mechanical vibration and potential bit jam on 12° slope.',
    slope: 12.0,
    drilling: true,
  },
  {
    id: 'exp-2',
    name: 'Regolith Cohesion Probe',
    category: 'Soil Mechanics',
    image: '/assets/nasa/PIA24925.jpg',
    durationMin: 35,
    powerWatts: 180,
    classLevel: 'CLASS_A',
    levelLabel: 'AUTONOMOUS EXECUTION',
    reason: 'Low energy robotic arm contact probe with zero crew safety hazard.',
    slope: 5.0,
    drilling: false,
  },
  {
    id: 'exp-3',
    name: 'RIMFAX Ice Sounding',
    category: 'Subsurface Radar',
    image: '/assets/nasa/PIA25220.jpg',
    durationMin: 75,
    powerWatts: 260,
    classLevel: 'CLASS_B',
    levelLabel: 'AUTONOMOUS WITH ADVISORY',
    reason: 'Non-destructive radar sweep. Monitors rover battery reserve during sounding.',
    slope: 7.5,
    drilling: false,
  },
  {
    id: 'exp-4',
    name: 'Steep Escarpment Trench',
    category: 'Fault Scarp Sampling',
    image: '/assets/nasa/PIA24814.jpg',
    durationMin: 90,
    powerWatts: 550,
    classLevel: 'CLASS_D',
    levelLabel: 'DISALLOWED / HAZARDOUS',
    reason: 'Slope exceeds 19° and rockfall risk violates EVA safety protocols.',
    slope: 21.0,
    drilling: true,
  },
]

export default function ExperimentLabPage() {
  const { playClick, playChime, playWarning, addXP } = useMission()
  const [selectedTemplate, setSelectedTemplate] = useState<ExpTemplate>(TEMPLATES[0])
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'REVIEW'>('PENDING')
  const [isExecuting, setIsExecuting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleSelectTemplate = (tmpl: ExpTemplate) => {
    playClick()
    setSelectedTemplate(tmpl)
    setApprovalStatus('PENDING')
    setIsExecuting(false)
    setProgress(0)
  }

  const handleApprove = async () => {
    if (selectedTemplate.classLevel === 'CLASS_D') {
      playWarning()
      return
    }
    playChime()
    setApprovalStatus('APPROVED')
    addXP(75)
    try {
      await approveExperiment(selectedTemplate.id, 'Flight Director EVA-07', 'Authorized by Mission Control')
    } catch (e) {}
  }

  const handleReject = () => {
    playWarning()
    setApprovalStatus('REJECTED')
  }

  const handleRequestReview = () => {
    playClick()
    setApprovalStatus('REVIEW')
  }

  const startExecution = () => {
    playChime()
    setIsExecuting(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setIsExecuting(false)
          playChime()
          addXP(50)
          return 100
        }
        return p + 5
      })
    }, 150)
  }

  // Dial Color Logic
  const dialColors = {
    CLASS_A: 'border-emerald-500 text-emerald-400 bg-emerald-950/40 shadow-emerald-500/20',
    CLASS_B: 'border-cyan-500 text-cyan-400 bg-cyan-950/40 shadow-cyan-500/20',
    CLASS_C: 'border-amber-500 text-amber-400 bg-amber-950/40 shadow-amber-500/20',
    CLASS_D: 'border-red-500 text-red-400 bg-red-950/40 shadow-red-500/20',
  }

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden flex flex-col justify-between bg-black">
      {/* Background Lab Scene with NASA Imagery Backdrop */}
      <div className="absolute inset-0 select-none">
        <img
          src={selectedTemplate.image}
          alt={selectedTemplate.name}
          className="w-full h-full object-cover opacity-60 filter contrast-125 brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
      </div>

      {/* Top Header: Lab Bench Mode */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <SimulatedBadge type="REAL" />
          <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">
            MARTIAN EXPERIMENT LAB BENCH
          </span>
        </div>
        <div className="px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          STATUS: <strong className="text-orange-400">{approvalStatus}</strong>
        </div>
      </div>

      {/* Center: Big Traffic-Light AI Intervention Dial */}
      <div className="relative z-10 max-w-lg mx-auto w-full px-4 text-center pointer-events-auto">
        <div className="rounded-3xl border border-white/15 bg-zinc-950/85 backdrop-blur-2xl p-6 shadow-2xl glass-panel">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-2">
            AI SAFETY INTERVENTION CLASSIFIER
          </span>

          {/* Large Glowing Dial */}
          <div
            className={`w-36 h-36 mx-auto rounded-full border-4 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 mb-3 ${
              dialColors[selectedTemplate.classLevel]
            }`}
          >
            <span className="text-3xl font-black font-mono">
              {selectedTemplate.classLevel.replace('CLASS_', '')}
            </span>
            <span className="text-[9px] font-bold tracking-tight uppercase px-2 text-center mt-0.5">
              {selectedTemplate.levelLabel}
            </span>
          </div>

          {/* One-line Reason (<40 words) */}
          <p className="text-xs text-zinc-300 font-sans leading-snug px-4">
            {selectedTemplate.reason}
          </p>

          {/* Execution Progress Bar */}
          {isExecuting && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                <span>EXECUTION IN PROGRESS</span>
                <span className="text-orange-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Big Action Buttons */}
          <div className="flex items-center justify-center gap-2.5 mt-5">
            {approvalStatus === 'APPROVED' ? (
              <button
                onClick={startExecution}
                disabled={isExecuting || progress === 100}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono text-xs font-bold shadow-xl transition touch-react"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{progress === 100 ? 'EXPERIMENT COMPLETED' : 'EXECUTE ON SURFACE'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleApprove}
                  disabled={selectedTemplate.classLevel === 'CLASS_D'}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-30 text-white font-mono text-xs font-bold shadow-lg transition touch-react"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>APPROVE</span>
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-red-500/50 bg-red-950/40 hover:bg-red-950/80 text-red-300 font-mono text-xs font-bold transition touch-react"
                >
                  <XCircle className="w-4 h-4" />
                  <span>REJECT</span>
                </button>
                <button
                  onClick={handleRequestReview}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white font-mono text-xs transition touch-react"
                >
                  REQUEST REVIEW
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Illustrated Template Tiles */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto w-full pointer-events-auto">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
          {TEMPLATES.map(tmpl => {
            const isSelected = tmpl.id === selectedTemplate.id
            return (
              <div
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className={`relative flex-shrink-0 w-44 rounded-2xl border p-2.5 cursor-pointer transition-all touch-react backdrop-blur-xl ${
                  isSelected
                    ? 'border-orange-500 bg-zinc-900/90 shadow-xl ring-1 ring-orange-500/50 scale-105'
                    : 'border-white/10 bg-zinc-950/75 hover:border-zinc-700'
                }`}
              >
                <div className="relative h-20 rounded-xl overflow-hidden mb-2">
                  <img src={tmpl.image} alt={tmpl.name} className="w-full h-full object-cover" />
                  <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-white">
                    {tmpl.durationMin} MIN
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white tracking-tight line-clamp-1">{tmpl.name}</h4>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
                  <span>{tmpl.category}</span>
                  <span className="text-orange-400 font-bold">{tmpl.powerWatts}W</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
