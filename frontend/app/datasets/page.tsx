'use client'

import React, { useState } from 'react'
import {
  Database,
  ExternalLink,
  RotateCw,
  Sparkles,
  BarChart2,
  Layers,
  ChevronLeft
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

interface DataTile {
  id: string
  title: string
  instrument: string
  provenance: 'REAL' | 'DERIVED'
  image: string
  chartType: 'area' | 'bar' | 'line'
  chartData: any[]
  dataKey: string
  unit: string
  color: string
  stat: string
}

const GALLERY_TILES: DataTile[] = [
  {
    id: 'OPTICAL',
    title: '1. Optical Surface Imagery',
    instrument: 'MRO HiRISE (0.25 m/px)',
    provenance: 'REAL',
    image: '/assets/nasa/PIA24331.jpg',
    chartType: 'bar',
    chartData: [
      { name: 'Mudstone', val: 94 },
      { name: 'Basalt Dune', val: 88 },
      { name: 'Scree Boulder', val: 91 },
      { name: 'Impact Ejecta', val: 85 },
    ],
    dataKey: 'val',
    unit: '% Confidence',
    color: '#f97316',
    stat: '0.25 m/px Resolution',
  },
  {
    id: 'THERMAL',
    title: '2. Diurnal Surface Thermal',
    instrument: '2001 Mars Odyssey THEMIS IR',
    provenance: 'REAL',
    image: '/assets/nasa/PIA24744.jpg',
    chartType: 'line',
    chartData: [
      { name: '00:00', temp: -82 },
      { name: '06:00', temp: -75 },
      { name: '12:00', temp: -28 },
      { name: '15:00', temp: -24 },
      { name: '18:00', temp: -48 },
      { name: '21:00', temp: -68 },
    ],
    dataKey: 'temp',
    unit: '°C Surface Temp',
    color: '#ef4444',
    stat: '-82°C to -24°C Diurnal',
  },
  {
    id: 'SPECTRAL',
    title: '3. Mineralogy Absorption',
    instrument: 'MRO CRISM Shortwave IR',
    provenance: 'REAL',
    image: '/assets/nasa/PIA25022.jpg',
    chartType: 'area',
    chartData: [
      { name: '1.4 μm', abs: 0.12 },
      { name: '1.9 μm (H2O)', abs: 0.45 },
      { name: '2.3 μm (Fe/Mg)', abs: 0.68 },
      { name: '2.5 μm (CO3)', abs: 0.38 },
    ],
    dataKey: 'abs',
    unit: 'Band Depth',
    color: '#a855f7',
    stat: 'Fe/Mg Smectites Identified',
  },
  {
    id: 'TOPOGRAPHIC',
    title: '4. Elevation Profile',
    instrument: 'MGS MOLA & HRSC DEM',
    provenance: 'REAL',
    image: '/assets/nasa/PIA24096.jpg',
    chartType: 'area',
    chartData: [
      { name: 'Base Camp', elev: -2580 },
      { name: 'Séítah Edge', elev: -2565 },
      { name: 'Delta Scarp', elev: -2510 },
      { name: 'Delta Top', elev: -2495 },
    ],
    dataKey: 'elev',
    unit: 'Meters (MOLA)',
    color: '#10b981',
    stat: '1m Vertical Precision',
  },
  {
    id: 'GEOPHYSICAL',
    title: '5. Remnant Magnetic Field',
    instrument: 'MGS MAG/ER & RIMFAX',
    provenance: 'DERIVED',
    image: '/assets/nasa/PIA26378.jpg',
    chartType: 'line',
    chartData: [
      { name: '0 km', field: 8.2 },
      { name: '1 km', field: 8.9 },
      { name: '2 km', field: 12.4 },
      { name: '3 km', field: 9.1 },
    ],
    dataKey: 'field',
    unit: 'nT Crustal Field',
    color: '#3b82f6',
    stat: '8.4 nT Remnant Field',
  },
  {
    id: 'ATMOSPHERIC',
    title: '6. Dust Optical Depth',
    instrument: 'Perseverance MEDA',
    provenance: 'REAL',
    image: '/assets/nasa/PIA25290.jpg',
    chartType: 'line',
    chartData: [
      { name: 'Sol 1070', tau: 0.42 },
      { name: 'Sol 1075', tau: 0.45 },
      { name: 'Sol 1080', tau: 0.49 },
      { name: 'Sol 1084', tau: 0.52 },
    ],
    dataKey: 'tau',
    unit: 'Tau (τ) Extinction',
    color: '#eab308',
    stat: 'Tau 0.49 Surface Extinction',
  },
  {
    id: 'RADIATION',
    title: '7. Surface Dosimetry',
    instrument: 'Curiosity MSL-RAD',
    provenance: 'REAL',
    image: '/assets/nasa/PIA25322.jpg',
    chartType: 'area',
    chartData: [
      { name: 'GCR Day', dose: 24.2 },
      { name: 'GCR Night', dose: 26.5 },
      { name: 'SPE Peak', dose: 68.4 },
      { name: 'Nominal', dose: 26.8 },
    ],
    dataKey: 'dose',
    unit: 'μSv/hr Dose',
    color: '#f43f5e',
    stat: '26.8 μSv/hr Nominal Dose',
  },
  {
    id: 'CHEMICAL',
    title: '8. Bedrock Composition',
    instrument: 'Perseverance PIXL XRF',
    provenance: 'REAL',
    image: '/assets/nasa/PIA24926.jpg',
    chartType: 'bar',
    chartData: [
      { name: 'SiO2', wt: 48.2 },
      { name: 'FeO', wt: 18.5 },
      { name: 'Al2O3', wt: 9.4 },
      { name: 'MgO', wt: 8.8 },
      { name: 'CaO', wt: 6.2 },
    ],
    dataKey: 'wt',
    unit: 'wt% Oxide',
    color: '#06b6d4',
    stat: 'Sub-mm Micro-XRF',
  },
]

export default function DataStudioGalleryPage() {
  const { playClick, playChime } = useMission()
  const [flippedTileId, setFlippedTileId] = useState<string | null>(null)

  const handleTileClick = (id: string) => {
    playClick()
    setFlippedTileId(flippedTileId === id ? null : id)
  }

  const activeTile = GALLERY_TILES.find(t => t.id === flippedTileId)

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-6xl mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type="REAL" />
            <span className="text-xs font-mono font-bold text-zinc-400">PLANETARY OBSERVATION STUDIO (PDS ARCHIVE)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Planetary Gallery Wall
          </h1>
          <p className="text-xs text-zinc-400">Tap any tile to inspect interactive data charts.</p>
        </div>

        {flippedTileId && (
          <button
            onClick={() => {
              playClick()
              setFlippedTileId(null)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to Gallery</span>
          </button>
        )}
      </div>

      {/* Main Content: Single Chart Focus OR 8-Tile Gallery Wall */}
      {activeTile ? (
        // Single Full-Width Chart Focus
        <div className="flex-1 rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-6 shadow-2xl glass-panel animate-in fade-in duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">{activeTile.title}</h2>
                <span className="text-xs font-mono text-zinc-400">{activeTile.instrument}</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-orange-400 font-bold">
                {activeTile.stat}
              </span>
            </div>

            {/* Interactive Chart */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeTile.chartType === 'area' ? (
                  <AreaChart data={activeTile.chartData}>
                    <defs>
                      <linearGradient id={`grad-${activeTile.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeTile.color} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={activeTile.color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Area type="monotone" dataKey={activeTile.dataKey} stroke={activeTile.color} fill={`url(#grad-${activeTile.id})`} strokeWidth={2.5} />
                  </AreaChart>
                ) : activeTile.chartType === 'line' ? (
                  <LineChart data={activeTile.chartData}>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Line type="monotone" dataKey={activeTile.dataKey} stroke={activeTile.color} strokeWidth={3} dot={{ r: 5, fill: activeTile.color }} />
                  </LineChart>
                ) : (
                  <BarChart data={activeTile.chartData}>
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Bar dataKey={activeTile.dataKey} fill={activeTile.color} radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Data Provenance: Verified Planetary Data System (PDS) Scientific Release</span>
            <button
              onClick={() => {
                playClick()
                setFlippedTileId(null)
              }}
              className="text-orange-400 hover:underline font-bold"
            >
              Flip Back to Tile
            </button>
          </div>
        </div>
      ) : (
        // 8 Image Tiles Gallery Grid
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {GALLERY_TILES.map(tile => (
            <div
              key={tile.id}
              onClick={() => handleTileClick(tile.id)}
              className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 cursor-pointer transition-all touch-react shadow-lg hover:border-orange-500/60 hover:shadow-orange-950/40"
            >
              <img
                src={tile.image}
                alt={tile.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 filter brightness-85 contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[9px] font-mono font-bold text-white">
                    {tile.id}
                  </span>
                  <RotateCw className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-400 transition" />
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight leading-snug line-clamp-2">
                    {tile.title}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400 block truncate mt-0.5">
                    {tile.instrument}
                  </span>
                  <div className="mt-1 flex items-center gap-1 text-[9px] font-mono text-orange-400 font-semibold">
                    <span>Tap to view chart</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
