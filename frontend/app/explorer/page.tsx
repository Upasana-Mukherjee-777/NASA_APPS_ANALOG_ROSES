'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Layers,
  Compass,
  MapPin,
  Shield,
  Eye,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  ChevronUp,
  ChevronDown,
  Navigation,
  Info,
  Sparkles,
  Mountain,
  Flame,
  Radio,
  Wind
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { getNASALayers, getJezeroLandmarks, getHazards, createHazard, deleteHazard } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

const NASA_LAYER_PREVIEWS = [
  { id: 'OPTICAL', name: 'Optical', sub: 'HiRISE 0.25m/px', img: '/assets/nasa/PIA24331.jpg', color: 'border-orange-500' },
  { id: 'THERMAL', name: 'Thermal', sub: 'THEMIS Diurnal IR', img: '/assets/nasa/PIA24744.jpg', color: 'border-red-500' },
  { id: 'SPECTRAL', name: 'Spectral', sub: 'CRISM Smectite', img: '/assets/nasa/PIA25022.jpg', color: 'border-purple-500' },
  { id: 'TOPOGRAPHIC', name: 'Topographic', sub: 'MOLA DEM & Slopes', img: '/assets/nasa/PIA24096.jpg', color: 'border-emerald-500' },
  { id: 'GEOPHYSICAL', name: 'Geophysical', sub: 'Crustal Field', img: '/assets/nasa/PIA26378.jpg', color: 'border-blue-500' },
  { id: 'ATMOSPHERIC', name: 'Atmospheric', sub: 'MEDA Dust Tau', img: '/assets/nasa/PIA25290.jpg', color: 'border-amber-500' },
  { id: 'RADIATION', name: 'Radiation', sub: 'MSL-RAD GCR Flux', img: '/assets/nasa/PIA25322.jpg', color: 'border-rose-500' },
  { id: 'CHEMICAL', name: 'Chemical', sub: 'PIXL Elemental Map', img: '/assets/nasa/PIA24926.jpg', color: 'border-cyan-500' },
]

