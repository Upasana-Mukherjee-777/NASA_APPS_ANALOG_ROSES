'use client'

import React, { useState, useEffect } from 'react'
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
  Box
} from 'lucide-react'
import { getMissions, getMissionDetail, getTelemetryStream } from '@/services/api'

export default function MissionOverviewPage() {
  const [missionData, setMissionData] = useState<any>(null)
  const [telemetry, setTelemetry] = useState<any>({
    temperature_c: -42.5,
    radiation_usv_hr: 26.5,
    pressure_pa: 718.0,
    dust_tau: 0.48
  })
  const [loading, setLoading] = useState(true)

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
      } finally {
        setLoading(false)
      }
    }
    loadMission()

    const interval = setInterval(async () => {
      try {
        const t = await getTelemetryStream()
        setTelemetry(t)
      } catch (e) {}
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const mission = missionData?.mission
  const hazards = missionData?.hazards || []
  const experiments = missionData?.experiments || []

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-emerald-950 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400 border border-emerald-800/60">
              MISSION STATUS: ACTIVE
            </span>
            <span className="text-xs text-zinc-400 font-mono">SOL 1084 • JEZERO CRATER CORRIDOR</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            {mission?.name || "EVA-07: Scientific Exploration Near Jezero Crater"}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Two-person astronaut exploration sortie • Target: Western Delta Front Smectite Mudstones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/field"
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
          >
            <Activity className="h-4 w-4" />
            <span>Enter Field Observation</span>
          </Link>
          <Link
            href="/digital-twin"
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
          >
            <Box className="h-4 w-4 text-cyan-400" />
            <span>Open 3D Digital Twin</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono">SURFACE TEMPERATURE</span>
            <Flame className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {telemetry.temperature_c}°C
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Diurnal Range: -85° to -25°C</span>
            <span className="text-emerald-400 font-mono">NOMINAL</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono">IONIZING RADIATION</span>
            <Radio className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            {telemetry.radiation_usv_hr} <span className="text-sm font-normal text-zinc-400">μSv/h</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>NASA RAD Baseline: 26.5</span>
            <span className="text-emerald-400 font-mono">SPE QUIET</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono">TRAVERSE PROGRESS</span>
            <Compass className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            1.85 <span className="text-sm font-normal text-zinc-400">/ 4.25 km</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-1.5 rounded-full w-[43%]"></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono">LIFE SUPPORT BUFFER</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white">
            2.35 <span className="text-sm font-normal text-zinc-400">hours</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>O2 / Battery Margin: +55%</span>
            <span className="text-emerald-400 font-mono">SAFE</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Hazards & Route vs Experiments & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Active Hazards & Route Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Hazards Panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Identified Environmental Hazards</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {hazards.length} ACTIVE IN CORRIDOR
              </span>
            </div>

            <div className="space-y-3">
              {hazards.map((h: any) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-2 hover:border-zinc-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        h.severity === 'HIGH' ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {h.severity} SEVERITY
                      </span>
                      <span className="text-sm font-semibold text-zinc-100">{h.name}</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      Radius: {h.affected_radius_m}m • {h.source}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{h.description}</p>
                  {h.mitigation_steps && h.mitigation_steps.length > 0 && (
                    <div className="text-[11px] text-amber-300/90 font-mono bg-amber-950/20 p-2 rounded border border-amber-900/30">
                      <strong>Mitigation:</strong> {h.mitigation_steps.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Route Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Active Traverse Corridor</h3>
              </div>
              <Link href="/planner" className="text-xs font-semibold text-orange-400 hover:underline">
                Compare Candidate Routes &rarr;
              </Link>
            </div>

            <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-300">Aegis SafePath (Safety-Optimal Selected)</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-900/40 px-2 py-0.5 rounded">
                  HARD CONSTRAINTS VERIFIED
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Selected as primary mission path. Safely satisfies all hard terrain constraints (max slope 13.5° &lt; 18.0°),
                maintains comfort index 82.0/100, and ensures a 2.3h life-support safety reserve buffer.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">DISTANCE</div>
                  <div className="font-bold text-zinc-200">4.25 km</div>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">DURATION</div>
                  <div className="font-bold text-zinc-200">2.65 hrs</div>
                </div>
                <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                  <div className="text-zinc-400 text-[10px]">RISK SCORE</div>
                  <div className="font-bold text-emerald-400">24.5 / 100</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Experiments & Activity Feed */}
        <div className="space-y-6">
          {/* Scientific Experiments */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Active Sortie Experiments</h3>
              </div>
              <Link href="/experiments" className="text-xs font-semibold text-orange-400 hover:underline">
                Manage &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {experiments.map((e: any) => (
                <div key={e.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">{e.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      e.intervention_class === 'CLASS_C' ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    }`}>
                      {e.intervention_class}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{e.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
                    <span>Approval: {e.is_approved ? 'APPROVED ✓' : 'PENDING'}</span>
                    <span className="text-orange-400">{e.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Event Feed */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Adaptive Mission Event Feed</h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="border-l-2 border-emerald-500 pl-3 py-1 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>09:15 UTC</span>
                  <span className="text-emerald-400">NAVIGATION</span>
                </div>
                <div className="text-zinc-200 font-medium">Waypoint WP-01 Reached</div>
                <p className="text-[11px] text-zinc-400 font-sans">Navigation checkpoint validated; atmospheric sensors deployed.</p>
              </div>

              <div className="border-l-2 border-orange-500 pl-3 py-1 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>08:45 UTC</span>
                  <span className="text-orange-400">APPROVAL</span>
                </div>
                <div className="text-zinc-200 font-medium">Class C Experiment Authorized</div>
                <p className="text-[11px] text-zinc-400 font-sans">Commander Sarah Chen signed off on Delta Mudstone Core Drilling.</p>
              </div>

              <div className="border-l-2 border-cyan-500 pl-3 py-1 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>08:00 UTC</span>
                  <span className="text-cyan-400">SORTIE</span>
                </div>
                <div className="text-zinc-200 font-medium">EVA Egress Initiated</div>
                <p className="text-[11px] text-zinc-400 font-sans">Astronauts Chen and Thorne successfully exited Airlock 1.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

