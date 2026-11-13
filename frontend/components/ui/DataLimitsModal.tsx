'use client'

import React from 'react'
import { X, ExternalLink, ShieldCheck, Database, AlertCircle, Info } from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from './SimulatedBadge'

export default function DataLimitsModal() {
  const { showDataLimits, setShowDataLimits, playClick } = useMission()

  if (!showDataLimits) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900/95 p-6 shadow-2xl glass-panel">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Data Provenance & Operational Limits</h2>
              <p className="text-xs text-zinc-400">Honesty disclosure: Verified NASA Planetary Data vs Real-time Simulations</p>
            </div>
          </div>
          <button
            onClick={() => { playClick(); setShowDataLimits(false); }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-4">
            <div className="flex items-center gap-2 mb-2 font-mono font-bold text-cyan-300">
              <SimulatedBadge type="REAL" />
              <span>Real NASA Planetary Observations</span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 pl-4 list-disc marker:text-cyan-500">
              <li><strong className="text-white">Optical Imagery:</strong> MRO HiRISE (0.25m/px) & CTX controlled Jezero mosaic.</li>
              <li><strong className="text-white">Thermal:</strong> 2001 Mars Odyssey THEMIS IR Band 9 diurnal surface temperature.</li>
              <li><strong className="text-white">Spectral:</strong> MRO CRISM targeted hyperspectral mineralogy (Fe/Mg clays, carbonates).</li>
              <li><strong className="text-white">Topography:</strong> MGS MOLA + Mars Express HRSC blended digital elevation model.</li>
              <li><strong className="text-white">Atmosphere:</strong> Perseverance MEDA pressure, ambient temp, wind, and dust Tau.</li>
              <li><strong className="text-white">Radiation:</strong> Curiosity MSL-RAD galactic cosmic ray dose rates (26.5 uSv/h baseline).</li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
            <div className="flex items-center gap-2 mb-2 font-mono font-bold text-amber-300">
              <SimulatedBadge type="SIMULATED" />
              <span>Synthetic Overlays & Simulation Mechanics</span>
            </div>
            <ul className="space-y-1.5 text-zinc-300 pl-4 list-disc marker:text-amber-500">
              <li><strong className="text-white">Contingency Events:</strong> Dust storms, solar particle spikes, oxygen leaks are synthetic scenarios.</li>
              <li><strong className="text-white">Suit Telemetry:</strong> Astronaut metabolic rates, workload watts, suit coolant loop physics models.</li>
              <li><strong className="text-white">Real-Time Traversal:</strong> Procedural rover velocity and pathing based on terrain slope friction.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-zinc-200">
              <Info className="w-4 h-4 text-orange-400" />
              <span>Attribution & Usage</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              NASA imagery and data products are used in accordance with the NASA Media Usage Guidelines. Credits: NASA / JPL-Caltech / University of Arizona / MSSS / JHU-APL / SwRI / CAB / ESA.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => { playClick(); setShowDataLimits(false); }}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  )
}
