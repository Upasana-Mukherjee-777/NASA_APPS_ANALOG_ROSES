'use client'

import React, { useState, useEffect } from 'react'
import {
  Database,
  Search,
  Filter,
  Layers,
  BookOpen,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { getNASALayers } from '@/services/api'

export default function NASADataExplorerPage() {
  const [layers, setLayers] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedLayer, setSelectedLayer] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await getNASALayers()
        setLayers(resp.layers || [])
        if (resp.layers && resp.layers.length > 0) setSelectedLayer(resp.layers[0])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  const filteredLayers = layers.filter(layer => {
    const matchesCat = activeCategory === 'ALL' || layer.category === activeCategory
    const matchesQuery = !searchQuery ||
      layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      layer.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      layer.spacecraft.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesQuery
  })

  const CATEGORIES = ['ALL', 'OPTICAL', 'THERMAL', 'SPECTRAL', 'TOPOGRAPHIC', 'GEOPHYSICAL', 'ATMOSPHERIC', 'RADIATION', 'CHEMICAL']

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 4: MULTIMODAL NASA DATA CATALOGUE
            </span>
            <span className="text-xs text-zinc-400 font-mono">• 8 Verified Scientific Categories</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            NASA Planetary Data Explorer
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Transparent provenance, instrument parameters, spatial resolutions, and documented limitations across all 8 data layers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-mono font-bold text-emerald-400 border border-emerald-800">
            OBSERVED
          </span>
          <span className="rounded-full bg-cyan-950 px-3 py-1 text-xs font-mono font-bold text-cyan-400 border border-cyan-800">
            DERIVED
          </span>
          <span className="rounded-full bg-amber-950 px-3 py-1 text-xs font-mono font-bold text-amber-400 border border-amber-800">
            SIMULATED
          </span>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search datasets by mission, spacecraft, instrument (e.g. 'HiRISE', 'THEMIS', 'CRISM', 'MOLA', 'RAD')..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-orange-500 focus:outline-none font-mono"
          />
        </div>

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
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Datasets List vs Metadata Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left List (1 col) */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Available NASA Datasets ({filteredLayers.length})
          </div>

          <div className="space-y-3">
            {filteredLayers.map((layer) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-2 ${
                  selectedLayer?.id === layer.id
                    ? 'border-orange-500 bg-orange-950/20 shadow'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-white">{layer.category}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    layer.provenance === 'OBSERVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    layer.provenance === 'DERIVED' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                    'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {layer.provenance}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1">{layer.name}</h4>
                <div className="text-[11px] font-mono text-zinc-400">
                  {layer.instrument} • {layer.spacecraft}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Detail: Dataset Metadata Inspector (2 cols) */}
        <div className="lg:col-span-2">
          {selectedLayer ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="space-y-2 border-b border-zinc-800 pb-5">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-orange-950 px-2 py-0.5 text-xs font-mono font-bold text-orange-400 border border-orange-800">
                    CATEGORY: {selectedLayer.category}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                    selectedLayer.provenance === 'OBSERVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  }`}>
                    {selectedLayer.provenance}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{selectedLayer.name}</h2>
                <div className="text-xs font-mono text-zinc-400">
                  Originating Agency: <strong className="text-zinc-200">{selectedLayer.agency}</strong>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Instrument</div>
                  <div className="text-zinc-200 font-bold">{selectedLayer.instrument}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Spacecraft / Mission</div>
                  <div className="text-zinc-200 font-bold">{selectedLayer.spacecraft}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Acquisition Window</div>
                  <div className="text-zinc-200 font-bold">{selectedLayer.acquisition_date}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Spatial Resolution</div>
                  <div className="text-orange-400 font-bold">{selectedLayer.resolution}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Measurement Units</div>
                  <div className="text-zinc-200 font-bold">{selectedLayer.units}</div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase">Spatial Coverage</div>
                  <div className="text-zinc-200 font-bold">{selectedLayer.spatial_coverage}</div>
                </div>
              </div>

              {/* Processing Method */}
              <div className="space-y-1.5 text-xs">
                <h4 className="font-semibold text-zinc-200 uppercase font-mono tracking-wider text-[11px]">
                  USGS / NASA Processing Methodology
                </h4>
                <p className="text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  {selectedLayer.processing_method}
                </p>
              </div>

              {/* Scientific Data Limitations (Mandatory Requirement) */}
              <div className="space-y-1.5 text-xs">
                <h4 className="font-semibold text-amber-300 uppercase font-mono tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Documented Scientific Limitations & Sensor Uncertainties</span>
                </h4>
                <p className="text-zinc-300 leading-relaxed bg-amber-950/20 p-3.5 rounded-xl border border-amber-900/40">
                  {selectedLayer.data_limitations}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-12 text-center text-zinc-500 font-mono text-xs">
              Select a dataset from the left panel to inspect scientific provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
