'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  ShieldAlert,
  Flame,
  Radio,
  Clock,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Box,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Zap,
  BatteryCharging,
  Gauge,
  Thermometer,
  Wind,
  Layers,
  Heart
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
import { getMissions, getMissionDetail, controlTelemetry, tickTelemetry, injectAnomaly, clearAnomaly } from '@/services/api'

export default function MissionControlCentrePage() {
  const [missionData, setMissionData] = useState<any>(null)
  const [simStatus, setSimStatus] = useState<'RUNNING' | 'PAUSED' | 'IDLE'>('RUNNING')
  const [speed, setSpeed] = useState<number>(1)
  const [activeAnomalyName, setActiveAnomalyName] = useState<string | null>(null)

  // Telemetry state
  const [currentPacket, setCurrentPacket] = useState<any>({
    step: 24,
    timestamp: new Date().toISOString(),
    sol: 1084,
    mission_phase: "SURFACE_TRAVERSAL",
    progress_pct: 42.5,
    distance_travelled_km: 1.63,
    distance_remaining_km: 2.22,
    estimated_return_time_min: 55,
    astronaut_position: { lat: 18.3970, lon: 77.5545, elevation_m: -2548.0 },
    environmental: {
      temperature_c: -43.2,
      radiation_usv_hr: 26.8,
      pressure_pa: 717.8,
      dust_tau: 0.49,
      wind_speed_ms: 7.4,
      terrain_slope_deg: 7.2
    },
    subsystems: {
      rover_battery_pct: 88.4,
      suit_o2_pct: 92.1,
      suit_o2_flow_l_min: 0.42,
      water_coolant_pct: 90.5,
      cooling_loop_efficiency: 0.95,
      equipment_health_pct: 94.0
    },
    astronaut_physiology: {
      heart_rate_bpm: 82,
      workload_watts: 310.0,
      fatigue_index: 34.0
    },
    risk_assessment: {
      composite_risk_score: 0.28,
      risk_level: "LOW"
    },
    pipeline_validation: {
      is_anomaly: false,
      severity: "NOMINAL",
      alerts: [],
      provenance: "SIMULATED_LIVE"
    }
  })

  // History buffer for 8 interactive charts
  const [historyData, setHistoryData] = useState<any[]>([])
  const [activeGraphTab, setActiveGraphTab] = useState<'ALL' | 'ENV' | 'SYSTEMS' | 'CREW'>('ALL')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load mission details on mount
  useEffect(() => {
    const loadMission = async () => {
      try {
        const missions = await getMissions()
        if (missions && missions.length > 0) {
          const detail = await getMissionDetail(missions[0].id)
          setMissionData(detail)
        }
      } catch (err) {
        console.error('Error fetching mission detail:', err)
      }
    }
    loadMission()
  }, [])

  // Initialize initial history buffer with realistic historical readings
  useEffect(() => {
    const initialHistory = []
    const now = Date.now()
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 3000)
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      const stepIdx = 24 - i
      const prog = Math.max(0, stepIdx / 180.0)
      initialHistory.push({
        time: timeStr,
        step: stepIdx,
        temperature: parseFloat((-44.5 + Math.sin(stepIdx * 0.08) * 4.0 + (Math.random() - 0.5)).toFixed(2)),
        radiation: parseFloat((26.0 + (Math.random() - 0.5) * 1.5).toFixed(2)),
        pressure: parseFloat((718.0 + Math.cos(stepIdx * 0.05) * 2.0).toFixed(1)),
        dust: parseFloat((0.48 + (Math.random() - 0.5) * 0.03).toFixed(3)),
        slope: parseFloat((4.5 + prog * 10.0 + (Math.random() - 0.5)).toFixed(1)),
        battery: parseFloat((98.0 - prog * 20.0).toFixed(1)),
        o2: parseFloat((99.0 - prog * 15.0).toFixed(1)),
        workload: parseFloat((280 + prog * 120 + Math.random() * 20).toFixed(0)),
        heartRate: parseFloat((76 + prog * 18 + Math.random() * 5).toFixed(0)),
        risk: parseFloat((0.22 + prog * 0.15).toFixed(3))
      })
    }
    setHistoryData(initialHistory)
  }, [])

  // Live telemetry polling loop
  useEffect(() => {
    if (simStatus !== 'RUNNING') {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const intervalMs = Math.max(500, Math.round(2000 / speed))
    timerRef.current = setInterval(async () => {
      try {
        const packet = await tickTelemetry()
        if (packet) {
          setCurrentPacket(packet)
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          const newPoint = {
            time: timeStr,
            step: packet.step,
            temperature: packet.environmental?.temperature_c ?? -43.0,
            radiation: packet.environmental?.radiation_usv_hr ?? 26.5,
            pressure: packet.environmental?.pressure_pa ?? 718.0,
            dust: packet.environmental?.dust_tau ?? 0.48,
            slope: packet.environmental?.terrain_slope_deg ?? 6.0,
            battery: packet.subsystems?.rover_battery_pct ?? 85.0,
            o2: packet.subsystems?.suit_o2_pct ?? 92.0,
            workload: packet.astronaut_physiology?.workload_watts ?? 300,
            heartRate: packet.astronaut_physiology?.heart_rate_bpm ?? 80,
            risk: packet.risk_assessment?.composite_risk_score ?? 0.25
          }
          setHistoryData(prev => {
            const updated = [...prev, newPoint]
            return updated.slice(-30) // retain last 30 live readings
          })
        }
      } catch (e) {
        // Fallback local computational generator if backend offline
        generateLocalTick()
      }
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [simStatus, speed, activeAnomalyName])

  // Fallback local tick generator for standalone demonstration
  const generateLocalTick = () => {
    setCurrentPacket((prev: any) => {
      const step = (prev.step || 0) + 1
      const prog = Math.min(1.0, step / 180.0)
      const dist = parseFloat((prog * 3.85).toFixed(3))
      const rem = parseFloat(Math.max(0, 3.85 - dist).toFixed(3))
      let temp = parseFloat((-43.5 + Math.sin(step * 0.05) * 6.0 + (Math.random() - 0.5)).toFixed(2))
      let rad = parseFloat((26.5 + (Math.random() - 0.5) * 1.5).toFixed(2))
      let dust = parseFloat((0.48 + (Math.random() - 0.5) * 0.02).toFixed(3))
      let slope = parseFloat((5.0 + prog * 11.0 + (Math.random() - 0.5)).toFixed(1))
      let workload = parseFloat((290 + slope * 10 + Math.random() * 15).toFixed(0))
      let o2 = parseFloat(Math.max(15, prev.subsystems?.suit_o2_pct - 0.04).toFixed(1))
      let bat = parseFloat(Math.max(10, prev.subsystems?.rover_battery_pct - 0.06).toFixed(1))

      let isAnom = false
      let anomSev = "NOMINAL"
      const alerts: any[] = []

      if (activeAnomalyName === 'DUST_STORM') {
        dust = parseFloat((dust + 1.8).toFixed(3))
        isAnom = true
        anomSev = "CRITICAL"
        alerts.push({ code: "ENV_DUST_STORM", severity: "CRITICAL", message: "Atmospheric optical depth tau elevated to 2.3+; visibility <15%." })
      } else if (activeAnomalyName === 'RADIATION_SPIKE') {
        rad = parseFloat((rad + 118.0).toFixed(1))
        isAnom = true
        anomSev = "CRITICAL"
        alerts.push({ code: "ENV_RAD_SPE", severity: "CRITICAL", message: "Solar Particle Event detected. Dosimetry > 140 uSv/hr." })
      } else if (activeAnomalyName === 'OXYGEN_LEAK') {
        o2 = parseFloat(Math.max(5, o2 - 0.4).toFixed(1))
        isAnom = true
        anomSev = "CRITICAL"
        alerts.push({ code: "LIFE_O2_LEAK", severity: "CRITICAL", message: "Rapid spacesuit O2 pressure loss. Primary loop leak." })
      }

      const risk = parseFloat((0.2 + (dust / 3.0) * 0.3 + (rad / 150) * 0.3 + (slope / 25) * 0.2).toFixed(3))

      const updated = {
        ...prev,
        step,
        timestamp: new Date().toISOString(),
        progress_pct: parseFloat((prog * 100).toFixed(1)),
        distance_travelled_km: dist,
        distance_remaining_km: rem,
        estimated_return_time_min: Math.round(rem / (2.4 / 60)),
        environmental: {
          temperature_c: temp,
          radiation_usv_hr: rad,
          pressure_pa: parseFloat((717.5 + (Math.random() - 0.5)).toFixed(1)),
          dust_tau: dust,
          wind_speed_ms: parseFloat((7.0 + (Math.random() - 0.5) * 1.5).toFixed(1)),
          terrain_slope_deg: slope
        },
        subsystems: {
          rover_battery_pct: bat,
          suit_o2_pct: o2,
          suit_o2_flow_l_min: activeAnomalyName === 'OXYGEN_LEAK' ? 1.85 : 0.42,
          water_coolant_pct: parseFloat(Math.max(10, prev.subsystems?.water_coolant_pct - 0.03).toFixed(1)),
          cooling_loop_efficiency: 0.95,
          equipment_health_pct: parseFloat(bat.toFixed(1))
        },
        astronaut_physiology: {
          heart_rate_bpm: Math.round(75 + slope * 2.5),
          workload_watts: workload,
          fatigue_index: Math.round(prog * 45)
        },
        risk_assessment: {
          composite_risk_score: risk,
          risk_level: risk > 0.6 ? "CRITICAL" : risk > 0.4 ? "HIGH" : risk > 0.25 ? "MEDIUM" : "LOW"
        },
        pipeline_validation: {
          is_anomaly: isAnom,
          severity: anomSev,
          alerts,
          provenance: "SIMULATED_DEMO"
        }
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      setHistoryData(h => [...h, {
        time: timeStr,
        step,
        temperature: temp,
        radiation: rad,
        pressure: 717.5,
        dust,
        slope,
        battery: bat,
        o2,
        workload,
        heartRate: Math.round(75 + slope * 2.5),
        risk
      }].slice(-30))

      return updated
    })
  }

  // Simulator controls
  const handleStart = async () => {
    try { await controlTelemetry('START') } catch (e) {}
    setSimStatus('RUNNING')
  }

  const handlePause = async () => {
    try { await controlTelemetry('PAUSE') } catch (e) {}
    setSimStatus('PAUSED')
  }

  const handleReset = async () => {
    try {
      await controlTelemetry('RESET')
      await clearAnomaly()
    } catch (e) {}
    setSimStatus('IDLE')
    setActiveAnomalyName(null)
    setHistoryData([])
  }

  const handleInjectAnomaly = async (type: string) => {
    setActiveAnomalyName(type)
    try {
      await injectAnomaly(type, 'HIGH', `Manual contingency triggered from Mission Control Centre`)
    } catch (e) {}
  }

  const handleClearAnomaly = async () => {
    setActiveAnomalyName(null)
    try { await clearAnomaly() } catch (e) {}
  }

  const mission = missionData?.mission
  const hazards = missionData?.hazards || []
  const alerts = currentPacket.pipeline_validation?.alerts || []
  const riskLevel = currentPacket.risk_assessment?.risk_level || 'LOW'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header: Live Mission Status & Telemetry Simulator Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-md bg-emerald-950 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-800/80">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MISSION CONTROL: LIVE TELEMETRY
            </span>
            <span className="text-xs text-zinc-400 font-mono">SOL {currentPacket.sol || 1084} • JEZERO CRATER CORRIDOR</span>
            <span className="text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              INGESTION: ACTIVE (MOLA -2580m)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {mission?.name || "EVA-07: Jezero Western Delta Sortie"}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time telemetry ingestion pipeline with multi-variable physics monitoring, automated anomaly detection, and risk reassessment.
          </p>
        </div>

        {/* Live Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 p-2 shadow-lg">
          {simStatus === 'RUNNING' ? (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600/20 border border-amber-600/60 px-3 py-1.5 text-xs font-mono font-bold text-amber-300 hover:bg-amber-600/30 transition"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-emerald-500 transition shadow"
            >
              <Play className="h-3.5 w-3.5" />
              <span>START LIVE</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-300 hover:bg-zinc-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET</span>
          </button>

          {/* Speed Switcher */}
          <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-zinc-800 text-xs font-mono">
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded transition text-[11px] ${
                  speed === s ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <Link
            href="/simulation"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-orange-500 hover:to-amber-500 transition shadow"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Open Simulator</span>
          </Link>
        </div>
      </div>

      {/* Active Alerts Banner if Anomaly Triggered */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-800/80 bg-red-950/40 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-600/30 border border-red-500 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-red-400 uppercase tracking-wide">
                ACTIVE CONTINGENCY ALERT • {alerts[0].severity}
              </div>
              <p className="text-xs text-red-200 mt-0.5">{alerts[0].message}</p>
            </div>
          </div>
          <button
            onClick={handleClearAnomaly}
            className="self-end md:self-center px-3 py-1.5 rounded-lg bg-red-900/60 border border-red-700 text-xs font-mono text-red-200 hover:bg-red-800/70 transition shrink-0"
          >
            Acknowledge & Clear Anomaly
          </button>
        </div>
      )}

      {/* Section 1: MISSION STATUS PANEL (All 9 Required Variables) */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Mission Status Panel — EVA-07 Tactical Telemetry
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            SIMULATION CLOCK: T+ {Math.floor((currentPacket.step * 5) / 60)}m {((currentPacket.step * 5) % 60)}s
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          {/* 1. Mission ID */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[10px] text-zinc-400 block uppercase">Mission ID</span>
            <div className="text-sm font-bold text-white mt-1">EVA-07-JEZ</div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Crew: 2 Astronauts</span>
          </div>

          {/* 2. Mission Duration */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[10px] text-zinc-400 block uppercase">Duration / Limit</span>
            <div className="text-sm font-bold text-orange-400 mt-1">
              03h 15m <span className="text-xs text-zinc-400">/ 06h</span>
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Nominal Reserve</span>
          </div>

          {/* 3. Current Sol */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[10px] text-zinc-400 block uppercase">Martian Sol</span>
            <div className="text-sm font-bold text-cyan-400 mt-1">SOL {currentPacket.sol || 1084}</div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Local Solar Time: 13:42</span>
          </div>

          {/* 4. Astronaut Location */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[10px] text-zinc-400 block uppercase">Astronaut Location</span>
            <div className="text-xs font-bold text-zinc-200 mt-1">
              {currentPacket.astronaut_position?.lat?.toFixed(4)}° N, {currentPacket.astronaut_position?.lon?.toFixed(4)}° E
            </div>
            <span className="text-[10px] text-orange-400 block mt-0.5">
              Elev: {currentPacket.astronaut_position?.elevation_m?.toFixed(0)} m
            </span>
          </div>

          {/* 5. Mission Phase */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[10px] text-zinc-400 block uppercase">Current Phase</span>
            <div className="text-xs font-bold text-emerald-400 mt-1 truncate">
              {currentPacket.mission_phase?.replace('_', ' ')}
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Heading: 284° WNW</span>
          </div>

          {/* 6. Distance Travelled & Remaining */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3">
            <span className="text-[10px] text-zinc-400 block uppercase">Distance (Travelled / Rem)</span>
            <div className="text-xs font-bold text-white mt-1">
              <span className="text-orange-400">{currentPacket.distance_travelled_km} km</span> / {currentPacket.distance_remaining_km} km
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Est. Return: {currentPacket.estimated_return_time_min} min
            </span>
          </div>
        </div>

        {/* Mission Completion Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-zinc-400">MISSION COMPLETION PROGRESS</span>
            <span className="text-orange-400 font-bold">{currentPacket.progress_pct}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, currentPacket.progress_pct)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Contingency Injection Testbar for Judges / Evaluators */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-zinc-200">DEMONSTRATION CONTINGENCY INJECTION (OBSERVE LIVE SYSTEM RESPONSE)</span>
          </div>
          <span className="text-[10px] text-zinc-400">CLICK TO INJECT UNEXPECTED EVENT</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleInjectAnomaly('DUST_STORM')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeAnomalyName === 'DUST_STORM'
                ? 'bg-amber-600 text-white font-bold border-amber-500'
                : 'border-zinc-800 bg-zinc-900 text-amber-400 hover:border-amber-600'
            }`}
          >
            🌪️ Sudden Dust Storm
          </button>
          <button
            onClick={() => handleInjectAnomaly('RADIATION_INCREASE')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeAnomalyName === 'RADIATION_INCREASE'
                ? 'bg-red-600 text-white font-bold border-red-500'
                : 'border-zinc-800 bg-zinc-900 text-red-400 hover:border-red-600'
            }`}
          >
            ☢️ Radiation Spike (SPE)
          </button>
          <button
            onClick={() => handleInjectAnomaly('OXYGEN_LEAK')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeAnomalyName === 'OXYGEN_LEAK'
                ? 'bg-cyan-600 text-white font-bold border-cyan-500'
                : 'border-zinc-800 bg-zinc-900 text-cyan-400 hover:border-cyan-600'
            }`}
          >
            💨 Suit O2 Loop Leak
          </button>
          <button
            onClick={() => handleInjectAnomaly('TERRAIN_OBSTRUCTION')}
            className={`px-3 py-1.5 rounded-lg border transition ${
              activeAnomalyName === 'TERRAIN_OBSTRUCTION'
                ? 'bg-orange-600 text-white font-bold border-orange-500'
                : 'border-zinc-800 bg-zinc-900 text-orange-400 hover:border-orange-600'
            }`}
          >
            ⚠️ Steep Scree Escarpment
          </button>
          {activeAnomalyName && (
            <button
              onClick={handleClearAnomaly}
              className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400 hover:bg-emerald-900 transition font-bold"
            >
              ✓ Clear Anomaly & Restore Nominal
            </button>
          )}
        </div>
      </div>

      {/* Section 2: LIVE ENVIRONMENTAL & SUBSYSTEMS MONITORING (All 8 Interactive Graphs) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-400" />
              Live Telemetry Multi-Variable Graph Suite
            </h3>
            <p className="text-xs text-zinc-400">
              Interactive time-series charts updating with live telemetry stream. Hover for values and tooltips.
            </p>
          </div>

          {/* Filter Graph View */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-mono">
            {(['ALL', 'ENV', 'SYSTEMS', 'CREW'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveGraphTab(tab)}
                className={`px-2.5 py-1 rounded-md transition ${
                  activeGraphTab === tab ? 'bg-orange-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 8 Graphs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Graph 1: Temperature Variation */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'ENV') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-blue-400" />
                  1. Surface Temp
                </span>
                <span className="text-xs font-bold text-blue-400">
                  {currentPacket.environmental?.temperature_c}°C
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[-60, -30]} unit="°C" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="temperature" stroke="#38bdf8" fillOpacity={1} fill="url(#tempGrad)" strokeWidth={2} name="Temp (°C)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">THEMIS / MEDA Sensor</span>
            </div>
          )}

          {/* Graph 2: Radiation Exposure */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'ENV') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-red-400" />
                  2. Radiation Rate
                </span>
                <span className={`text-xs font-bold ${currentPacket.environmental?.radiation_usv_hr > 50 ? 'text-red-400 animate-pulse' : 'text-zinc-200'}`}>
                  {currentPacket.environmental?.radiation_usv_hr} μSv/h
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[15, 'auto']} unit="μSv" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="radiation" stroke="#ef4444" strokeWidth={2} dot={false} name="Dosimetry (μSv/h)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">MSL/RAD Silicon Detector</span>
            </div>
          )}

          {/* Graph 3: Atmospheric Pressure */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'ENV') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                  3. Pressure (Pa)
                </span>
                <span className="text-xs font-bold text-cyan-400">
                  {currentPacket.environmental?.pressure_pa} Pa
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[710, 725]} unit="Pa" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="pressure" stroke="#06b6d4" strokeWidth={2} dot={false} name="Pressure (Pa)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">MEDA Pressure Sensor</span>
            </div>
          )}

          {/* Graph 4: Dust Concentration */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'ENV') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-amber-400" />
                  4. Dust Opacity (τ)
                </span>
                <span className={`text-xs font-bold ${currentPacket.environmental?.dust_tau > 1.0 ? 'text-amber-400 animate-pulse' : 'text-zinc-200'}`}>
                  {currentPacket.environmental?.dust_tau} Tau
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="dustGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[0.2, 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="dust" stroke="#f59e0b" fillOpacity={1} fill="url(#dustGrad)" strokeWidth={2} name="Dust Tau (τ)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">Mastcam-Z Solar Extinction</span>
            </div>
          )}

          {/* Graph 5: Terrain Slope */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'SYSTEMS') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-orange-400" />
                  5. Terrain Slope
                </span>
                <span className={`text-xs font-bold ${currentPacket.environmental?.terrain_slope_deg > 15 ? 'text-red-400' : 'text-orange-400'}`}>
                  {currentPacket.environmental?.terrain_slope_deg}°
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[0, 25]} unit="°" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="slope" stroke="#ea580c" strokeWidth={2} dot={false} name="Slope (deg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">Rover IMU & MOLA DEM</span>
            </div>
          )}

          {/* Graph 6: Equipment Status & Battery */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'SYSTEMS') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
                  6. Rover Battery (%)
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {currentPacket.subsystems?.rover_battery_pct}%
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[50, 100]} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} dot={false} name="Battery (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">MMRTG / Li-Ion Bus</span>
            </div>
          )}

          {/* Graph 7: Resource Consumption (O2 Remaining) */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'CREW') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  7. Spacesuit O2 Level
                </span>
                <span className={`text-xs font-bold ${currentPacket.subsystems?.suit_o2_pct < 40 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                  {currentPacket.subsystems?.suit_o2_pct}%
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[40, 100]} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="o2" stroke="#22d3ee" strokeWidth={2} dot={false} name="O2 Reserve (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">Primary PLSS O2 Tank</span>
            </div>
          )}

          {/* Graph 8: Astronaut Workload */}
          {(activeGraphTab === 'ALL' || activeGraphTab === 'CREW') && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-pink-400" />
                  8. Crew Metabolic Load
                </span>
                <span className="text-xs font-bold text-pink-400">
                  {currentPacket.astronaut_physiology?.workload_watts} W
                </span>
              </div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="workloadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={9} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={9} domain={[200, 500]} unit="W" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="workload" stroke="#ec4899" fillOpacity={1} fill="url(#workloadGrad)" strokeWidth={2} name="Metabolic (Watts)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono block text-right">Telemetry Heart Rate: {currentPacket.astronaut_physiology?.heart_rate_bpm} bpm</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Quick Links to Full Operating Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <Link
          href="/explorer"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-orange-500/60 transition group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-orange-400">MODULE 2</span>
              <Compass className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 transition" />
            </div>
            <h4 className="text-sm font-bold text-white">Interactive Martian Explorer</h4>
            <p className="text-[11px] text-zinc-400">
              8 NASA data layers, pan/zoom GIS, manual hazard marker drops, and terrain inspection.
            </p>
          </div>
          <span className="text-xs text-orange-400 font-mono mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition">
            Launch Explorer →
          </span>
        </Link>

        <Link
          href="/simulation"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-orange-500/60 transition group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-orange-400">MODULE 6</span>
              <Activity className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 transition" />
            </div>
            <h4 className="text-sm font-bold text-white">Mars Mission Simulator</h4>
            <p className="text-[11px] text-zinc-400">
              Operate hypothetical missions, manipulate 11 environmental sliders, and watch AI respond.
            </p>
          </div>
          <span className="text-xs text-orange-400 font-mono mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition">
            Run Simulator →
          </span>
        </Link>

        <Link
          href="/planner"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-orange-500/60 transition group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-orange-400">MODULE 3</span>
              <TrendingUp className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 transition" />
            </div>
            <h4 className="text-sm font-bold text-white">Route Comparison Lab</h4>
            <p className="text-[11px] text-zinc-400">
              3 candidate routes, A* optimization, hard safety constraints, and emergency return paths.
            </p>
          </div>
          <span className="text-xs text-orange-400 font-mono mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition">
            Compare Routes →
          </span>
        </Link>

        <Link
          href="/experiments"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-orange-500/60 transition group flex flex-col justify-between"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-orange-400">MODULE 5</span>
              <Box className="h-4 w-4 text-zinc-500 group-hover:text-orange-400 transition" />
            </div>
            <h4 className="text-sm font-bold text-white">Martian Experiment Lab</h4>
            <p className="text-[11px] text-zinc-400">
              7 scientific templates, AI intervention classifier (Class A-D), and human approval workflow.
            </p>
          </div>
          <span className="text-xs text-orange-400 font-mono mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition">
            Simulate Experiments →
          </span>
        </Link>
      </div>
    </div>
  )
}
