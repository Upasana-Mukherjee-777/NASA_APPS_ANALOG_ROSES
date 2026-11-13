'use client'

import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  BookOpen,
  ShieldAlert,
  ExternalLink,
  Filter,
  CheckCircle2,
  FileText
} from 'lucide-react'
import { getHistoricalIncidents, searchHistoricalIncidents } from '@/services/api'

export default function HistoricalSafetyIntelligencePage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState<string>('ALL')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const data = await getHistoricalIncidents()
      setIncidents(data || [])
      if (data && data.length > 0) setSelectedIncident(data[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      loadAll()
      return
    }
    setLoading(true)
    try {
      const resp = await searchHistoricalIncidents(searchQuery, 6)
      setIncidents(resp.results || [])
      if (resp.results && resp.results.length > 0) setSelectedIncident(resp.results[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredIncidents = activeCategory === 'ALL'
    ? incidents
    : incidents.filter(i => i.category === activeCategory)

  const CATEGORIES = ['ALL', 'WATER_INTRUSION', 'MOBILITY_FATIGUE', 'DUST_ABRASION', 'PRESSURE_LEAK', 'TERRAIN_MOBILITY', 'THERMAL_OVERHEAT']

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 7: HISTORICAL EXPERIENCE RAG
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Documented NASA Mishap Reports</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Historical Astronaut Safety Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connecting real Apollo, Skylab, Space Shuttle, and ISS EVA mishaps with Martian operational constraints. Traceable citations only.
          </p>
        </div>

        <span className="rounded-full bg-orange-950 px-3 py-1 font-mono text-xs text-orange-400 border border-orange-800/80">
          CORE PROJECT DIFFERENTIATOR
        </span>
      </div>

      {/* Semantic Search Box */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by mission conditions: 'spacesuit cooling water leak', 'steep slope fatigue', 'dust in bearings', 'sharp rock tear'..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-orange-600 px-6 py-3 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
        >
          Semantic Match
        </button>
      </form>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-lg border transition ${
              activeCategory === cat
                ? 'border-orange-500 bg-orange-600/20 text-orange-400 font-semibold'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Grid: Incident Cards vs Detailed Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left List (1 col) */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Matching Incidents ({filteredIncidents.length})
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredIncidents.map((inc) => (
              <div
                key={inc.incident_code}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                  selectedIncident?.incident_code === inc.incident_code
                    ? 'border-orange-500 bg-orange-950/20 shadow-md'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-orange-400 font-bold">{inc.incident_code}</span>
                  <span className="text-zinc-500">{inc.date_occurred}</span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1">{inc.title}</h4>
                <div className="text-[11px] text-zinc-400 font-mono">{inc.mission} • {inc.subsystem}</div>
                <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-zinc-400">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{inc.category}</span>
                  <span className="text-cyan-400">{inc.lesson_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail (2 cols) */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 space-y-6">
              {/* Report Header */}
              <div className="space-y-2 border-b border-zinc-800 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-orange-950 px-2 py-0.5 text-xs font-mono font-bold text-orange-400 border border-orange-800">
                    {selectedIncident.incident_code}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {selectedIncident.mission} • Occurred: {selectedIncident.date_occurred}
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                    {selectedIncident.lesson_type}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{selectedIncident.title}</h2>
                <div className="text-xs font-mono text-zinc-400">
                  Subsystem: <strong className="text-zinc-200">{selectedIncident.subsystem}</strong>
                </div>
              </div>

              {/* Narrative Breakdown */}
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-zinc-200 uppercase font-mono tracking-wider text-[11px] mb-1">
                    Documented Incident Description
                  </h4>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                    {selectedIncident.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-zinc-200 uppercase font-mono tracking-wider text-[11px] mb-1">
                      Identified Root Cause
                    </h4>
                    <p className="text-zinc-400 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                      {selectedIncident.root_cause}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-200 uppercase font-mono tracking-wider text-[11px] mb-1">
                      Operational Consequences
                    </h4>
                    <p className="text-zinc-400 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                      {selectedIncident.consequences}
                    </p>
                  </div>
                </div>

                {/* Preventive Lesson */}
                <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-1.5">
                  <h4 className="font-bold text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Actionable Martian Safety Precaution & Lesson</span>
                  </h4>
                  <p className="text-zinc-300 leading-relaxed">
                    {selectedIncident.preventive_lesson}
                  </p>
                </div>

                {/* Transferability Limitations */}
                <div>
                  <h4 className="font-semibold text-zinc-400 uppercase font-mono tracking-wider text-[10px] mb-1">
                    Transferability Limitations (Engineering Analogy)
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono italic">
                    {selectedIncident.transferability_limitations}
                  </p>
                </div>

                {/* Exact NASA Citation */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center gap-2 text-zinc-400 font-bold">
                    <BookOpen className="h-4 w-4 text-orange-400" />
                    <span>Traceable NASA Source Document & Citation</span>
                  </div>
                  <div className="text-zinc-200 font-semibold">{selectedIncident.source_document}</div>
                  <div className="text-zinc-400 text-[11px]">{selectedIncident.source_citation}</div>
                  {selectedIncident.source_url && (
                    <a
                      href={selectedIncident.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-orange-400 hover:underline pt-1"
                    >
                      <span>Access Public NASA Archive Record</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-12 text-center text-zinc-500 font-mono text-xs">
              Select an incident from the left to view documented investigation findings.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

