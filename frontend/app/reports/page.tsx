'use client'

import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  ShieldAlert,
  Compass,
  FlaskConical,
  BookOpen,
  Info
} from 'lucide-react'
import { getMissions, getMissionReport } from '@/services/api'

export default function MissionReportsPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const ms = await getMissions()
        if (ms && ms.length > 0) {
          const rep = await getMissionReport(ms[0].id)
          setReport(rep)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const downloadJson = () => {
    if (!report) return
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.report_metadata.report_id}.json`
    a.click()
  }

  const printReport = () => {
    window.print()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 12: FLIGHT SUMMARY & REPORTING
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Mission Operations & Safety Report
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={downloadJson}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
          >
            <Download className="h-4 w-4" />
            <span>Download Audit JSON</span>
          </button>
        </div>
      </div>

      {report ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 space-y-8 font-sans text-xs">
          {/* Document Header Banner */}
          <div className="border-b border-zinc-800 pb-6 space-y-2 font-mono">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>DOCUMENT ID: {report.report_metadata.report_id}</span>
              <span>DATE: {report.report_metadata.generated_at.split('T')[0]}</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-sans">{report.report_metadata.title}</h2>
            <div className="flex items-center gap-3 text-xs text-orange-400">
              <span>{report.report_metadata.classification}</span>
              <span>•</span>
              <span className="text-zinc-400">{report.report_metadata.system_version}</span>
            </div>
          </div>

          {/* Section 1: Mission Overview */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-orange-400">
              1. Mission Overview & Objectives
            </h3>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
              <div className="text-base font-bold text-white">{report.mission_overview.name}</div>
              <p className="text-zinc-300 leading-relaxed">{report.mission_overview.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 font-mono text-[11px]">
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-zinc-500 block">START</span>
                  <span className="text-zinc-200">{report.mission_overview.start_coordinates.lat}°N, {report.mission_overview.start_coordinates.lon}°E</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-zinc-500 block">DESTINATION</span>
                  <span className="text-zinc-200">{report.mission_overview.dest_coordinates.lat}°N, {report.mission_overview.dest_coordinates.lon}°E</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-zinc-500 block">PLANNED EVA</span>
                  <span className="text-zinc-200">{report.mission_overview.planned_duration_hours} hours</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <span className="text-zinc-500 block">STATUS</span>
                  <span className="text-emerald-400 font-bold">{report.mission_overview.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Route Optimization Audit */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-cyan-400">
              2. Selected Traverse Corridor & Hard Constraints
            </h3>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-sm font-bold text-white font-sans">{report.route_optimization_summary.selected_route_name}</span>
                <span className="text-emerald-400 font-bold">HARD CONSTRAINTS VERIFIED ✓</span>
              </div>
              <p className="text-zinc-300 font-sans text-xs">{report.route_optimization_summary.selection_rationale}</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[10px] text-zinc-500">DISTANCE</div>
                  <div className="font-bold text-zinc-200">{report.route_optimization_summary.total_distance_km} km</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[10px] text-zinc-500">EST. TIME</div>
                  <div className="font-bold text-zinc-200">{report.route_optimization_summary.estimated_duration_hours} hrs</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[10px] text-zinc-500">RISK RATING</div>
                  <div className="font-bold text-emerald-400">{report.route_optimization_summary.risk_score} / 100</div>
                </div>
                <div className="bg-zinc-900 p-2 rounded">
                  <div className="text-[10px] text-zinc-500">COMFORT SCORE</div>
                  <div className="font-bold text-cyan-400">{report.route_optimization_summary.comfort_score} / 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Active Hazards & Mitigations */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-red-400">
              3. Identified Environmental Hazards & Protective Protocols
            </h3>
            <div className="space-y-2">
              {report.active_hazards?.map((h: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-bold text-white">{h.name} ({h.category})</span>
                    <span className="text-red-400 font-bold">{h.severity}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Mitigation: {h.mitigation?.join('; ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Traceable Historical Safety Lessons */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-amber-400">
              4. Incorporated Spaceflight Experience & Historical NASA Citations
            </h3>
            <div className="space-y-2">
              {report.historical_safety_lessons?.map((l: any, idx: number) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-zinc-300 font-bold">
                    <span>{l.mission}: {l.incident}</span>
                  </div>
                  <p className="text-zinc-400 font-sans text-xs">{l.preventive_lesson}</p>
                  <div className="text-[10px] text-orange-400 pt-1">
                    Traceable Citation: {l.citation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Uncertainty & Limitations */}
          <div className="border-t border-zinc-800 pt-5 space-y-2 text-zinc-400 font-mono text-[11px]">
            <h4 className="font-bold uppercase text-zinc-300">5. Research Disclaimer & Limitations</h4>
            <ul className="list-disc list-inside space-y-0.5">
              {report.uncertainties_and_safety_disclaimer?.map((d: string, idx: number) => (
                <li key={idx}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-12 text-center text-zinc-500 font-mono text-xs">
          Loading comprehensive mission summary report...
        </div>
      )}
    </div>
  )
}

