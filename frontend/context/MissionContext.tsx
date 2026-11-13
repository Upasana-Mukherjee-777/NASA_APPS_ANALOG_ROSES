'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { tickTelemetry, getTelemetryState, getMissions } from '@/services/api'
import { soundEngine } from '@/lib/sound'

export interface TelemetryState {
  sol: number
  clock: string
  progressPct: number
  distanceKm: number
  tempC: number
  radiationUsv: number
  pressurePa: number
  dustTau: number
  slopeDeg: number
  batteryPct: number
  o2Pct: number
  workloadWatts: number
  heartRateBpm: number
  riskScore: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  isAnomaly: boolean
  anomalyType: string | null
  anomalyAlerts: string[]
}

export interface GuidedStep {
  id: number
  title: string
  path: string
  action: string
  hint: string
}

export const GUIDED_STEPS: GuidedStep[] = [
  { id: 1, title: 'Mars Global Recon', path: '/', action: 'Select Jezero Crater Hotspot', hint: 'Tap the glowing beacon on Jezero Crater to initiate EVA-07 entry.' },
  { id: 2, title: 'Multi-Layer GIS', path: '/explorer', action: 'Inspect 8 NASA Layers', hint: 'Toggle the layer strip below to preview HiRISE, THEMIS & CRISM datasets.' },
  { id: 3, title: 'Route Lab', path: '/planner', action: 'Tune Speed vs Comfort', hint: 'Adjust the slider to see Aegis, Apex and Ares candidate routes re-rank live.' },
  { id: 4, title: 'Mission Simulator', path: '/simulation', action: 'Trigger a Contingency', hint: 'Select a card from the Disaster Deck to test real-time AI mitigation.' },
  { id: 5, title: 'Safety Archive', path: '/history', action: 'Examine Past Lessons', hint: 'Check the transferability of Apollo and ISS incident reports to Mars.' },
  { id: 6, title: 'Experiment Lab', path: '/experiments', action: 'Classify & Approve', hint: 'Review AI safety intervention Class A-D and authorize sample retrieval.' },
  { id: 7, title: '3D Digital Twin', path: '/digital-twin', action: 'Inspect 3D Terrain', hint: 'Orbit Jezero delta topography with live rover position sync.' },
  { id: 8, title: 'Mission Brief & Log', path: '/reports', action: 'Review EVA-07 Report', hint: 'Verify safety compliance scorecard and export mission documentation.' },
]

interface MissionContextType {
  telemetry: TelemetryState
  soundEnabled: boolean
  toggleSound: () => void
  playClick: () => void
  playChime: () => void
  playWarning: () => void
  guidedMode: boolean
  setGuidedMode: (v: boolean) => void
  currentStep: number
  nextGuidedStep: () => void
  prevGuidedStep: () => void
  jumpToStep: (step: number) => void
  showDataLimits: boolean
  setShowDataLimits: (v: boolean) => void
  buddyDismissed: boolean
  setBuddyDismissed: (v: boolean) => void
  buddyMessage: string
  setBuddyMessage: (msg: string) => void
  missionXP: number
  addXP: (amount: number) => void
  badges: string[]
  triggerAnomalyEvent: (name: string, severity?: string) => void
}

const defaultTelemetry: TelemetryState = {
  sol: 1084,
  clock: '14:22:08 MTC',
  progressPct: 42.5,
  distanceKm: 1.63,
  tempC: -43.2,
  radiationUsv: 26.8,
  pressurePa: 717.8,
  dustTau: 0.49,
  slopeDeg: 7.2,
  batteryPct: 88.4,
  o2Pct: 92.1,
  workloadWatts: 310,
  heartRateBpm: 82,
  riskScore: 0.28,
  riskLevel: 'LOW',
  isAnomaly: false,
  anomalyType: null,
  anomalyAlerts: [],
}