export default function MapExplorerPage() {
  const { playClick, playChime } = useMission()
  const [activeLayer, setActiveLayer] = useState<string>('OPTICAL')
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [landmarks, setLandmarks] = useState<any[]>([])
  const [hazards, setHazards] = useState<any[]>([])
  const [selectedPin, setSelectedPin] = useState<any>(null)
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  // Route drawing & live ribbon
  const [drawnPoints, setDrawnPoints] = useState<{ x: number; y: number }[]>([
    { x: 180, y: 380 },
    { x: 320, y: 310 },
    { x: 480, y: 260 },
    { x: 620, y: 190 },
  ])
  const [elevationRibbon, setElevationRibbon] = useState<any[]>([])

  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const lmData = await getJezeroLandmarks()
      if (lmData) {
        const list = Object.entries(lmData).map(([key, val]: [string, any]) => ({
          id: key,
          ...val,
        }))
        setLandmarks(list)
        if (list.length > 0) {
          setSelectedPin(list[0])
        }
      }
      const hData = await getHazards()
      if (hData && hData.length > 0) {
        setHazards(hData)
      } else {
        setHazards([
          { id: 'h-1', name: 'Delta Scarp Scree', severity: 'HIGH', lat: 18.412, lon: 77.528, slope: '19.4°', risk: 'HIGH', desc: 'Loose boulder scree hazard with 25m standoff limit.' },
          { id: 'h-2', name: 'Séítah Basaltic Dunes', severity: 'MEDIUM', lat: 18.391, lon: 77.618, slope: '11.2°', risk: 'MEDIUM', desc: 'Fine unconsolidated regolith; slip risk.' },
        ])
      }
    } catch (e) {}
  }

  // Generate live elevation profile along route
  useEffect(() => {
    const profile = []
    for (let i = 0; i < 20; i++) {
      const dist = (i * 0.18).toFixed(2)
      const elev = Math.round(-2560 + i * 4.8 + Math.sin(i * 0.8) * 9)
      const slope = +(3.2 + (i / 19) * 8.5).toFixed(1)
      profile.push({ dist: `${dist} km`, elevation: elev, slope })
    }
    setElevationRibbon(profile)
  }, [drawnPoints])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: Math.max(-300, Math.min(300, e.clientX - dragStart.x)),
        y: Math.max(-250, Math.min(250, e.clientY - dragStart.y)),
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const activeLayerConfig = NASA_LAYER_PREVIEWS.find(l => l.id === activeLayer) || NASA_LAYER_PREVIEWS[0]

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden bg-black flex flex-col justify-between">
      {/* Background NASA Satellite Layer with Smooth Crossfade */}
      <div
        ref={mapRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
      >
        <img
          src={activeLayerConfig.img}
          alt={activeLayerConfig.name}
          className="w-full h-full object-cover opacity-75 filter contrast-125 saturate-110"
        />

        {/* Mars Grid Coordinate Overlay */}
        <div className="absolute inset-0 mars-grid-pattern opacity-40 pointer-events-none" />

        {/* Glowing Animated Route Path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polyline
            points={drawnPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="8 6"
            filter="url(#glow)"
            className="animate-pulse"
          />
        </svg>

        {/* Landmarks Markers */}
        {landmarks.map((lm, idx) => (
          <div
            key={lm.id || idx}
            onClick={() => {
              playClick()
              setSelectedPin({
                name: lm.name || 'Jezero Landmark',
                slope: `${lm.slope || '6.5'}°`,
                risk: 'LOW (0.18)',
                elevation: `${lm.elevation_m || -2548} m`,
                image: NASA_LAYER_PREVIEWS[idx % NASA_LAYER_PREVIEWS.length].img,
                desc: lm.description || 'Target rock formation surveyed by Perseverance.',
              })
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${35 + (idx * 16) % 55}%`,
              top: `${25 + (idx * 18) % 50}%`,
            }}
          >
            <div className="w-8 h-8 rounded-full bg-orange-600/80 border-2 border-white flex items-center justify-center text-white shadow-lg group-hover:scale-125 transition">
              <MapPin className="w-4 h-4 fill-current" />
            </div>
            <span className="absolute left-1/2 -translate-x-1/2 top-9 px-2 py-0.5 rounded bg-black/85 border border-zinc-700 text-[10px] font-mono font-bold text-white whitespace-nowrap shadow-md">
              {lm.name}
            </span>
          </div>
        ))}
      </div>

      {/* Top Floating Glass Controls */}
      <div className="relative z-10 p-4 flex items-center justify-between pointer-events-none">
        {/* Active Layer Pill */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-xl">
          <SimulatedBadge type="REAL" />
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            {activeLayerConfig.name.toUpperCase()} LAYER
          </span>
          <span className="text-[10px] font-mono text-zinc-400">({activeLayerConfig.sub})</span>
        </div>

        {/* Zoom & Pan Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-xl">
          <button
            onClick={() => { playClick(); setZoom(z => Math.min(2.5, z + 0.25)); }}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => { playClick(); setZoom(z => Math.max(0.75, z - 0.25)); }}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { playClick(); setPan({ x: 0, y: 0 }); setZoom(1.0); }}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="Reset Pan"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Point Slim Bottom Sheet (<40 words limit) */}
      {selectedPin && (
        <div className="relative z-20 mx-auto w-[94%] max-w-xl rounded-2xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <img
              src={selectedPin.image}
              alt={selectedPin.name}
              className="w-16 h-16 rounded-xl object-cover border border-zinc-700 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white truncate">{selectedPin.name}</h3>
                <button
                  onClick={() => setDetailsExpanded(!detailsExpanded)}
                  className="text-xs text-orange-400 hover:underline flex items-center gap-0.5"
                >
                  <span>{detailsExpanded ? 'Less' : 'More'}</span>
                  {detailsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </button>
              </div>

              {/* 3 Key Stats: Slope, Risk, Elevation */}
              <div className="grid grid-cols-3 gap-2 mt-1.5 text-center font-mono text-[10px]">
                <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[8px]">SLOPE</span>
                  <span className="font-bold text-emerald-400">{selectedPin.slope}</span>
                </div>
                <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[8px]">RISK</span>
                  <span className="font-bold text-amber-400">{selectedPin.risk}</span>
                </div>
                <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-zinc-500 block text-[8px]">ELEVATION</span>
                  <span className="font-bold text-cyan-300">{selectedPin.elevation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Drawer */}
          {detailsExpanded && (
            <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-300 space-y-2 animate-in fade-in">
              <p className="line-clamp-2">{selectedPin.desc}</p>
              {/* Live Elevation Ribbon */}
              <div className="h-20 w-full pt-1">
                <span className="text-[10px] font-mono text-zinc-400 block mb-0.5">Route Elevation Ribbon:</span>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={elevationRibbon}>
                    <defs>
                      <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="elevation" stroke="#f97316" fill="url(#elevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Horizontal Strip of 8 NASA Image Thumbnails with Live Preview on Hover */}
      <div className="relative z-10 px-4 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar">
          {NASA_LAYER_PREVIEWS.map(layer => {
            const isSelected = activeLayer === layer.id
            return (
              <button
                key={layer.id}
                onClick={() => {
                  playClick()
                  setActiveLayer(layer.id)
                }}
                onMouseEnter={() => setHoveredLayer(layer.id)}
                onMouseLeave={() => setHoveredLayer(null)}
                className={`relative flex-shrink-0 w-28 h-16 rounded-xl overflow-hidden border-2 transition-all touch-react group ${
                  isSelected
                    ? `${layer.color} scale-105 shadow-lg`
                    : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={layer.img} alt={layer.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-1.5 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-white tracking-tight leading-none">
                    {layer.name}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 truncate">
                    {layer.sub}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
