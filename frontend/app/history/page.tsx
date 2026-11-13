'use client'

import React, { useState, useEffect } from 'react'
import {
  History,
  Search,
  ExternalLink,
  Shield,
  AlertTriangle,
  Wind,
  Flame,
  Activity,
  Droplets,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { getHistoricalIncidents, searchHistoricalIncidents } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

interface HistoricalIncident {
  id: string
  incident_code: string
  mission: string
  date_occurred: string
  category: string
  title: string
  image: string
  description: string
  root_cause: string
  preventive_lesson: string
  source_citation: string
  source_url: string
  transferability_limitations: string
}

const HISTORICAL_DATA: HistoricalIncident[] = [
  {
    id: 'hist-1',
    incident_code: 'ISS-EVA-23',
    mission: 'ISS Expedition 36 (EVA 23)',
    date_occurred: '2013-07-16',
    category: 'WATER',
    title: 'EMU Helmet Water Intrusion (Luca Parmitano)',
    image: '/assets/nasa/PIA23962.jpg',
    description: '1.5 liters of coolant water escaped into pressurized helmet, choking comms and vision.',
    root_cause: 'Blockage of primary relief valve in LCVG sublimator water loop due to silicate contamination.',
    preventive_lesson: 'Spacesuit cooling fluid loops require hydrophobic fail-safe barriers and moisture sensors.',
    source_citation: 'NASA MIB Report, Dec 2013',
    source_url: 'https://www.nasa.gov/news-release/nasa-releases-suit-water-intrusion-mishap-investigation-report/',
    transferability_limitations: 'Under 0.38g Mars gravity, leaked water pools downward rather than clinging to facial orifices as in microgravity, but cooling collapse causes acute hypothermia.',
  },
  {
    id: 'hist-2',
    incident_code: 'APOLLO-15',
    mission: 'Apollo 15 (Hadley Rille)',
    date_occurred: '1971-08-01',
    category: 'FATIGUE',
    title: 'Hadley Delta Cardiac Fatigue & Arrhythmia',
    image: '/assets/nasa/PIA24596.jpg',
    description: 'Astronauts Scott & Irwin experienced severe exhaustion and cardiac arrhythmia on 15° slopes.',
    root_cause: 'Workload > 450 Watts compounded by spacesuit joint stiffness and inadequate rest intervals.',
    preventive_lesson: 'EVA routes must limit cardiovascular workload and mandate 10-minute rest stops on slopes > 8°.',
    source_citation: 'Biomedical Results of Apollo, NASA SP-368',
    source_url: 'https://history.nasa.gov/SP-368/sp368.htm',
    transferability_limitations: 'Mars gravity (0.38g) is more than double the Moon (0.16g). A 125kg suit causes greater musculoskeletal strain; Apollo fatigue bounds are minimums for Mars.',
  },
  {
    id: 'hist-3',
    incident_code: 'APOLLO-17',
    mission: 'Apollo 17 (Taurus-Littrow)',
    date_occurred: '1972-12-12',
    category: 'DUST',
    title: 'Lunar Dust Abrasion & Radiator Fouling',
    image: '/assets/nasa/PIA26379.jpg',
    description: 'Loss of LRV rear fender showered crew in jagged abrasive regolith, jamming wrist bearings.',
    root_cause: 'Extremely abrasive, electrostatically charged silicate particles adhering to mechanical seals.',
    preventive_lesson: 'Mandate electrostatic repulsion seals and sacrificial gaiters on all mechanical bearings.',
    source_citation: 'NASA SP-315 Preliminary Science Report',
    source_url: 'https://www.nasa.gov/history/alsj/a17/a17.html',
    transferability_limitations: 'Martian dust is chemically distinct (rich in ferric oxide and perchlorates) and weathered by atmospheric winds, but fine (<3 microns) and toxic to lungs.',
  },
  {
    id: 'hist-4',
    incident_code: 'APOLLO-16',
    mission: 'Apollo 16 (Descartes)',
    date_occurred: '1972-04-21',
    category: 'RADIATION',
    title: 'Solar Particle Event (SPE) Near Miss',
    image: '/assets/nasa/PIA25322.jpg',
    description: 'Mission narrowly preceded the massive August 1972 solar proton event.',
    root_cause: 'Unpredictable coronal mass ejection capable of delivering lethal 4+ Sievert unshielded doses.',
    preventive_lesson: 'Surface shelters require regolith overburden (>1m) and active space-weather telemetry alarms.',
    source_citation: 'NASA Space Radiation Analysis Group',
    source_url: 'https://history.nasa.gov/SP-368/s4ch2.htm',
    transferability_limitations: 'Mars thin atmosphere provides minimal radiation shielding (~20 g/cm2 column depth). Surface astronauts receive 2.5x more dose than on Earth surface.',
  },
]

const CATEGORY_CHIPS = [
  { id: 'ALL', label: 'All Incidents', icon: History },
  { id: 'WATER', label: 'Coolant / Water', icon: Droplets },
  { id: 'FATIGUE', label: 'Crew Fatigue', icon: Activity },
  { id: 'DUST', label: 'Dust Abrasion', icon: Wind },
  { id: 'RADIATION', label: 'Radiation', icon: Shield },
]

export default function SafetyArchivePage() {
  const { playClick, playChime } = useMission()
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [selectedIncident, setSelectedIncident] = useState<HistoricalIncident>(HISTORICAL_DATA[0])

  const filteredIncidents = HISTORICAL_DATA.filter(
    i => activeCategory === 'ALL' || i.category === activeCategory
  )

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-6xl mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <SimulatedBadge type="REAL" />
          <span className="text-xs font-mono font-bold text-zinc-400">NASA MISHAP INVESTIGATION ARCHIVE</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Safety Intelligence & Past Lessons
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Documented spaceflight mishaps informing Mars-Guard autonomous safety envelopes.
        </p>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_CHIPS.map(chip => {
            const Icon = chip.icon
            const isSelected = activeCategory === chip.id
            return (
              <button
                key={chip.id}
                onClick={() => {
                  playClick()
                  setActiveCategory(chip.id)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all touch-react whitespace-nowrap ${
                  isSelected
                    ? 'border-orange-500 bg-orange-950/60 text-white shadow-lg'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Story Card */}
      <div className="my-4 rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-6 shadow-2xl glass-panel animate-in fade-in">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Real NASA Mission Photo */}
          <div className="relative w-full md:w-64 h-48 rounded-2xl overflow-hidden border border-zinc-700 shrink-0">
            <img
              src={selectedIncident.image}
              alt={selectedIncident.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-zinc-700 text-[10px] font-mono font-bold text-orange-400">
              {selectedIncident.incident_code}
            </div>
            <div className="absolute bottom-2 left-2 right-2 text-[9px] font-mono text-zinc-300 bg-black/80 p-1 rounded truncate">
              {selectedIncident.mission} ({selectedIncident.date_occurred})
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {selectedIncident.title}
              </h2>
              <p className="text-xs text-zinc-300 font-sans mt-1 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {/* Root Cause & Lesson */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] font-mono font-bold text-red-400 block mb-1">
                  ROOT CAUSE
                </span>
                <p className="text-zinc-300 text-[11px] leading-snug">{selectedIncident.root_cause}</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1">
                  PREVENTIVE LESSON
                </span>
                <p className="text-zinc-300 text-[11px] leading-snug">{selectedIncident.preventive_lesson}</p>
              </div>
            </div>

            {/* Limits for Mars Transferability Badge */}
            <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 text-xs">
              <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                LIMITS FOR MARS TRANSFERABILITY
              </span>
              <p className="text-[11px] text-zinc-300 leading-snug">
                {selectedIncident.transferability_limitations}
              </p>
            </div>

            {/* NASA Source Document Link */}
            <div className="pt-1 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 truncate">{selectedIncident.source_citation}</span>
              <a
                href={selectedIncident.source_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-orange-400 hover:underline shrink-0"
              >
                <span>Read Official Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Film Strip of Historical Incidents */}
      <div>
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block mb-2">
          HISTORICAL FILM STRIP TIMELINE:
        </span>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {filteredIncidents.map(inc => {
            const isSelected = inc.id === selectedIncident.id
            return (
              <div
                key={inc.id}
                onClick={() => {
                  playClick()
                  setSelectedIncident(inc)
                }}
                className={`relative flex-shrink-0 w-52 h-28 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all touch-react ${
                  isSelected
                    ? 'border-orange-500 scale-102 shadow-xl shadow-orange-950/40 ring-1 ring-orange-500/50'
                    : 'border-white/10 opacity-70 hover:opacity-100 hover:border-zinc-700'
                }`}
              >
                <img src={inc.image} alt={inc.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2.5 flex flex-col justify-end">
                  <span className="text-[9px] font-mono font-bold text-orange-400">{inc.incident_code}</span>
                  <span className="text-xs font-bold text-white truncate">{inc.title}</span>
                  <span className="text-[9px] font-mono text-zinc-400">{inc.date_occurred}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
