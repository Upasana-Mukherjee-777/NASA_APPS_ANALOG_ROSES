'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  Heart,
  Wind,
  Battery,
  Thermometer,
  Radio,
  Sliders,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Flame
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { controlTelemetry, injectAnomaly, clearAnomaly } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

export default function LiveTelemetryPage() {
  const { telemetry, playClick, playChime, playWarning, triggerAnomalyEvent } = useMission()

  // Heartbeat wave history
  const [pulseData, setPulseData] = useState<{ t: number; val: number }[]>([])
  const [frequencyHz, setFrequencyHz] = useState<number>(1.0)
  const [tickerEvents, setTickerEvents] = useState<string[]>([
    'Telemetry stream linked to Mars 2020 Perseverance relay (Mavens/TGO orbiters).',
    'Suit life support primary oxygen loop nominal at 0.42 L/min.',
    'Surface temperature at -43.2°C; battery heating loop operating at 95% efficiency.',
  ])

  // ECG Pulse waveform generator
  useEffect(() => {
    let t = 0
    const interval = setInterval(() => {
      t++
      // Generate synthetic ECG pattern: flat baseline with occasional sharp P-Q-R-S-T peaks
      const cycle = t % 12
      let val = 70
      if (cycle === 4) val = 65
      else if (cycle === 5) val = 120 // R peak
      else if (cycle === 6) val = 55  // S dip
      else if (cycle === 7) val = 82  // T wave

      setPulseData(prev => [...prev.slice(-25), { t, val }])
    }, 150)

    return () => clearInterval(interval)
  }, [])

  const handleInject = async (type: string) => {
    playWarning()
    triggerAnomalyEvent(type, 'HIGH')
    setTickerEvents(prev => [
      `CRITICAL ALERT: Dynamic anomaly ${type} injected! Recomputing safety thresholds.`,
      ...prev,
    ])
    try {
      await injectAnomaly(type, 'HIGH')
    } catch (e) {}
  }

  const handleClear = async () => {
    playClick()
    setTickerEvents(prev => ['All active contingencies cleared. Nominal baseline restored.', ...prev])
    try {
      await clearAnomaly()
    } catch (e) {}
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-5xl mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type={telemetry.isAnomaly ? 'SIMULATED' : 'REAL'} />
            <span className="text-xs font-mono font-bold text-zinc-400">
              MARS TELEMETRY HEARTBEAT STREAM
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Live Astronaut & Rover Vitals
          </h1>
        </div>

        {/* Small Frequency Control */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md">
          <span className="text-[10px] font-mono text-zinc-400 pl-1">POLL FREQ:</span>
          {[0.5, 1.0, 2.0].map(hz => (
            <button
              key={hz}
              onClick={() => {
                playClick()
                setFrequencyHz(hz)
                controlTelemetry('SET_FREQ', hz)
              }}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                frequencyHz === hz ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {hz} Hz
            </button>
          ))}
        </div>
      </div>

      {/* Heartbeat ECG Live Pulse Waveform Banner */}
      <div className="my-3 rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-4 shadow-2xl glass-panel">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white">
              ASTRONAUT CARDIAC & WORKLOAD ECG
            </span>
          </div>
          <span className="text-xs font-mono text-rose-400 font-bold">
            {telemetry.heartRateBpm} BPM ({telemetry.workloadWatts} Watts)
          </span>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pulseData}>
              <YAxis domain={[40, 140]} hide />
              <Line
                type="monotone"
                dataKey="val"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5 Animated Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-2">
        {/* 1. Oxygen */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Wind className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 block uppercase">Suit O2</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.o2Pct}%</span>
          <span className="text-[9px] font-mono text-cyan-400 block mt-0.5">0.42 L/min</span>
        </div>

        {/* 2. Battery */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Battery className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 block uppercase">Rover Batt</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.batteryPct}%</span>
          <span className="text-[9px] font-mono text-emerald-400 block mt-0.5">94% Health</span>
        </div>

        {/* 3. Surface Temp */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Thermometer className="w-5 h-5 mx-auto text-orange-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 block uppercase">Temperature</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.tempC}°C</span>
          <span className="text-[9px] font-mono text-orange-400 block mt-0.5">Subsurface Frost</span>
        </div>

        {/* 4. Radiation */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Radio className="w-5 h-5 mx-auto text-purple-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 block uppercase">RAD Dose</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.radiationUsv}</span>
          <span className="text-[9px] font-mono text-purple-400 block mt-0.5">μSv/h Flux</span>
        </div>

        {/* 5. Dust Optical Depth */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl col-span-2 sm:col-span-1">
          <AlertTriangle className="w-5 h-5 mx-auto text-amber-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 block uppercase">Dust Tau</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.dustTau}</span>
          <span className="text-[9px] font-mono text-amber-400 block mt-0.5">MEDA Sky Extinction</span>
        </div>
      </div>

      {/* Quick Anomaly Injection Trigger Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest pl-1 shrink-0">
          TEST ANOMALY:
        </span>
        <button
          onClick={() => handleInject('DUST_STORM')}
          className="px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-300 font-mono text-xs font-bold hover:bg-amber-950/80 transition touch-react shrink-0"
        >
          Inject Dust Storm
        </button>
        <button
          onClick={() => handleInject('RADIATION_SPIKE')}
          className="px-3 py-1.5 rounded-xl border border-purple-500/50 bg-purple-950/40 text-purple-300 font-mono text-xs font-bold hover:bg-purple-950/80 transition touch-react shrink-0"
        >
          Inject SPE Spike
        </button>
        <button
          onClick={() => handleInject('O2_LEAK')}
          className="px-3 py-1.5 rounded-xl border border-red-500/50 bg-red-950/40 text-red-300 font-mono text-xs font-bold hover:bg-red-950/80 transition touch-react shrink-0"
        >
          Inject O2 Micro-leak
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white font-mono text-xs font-bold transition touch-react shrink-0"
        >
          Clear
        </button>
      </div>

      {/* Scrolling Live Event Ticker */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest">
            LIVE MISSION TICKER:
          </span>
        </div>
        <div className="space-y-1 text-xs font-mono text-zinc-300">
          {tickerEvents.slice(0, 2).map((ev, i) => (
            <p key={i} className="truncate">
              {ev}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