const MissionContext = createContext<MissionContextType | undefined>(undefined)

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [telemetry, setTelemetry] = useState<TelemetryState>(defaultTelemetry)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [guidedMode, setGuidedMode] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [showDataLimits, setShowDataLimits] = useState(false)
  const [buddyDismissed, setBuddyDismissed] = useState(false)
  const [buddyMessage, setBuddyMessage] = useState('Greetings Explorer! Welcome to MARS-GUARD. Ready for EVA-07?')
  const [missionXP, setMissionXP] = useState(350)
  const [badges, setBadges] = useState<string[]>(['First Contact', 'Jezero Scout'])

  const tickTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSoundEnabled(soundEngine.isEnabled())
  }, [])

  const toggleSound = () => {
    const next = soundEngine.toggle()
    setSoundEnabled(next)
  }

  const playClick = () => soundEngine.playClick()
  const playChime = () => soundEngine.playChime()
  const playWarning = () => soundEngine.playWarning()

  const addXP = (amount: number) => {
    setMissionXP(prev => prev + amount)
    playChime()
  }

  const nextGuidedStep = () => {
    setCurrentStep(s => {
      const next = Math.min(s + 1, GUIDED_STEPS.length)
      addXP(50)
      return next
    })
  }

  const prevGuidedStep = () => {
    setCurrentStep(s => Math.max(s - 1, 1))
  }

  const jumpToStep = (step: number) => {
    setCurrentStep(Math.max(1, Math.min(step, GUIDED_STEPS.length)))
  }

  const triggerAnomalyEvent = (name: string, severity: string = 'HIGH') => {
    playWarning()
    setTelemetry(prev => ({
      ...prev,
      isAnomaly: true,
      anomalyType: name,
      riskScore: Math.min(0.88, prev.riskScore + 0.35),
      riskLevel: 'HIGH',
      anomalyAlerts: [`CRITICAL ALERT: ${name.replace('_', ' ')} detected!`],
    }))
    setBuddyMessage(`Alert! ${name.replace('_', ' ')} detected in Jezero corridor! Safety protocols active.`)
    setBuddyDismissed(false)
  }

  // Telemetry poll loop with smooth deterministic local fallback
  useEffect(() => {
    let tickCount = 0
    tickTimer.current = setInterval(async () => {
      tickCount++
      const now = new Date()
      const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} MTC`

      try {
        const packet = await tickTelemetry()
        if (packet) {
          const score = packet.risk_assessment?.composite_risk_score ?? 0.28
          setTelemetry(prev => ({
            sol: packet.sol ?? 1084,
            clock: timeStr,
            progressPct: packet.progress_pct ?? prev.progressPct,
            distanceKm: packet.distance_travelled_km ?? prev.distanceKm,
            tempC: +(packet.environmental?.temperature_c ?? prev.tempC).toFixed(1),
            radiationUsv: +(packet.environmental?.radiation_usv_hr ?? prev.radiationUsv).toFixed(1),
            pressurePa: +(packet.environmental?.pressure_pa ?? prev.pressurePa).toFixed(0),
            dustTau: +(packet.environmental?.dust_tau ?? prev.dustTau).toFixed(2),
            slopeDeg: +(packet.environmental?.terrain_slope_deg ?? prev.slopeDeg).toFixed(1),
            batteryPct: +(packet.subsystems?.rover_battery_pct ?? prev.batteryPct).toFixed(1),
            o2Pct: +(packet.subsystems?.suit_o2_pct ?? prev.o2Pct).toFixed(1),
            workloadWatts: packet.astronaut_physiology?.workload_watts ?? prev.workloadWatts,
            heartRateBpm: packet.astronaut_physiology?.heart_rate_bpm ?? prev.heartRateBpm,
            riskScore: score,
            riskLevel: score > 0.7 ? 'HIGH' : score > 0.4 ? 'MEDIUM' : 'LOW',
            isAnomaly: packet.pipeline_validation?.is_anomaly ?? prev.isAnomaly,
            anomalyType: prev.anomalyType,
            anomalyAlerts: packet.pipeline_validation?.alerts ?? prev.anomalyAlerts,
          }))
        }
      } catch (e) {
        // Local simulation fallback
        setTelemetry(prev => {
          const temp = -43.2 + Math.sin(tickCount * 0.1) * 2.5
          const rad = 26.8 + Math.cos(tickCount * 0.15) * 1.8
          const dust = 0.49 + Math.sin(tickCount * 0.08) * 0.05
          const batt = Math.max(70, 88.4 - tickCount * 0.02)
          const o2 = Math.max(80, 92.1 - tickCount * 0.015)
          const hr = 82 + Math.round(Math.sin(tickCount * 0.2) * 4)
          return {
            ...prev,
            clock: timeStr,
            tempC: +temp.toFixed(1),
            radiationUsv: +rad.toFixed(1),
            dustTau: +dust.toFixed(2),
            batteryPct: +batt.toFixed(1),
            o2Pct: +o2.toFixed(1),
            heartRateBpm: hr,
          }
        })
      }
    }, 2000)

    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current)
    }
  }, [])

  return (
    <MissionContext.Provider
      value={{
        telemetry,
        soundEnabled,
        toggleSound,
        playClick,
        playChime,
        playWarning,
        guidedMode,
        setGuidedMode,
        currentStep,
        nextGuidedStep,
        prevGuidedStep,
        jumpToStep,
        showDataLimits,
        setShowDataLimits,
        buddyDismissed,
        setBuddyDismissed,
        buddyMessage,
        setBuddyMessage,
        missionXP,
        addXP,
        badges,
        triggerAnomalyEvent,
      }}
    >
      {children}
    </MissionContext.Provider>
  )
}

export function useMission() {
  const ctx = useContext(MissionContext)
  if (!ctx) throw new Error('useMission must be used within a MissionProvider')
  return ctx
}

