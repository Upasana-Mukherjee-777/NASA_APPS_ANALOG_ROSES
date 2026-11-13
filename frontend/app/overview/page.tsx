'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Flame,
  Layers,
  TrendingUp,
  BarChart2
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { tickTelemetry, controlTelemetry, injectAnomaly, clearAnomaly } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

export default function LiveTelemetryGraphsPage() {
  const { telemetry, playClick, playChime, playWarning, triggerAnomalyEvent } = useMission()

  const [activeTab, setActiveTab] = useState<'ALL' | 'ENVIRONMENT' | 'SUBSYSTEMS' | 'CREW'>('ALL')
  const [historyData, setHistoryData] = useState<any[]>([])
  const [pulseData, setPulseData] = useState<{ t: number; val: number }[]>([])
  const [frequencyHz, setFrequencyHz] = useState<number>(1.0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize realistic 25-step history buffer
  useEffect(() => {
    const initData = []
    const now = Date.now()
    for (let i = 24; i >= 0; i--) {
      const stepIdx = 25 - i
      const prog = stepIdx / 180.0
      initData.push({
        time: new Date(now - i * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        step: stepIdx,
        temp: parseFloat((-44.5 + Math.sin(stepIdx * 0.1) * 3.5).toFixed(1)),
        radiation: parseFloat((26.0 + (Math.sin(stepIdx * 0.2) * 1.5)).toFixed(1)),
        pressure: parseFloat((718.0 + Math.cos(stepIdx * 0.15) * 2.0).toFixed(0)),
        dust: parseFloat((0.48 + Math.sin(stepIdx * 0.08) * 0.04).toFixed(2)),
        battery: parseFloat((98.0 - prog * 18.0).toFixed(1)),
        o2: parseFloat((99.0 - prog * 12.0).toFixed(1)),
        workload: parseFloat((280 + prog * 80 + Math.sin(stepIdx) * 15).toFixed(0)),
        heartRate: parseFloat((78 + prog * 12 + Math.sin(stepIdx) * 4).toFixed(0)),
        risk: parseFloat((0.22 + prog * 0.12).toFixed(3))
      })
    }
    setHistoryData(initData)
  }, [])

  // Live polling & history buffer updater
  useEffect(() => {
    let tickCount = 25
    const interval = Math.max(500, Math.round(1500 / frequencyHz))
    timerRef.current = setInterval(async () => {
      tickCount++
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

      try {
        const packet = await tickTelemetry()
        if (packet) {
          const pt = {
            time: timeStr,
            step: packet.step ?? tickCount,
            temp: +(packet.environmental?.temperature_c ?? telemetry.tempC).toFixed(1),
            radiation: +(packet.environmental?.radiation_usv_hr ?? telemetry.radiationUsv).toFixed(1),
            pressure: +(packet.environmental?.pressure_pa ?? telemetry.pressurePa).toFixed(0),
            dust: +(packet.environmental?.dust_tau ?? telemetry.dustTau).toFixed(2),
            battery: +(packet.subsystems?.rover_battery_pct ?? telemetry.batteryPct).toFixed(1),
            o2: +(packet.subsystems?.suit_o2_pct ?? telemetry.o2Pct).toFixed(1),
            workload: +(packet.astronaut_physiology?.workload_watts ?? telemetry.workloadWatts).toFixed(0),
            heartRate: +(packet.astronaut_physiology?.heart_rate_bpm ?? telemetry.heartRateBpm).toFixed(0),
            risk: +(packet.risk_assessment?.composite_risk_score ?? telemetry.riskScore).toFixed(3),
          }
          setHistoryData(prev => [...prev.slice(-29), pt])
        }
      } catch (e) {
        // Deterministic local step
        const pt = {
          time: timeStr,
          step: tickCount,
          temp: +(-43.2 + Math.sin(tickCount * 0.1) * 2.5).toFixed(1),
          radiation: +(26.8 + Math.cos(tickCount * 0.15) * 1.8).toFixed(1),
          pressure: +(718 + Math.sin(tickCount * 0.05) * 3).toFixed(0),
          dust: +(0.49 + Math.sin(tickCount * 0.08) * 0.05).toFixed(2),
          battery: +Math.max(60, telemetry.batteryPct - 0.05).toFixed(1),
          o2: +Math.max(70, telemetry.o2Pct - 0.04).toFixed(1),
          workload: +(310 + Math.sin(tickCount * 0.3) * 20).toFixed(0),
          heartRate: +(82 + Math.sin(tickCount * 0.3) * 5).toFixed(0),
          risk: +(telemetry.riskScore).toFixed(3),
        }
        setHistoryData(prev => [...prev.slice(-29), pt])
      }
    }, interval)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [frequencyHz, telemetry])

  // ECG pulse loop
  useEffect(() => {
    let t = 0
    const interval = setInterval(() => {
      t++
      const cycle = t % 12
      let val = 70
      if (cycle === 4) val = 65
      else if (cycle === 5) val = 120
      else if (cycle === 6) val = 55
      else if (cycle === 7) val = 82
      setPulseData(prev => [...prev.slice(-25), { t, val }])
    }, 150)
    return () => clearInterval(interval)
  }, [])

  const handleInject = async (type: string) => {
    playWarning()
    triggerAnomalyEvent(type, 'HIGH')
    try {
      await injectAnomaly(type, 'HIGH')
    } catch (e) {}
  }

  const handleClear = async () => {
    playClick()
    try {
      await clearAnomaly()
    } catch (e) {}
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-7xl mx-auto space-y-5">
      {/* Top Header & Multi-variable Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type={telemetry.isAnomaly ? 'SIMULATED' : 'REAL'} />
            <span className="text-xs font-mono font-bold text-zinc-400">
              MISSION CONTROL CENTRE (MCC) — TELEMETRY GRAPHS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Live Telemetry & Multi-Variable Graphs
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Streaming real-time biological, atmospheric, subsystem, and risk curves.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md font-mono text-xs font-bold">
          {(['ALL', 'ENVIRONMENT', 'SUBSYSTEMS', 'CREW'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                playClick()
                setActiveTab(tab)
              }}
              className={`px-3 py-1.5 rounded-xl transition ${
                activeTab === tab ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Top Vital Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Heart className="w-5 h-5 mx-auto text-rose-500 mb-1 animate-pulse" />
          <span className="text-[9px] font-mono text-zinc-400 uppercase">Heart Rate</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.heartRateBpm} BPM</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Wind className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 uppercase">Suit Oxygen</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.o2Pct}%</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Battery className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 uppercase">Rover Battery</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.batteryPct}%</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl">
          <Thermometer className="w-5 h-5 mx-auto text-orange-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 uppercase">Surface Temp</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.tempC}°C</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3 text-center backdrop-blur-xl col-span-2 sm:col-span-1">
          <Radio className="w-5 h-5 mx-auto text-purple-400 mb-1" />
          <span className="text-[9px] font-mono text-zinc-400 uppercase">RAD Flux</span>
          <span className="text-xl font-bold font-mono text-white">{telemetry.radiationUsv} μSv/h</span>
        </div>
      </div>

      {/* Main Graphs Grid: 8 Multi-variable Interactive Recharts Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph 1: Surface Temperature Curve */}
        {(activeTab === 'ALL' || activeTab === 'ENVIRONMENT') && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-mono font-bold text-white">SURFACE TEMPERATURE (°C)</h3>
              </div>
              <span className="text-xs font-mono text-orange-400 font-bold">{telemetry.tempC}°C</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="tempG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[-55, -30]} stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} fill="url(#tempG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 2: Radiation Flux (RAD Sensor) */}
        {(activeTab === 'ALL' || activeTab === 'ENVIRONMENT') && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-mono font-bold text-white">IONIZING RADIATION (μSv/h)</h3>
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">{telemetry.radiationUsv} μSv</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[15, 60]} stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Line type="monotone" dataKey="radiation" stroke="#c084fc" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 3: Rover Battery Depletion Curve */}
        {(activeTab === 'ALL' || activeTab === 'SUBSYSTEMS') && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-white">ROVER BATTERY RESERVE (%)</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">{telemetry.batteryPct}%</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="battG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[50, 100]} stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Area type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} fill="url(#battG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 4: Suit Oxygen Level Curve */}
        {(activeTab === 'ALL' || activeTab === 'SUBSYSTEMS') && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold text-white">SUIT OXYGEN FLOW & STORAGE (%)</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{telemetry.o2Pct}%</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[70, 100]} stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Line type="monotone" dataKey="o2" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 5: Cardiac Heart Rate & Metabolic Workload */}
        {(activeTab === 'ALL' || activeTab === 'CREW') && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="text-xs font-mono font-bold text-white">ASTRONAUT HEART RATE (BPM)</h3>
              </div>
              <span className="text-xs font-mono text-rose-400 font-bold">{telemetry.heartRateBpm} BPM</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="hrG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[60, 120]} stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={2} fill="url(#hrG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Graph 6: Composite Dynamic Risk Score */}
        {(activeTab === 'ALL' || activeTab === 'CREW') && (
          <div className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-bold text-white">COMPOSITE RISK SCORE (0.0 to 1.0)</h3>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">{(telemetry.riskScore * 100).toFixed(0)}%</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.4} />
                  <XAxis dataKey="time" stroke="#71717a" fontSize={10} />
                  <YAxis domain={[0, 1.0]} stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                  <Line type="monotone" dataKey="risk" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Contingency Anomaly Test Controls */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl p-4 flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase">INJECT TEST CONTINGENCY:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleInject('DUST_STORM')}
            className="px-3 py-1.5 rounded-xl border border-amber-500/50 bg-amber-950/40 text-amber-300 text-xs font-bold hover:bg-amber-950/80 transition touch-react"
          >
            Dust Storm (Tau 2.4)
          </button>
          <button
            onClick={() => handleInject('RADIATION_SPIKE')}
            className="px-3 py-1.5 rounded-xl border border-purple-500/50 bg-purple-950/40 text-purple-300 text-xs font-bold hover:bg-purple-950/80 transition touch-react"
          >
            Radiation Flare (140 μSv)
          </button>
          <button
            onClick={() => handleInject('O2_LEAK')}
            className="px-3 py-1.5 rounded-xl border border-red-500/50 bg-red-950/40 text-red-300 text-xs font-bold hover:bg-red-950/80 transition touch-react"
          >
            Oxygen Leak (-15 Pa/m)
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold transition touch-react"
          >
            Clear Contingency
          </button>
        </div>
      </div>
    </div>
  )
}
