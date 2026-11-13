'use client'

import React from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
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
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  Play
} from 'lucide-react'

export default function LandingPage() {
  const PILLARS = [
    {
      num: "01",
      title: "Mission Control Centre (MCC)",
      desc: "Live operational telemetry command centre. Multi-variable Recharts graphs for 8 live parameters, start/pause controls, and anomaly injection.",
      link: "/overview",
      tag: "Live Telemetry"
    },
    {
      num: "02",
      title: "Interactive Martian Explorer",
      desc: "Multi-layered GIS mapping across Jezero Crater featuring 8 NASA scientific data overlays, pan/zoom, manual hazard placement, and elevation profiling.",
      link: "/explorer",
      tag: "8 NASA Layers"
    },
    {
      num: "03",
      title: "Mars Mission Simulator",
      desc: "Dedicated mission simulation platform. Manipulate 11 environmental sliders, inject dynamic contingencies, and watch computational AI responses.",
      link: "/simulation",
      tag: "Live Simulation"
    },
    {
      num: "04",
      title: "Route Comparison Lab",
      desc: "Constrained multi-objective cost optimization J = αR + βC + γT. Enforces non-negotiable slope and radiation safety constraints across 3 candidate routes.",
      link: "/planner",
      tag: "A* Optimization"
    },
    {
      num: "05",
      title: "AI Risk Intelligence Dashboard",
      desc: "Dynamic multi-factor risk computation. Real-time parameter modifications, feature importance charts, and explainable safety decision rationales.",
      link: "/risk",
      tag: "Dynamic ML"
    },
    {
      num: "06",
      title: "Martian Experiment Lab",
      desc: "7 scientific experiment templates, AI intervention classifier (Class A to D), live execution simulation, and human approval workflow.",
      link: "/experiments",
      tag: "Class A-D AI"
    },
    {
      num: "07",
      title: "Historical Safety Intelligence (RAG)",
      desc: "Semantic retrieval of documented NASA mishap reports (Apollo 15 fatigue, Apollo 17 dust, ISS EVA 23 water leak) with explicit Martian transferability limits.",
      link: "/history",
      tag: "NASA Documents"
    },
    {
      num: "08",
      title: "3D Martian Digital Twin",
      desc: "Interactive 3D virtual environment combining terrain elevation grid, rover tracking, astronaut positions, hazards, and mission event timeline replay.",
      link: "/digital-twin",
      tag: "Three.js 3D Engine"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-4 font-sans">
      {/* Hero Section */}
      <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950/80 to-zinc-950 p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-950/40 px-3.5 py-1 text-xs font-mono font-medium text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            NASA SPACE APPS CHALLENGE: INTERPLANETARY SURVIVAL GUIDE — MARTIAN MAP
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            MARS-GUARD
          </h1>
          <p className="text-xl md:text-2xl font-light text-zinc-300">
            Interactive Martian Mission Control & Simulation Platform.
          </p>

          <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
            Prioritising astronaut safety, physical comfort, and mission feasibility while enabling scientific discovery.
            Connecting documented NASA spaceflight mishap experiences with live Martian environmental telemetry, constrained route pathfinding, real-time experiment simulation, and adaptive 3D digital twins.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2 font-mono">
            <Link
              href="/simulation"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg hover:from-orange-500 hover:to-amber-500 transition glow-orange"
            >
              <Play className="h-4 w-4" />
              <span>Launch Mars Mission Simulator</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/overview"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Live Mission Control (MCC)</span>
            </Link>

            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
            >
              <Compass className="h-4 w-4 text-orange-400" />
              <span>Interactive Map (8 Layers)</span>
            </Link>

            <Link
              href="/digital-twin"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              <Box className="h-4 w-4 text-cyan-400" />
              <span>3D Digital Twin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Demonstration Mission Banner */}
      <div className="rounded-xl border border-amber-800/40 bg-gradient-to-r from-amber-950/30 to-zinc-900/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 font-mono">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-semibold">Active Demonstration Sortie</span>
            <span className="text-xs text-zinc-400">• Sol 1084</span>
          </div>
          <h2 className="text-xl font-bold text-white font-sans">EVA-07: Jezero Western Delta Exploration</h2>
          <p className="text-xs text-zinc-400 max-w-2xl font-sans">
            Two-person astronaut sortie (Sarah Chen, Dr. Mark Thorne) investigating ancient lake delta smectite mudstones,
            navigating talus slope hazards, testing spacesuit cooling loops, and evaluating constrained routes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/simulation"
            className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
          >
            Run EVA-07 Simulation
          </Link>
          <Link
            href="/planner"
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition"
          >
            Compare Routes
          </Link>
        </div>
      </div>

      {/* Core Architectural Pillars Grid */}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white">The Eight Core Interactive Modules</h3>
          <p className="text-sm text-zinc-400">All modules are fully operational with mathematical models, AI classifiers, and live data telemetry.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((pillar) => (
            <Link
              key={pillar.num}
              href={pillar.link}
              className="group rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 hover:border-orange-500/50 hover:bg-zinc-900 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-orange-400">{pillar.num}</span>
                  <span className="font-mono text-[10px] uppercase text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                    {pillar.tag}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-zinc-100 group-hover:text-orange-400 transition">
                  {pillar.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {pillar.desc}
                </p>
              </div>

              <div className="pt-4 flex items-center text-xs font-semibold text-orange-400 group-hover:translate-x-1 transition font-mono">
                <span>Access Module</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Differentiators & Scientific Integrity */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 space-y-6 font-mono">
        <h3 className="text-xl font-bold text-white font-sans">Engineering Safeguards & Scientific Integrity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-400 font-sans">
          <div className="space-y-2 border-l-2 border-orange-500/60 pl-3">
            <h4 className="font-semibold text-zinc-200 font-mono">Strict Provenance Tags</h4>
            <p>Every piece of data is transparently flagged as <strong className="text-emerald-400 font-mono">OBSERVED</strong> (NASA sensor measurement), <strong className="text-cyan-400 font-mono">DERIVED</strong> (calculated engineering estimate), or <strong className="text-amber-400 font-mono">SIMULATED</strong> (demonstration physics model).</p>
          </div>
          <div className="space-y-2 border-l-2 border-orange-500/60 pl-3">
            <h4 className="font-semibold text-zinc-200 font-mono">Non-Bypassable Hard Constraints</h4>
            <p>Safety is not reduced to a simple weighted sum. Slopes &gt; 18°, active hazard boundaries, and life support time violations strictly invalidate route recommendations.</p>
          </div>
          <div className="space-y-2 border-l-2 border-orange-500/60 pl-3">
            <h4 className="font-semibold text-zinc-200 font-mono">Human Commander Oversight</h4>
            <p>Experiments involving hazardous perchlorates, core drilling, or elevated radiation enforce Class C mandatory Mission Commander approval before tool actuation.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
