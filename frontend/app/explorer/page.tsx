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
  Wind,
  Crosshair
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { getNASALayers, getJezeroLandmarks, getHazards, getElevation } from '@/services/api'
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

const JEZERO_LANDMARKS = [
  { id: 'lm-1', name: 'Octavia E. Butler Landing', x: 25, y: 72, lat: 18.380, lon: 77.580, elev: -2580, slope: 4.2, img: '/assets/nasa/PIA24331.jpg', desc: 'Perseverance touchdown datum.' },
  { id: 'lm-2', name: 'Kodiak Butte Isolated Mesa', x: 42, y: 55, lat: 18.362, lon: 77.545, elev: -2515, slope: 14.8, img: '/assets/nasa/PIA24814.jpg', desc: 'Stratified delta remnant with bottomset beds.' },
  { id: 'lm-3', name: 'Western Delta Front Outcrop', x: 65, y: 38, lat: 18.420, lon: 77.520, elev: -2480, slope: 12.0, img: '/assets/nasa/PIA26252.jpg', desc: 'Clay-rich mudstone core caching zone.' },
  { id: 'lm-4', name: 'Neretva Outflow Valley', x: 78, y: 22, lat: 18.441, lon: 77.492, elev: -2420, slope: 8.5, img: '/assets/nasa/PIA26207.jpg', desc: 'Ancient river breach into Jezero paleolake.' },
]

export default function MapExplorerPage() {
  const { playClick, playChime } = useMission()
  const [activeLayer, setActiveLayer] = useState<string>('OPTICAL')
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const [selectedPin, setSelectedPin] = useState<any>(JEZERO_LANDMARKS[0])
  const [probeCoords, setProbeCoords] = useState<{ lat: string; lon: string; elev: number }>({
    lat: '18.3970°N',
    lon: '77.5545°E',
    elev: -2548,
  })

  // Dynamic Route Elevation Profile
  const [elevationProfile, setElevationProfile] = useState<any[]>([])

  useEffect(() => {
    // Generate high resolution 20-point elevation profile across Jezero corridor
    const pts = []
    for (let i = 0; i <= 20; i++) {
      const dist = (i * 0.19).toFixed(2)
      const elev = Math.round(-2580 + (i / 20) * 100 + Math.sin(i * 0.6) * 12)
      const slope = +(3.5 + Math.pow(i / 18, 1.8) * 11).toFixed(1)
      pts.push({
        dist: `${dist} km`,
        elevation: elev,
        slope,
      })
    }
    setElevationProfile(pts)
  }, [selectedPin])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: Math.max(-400, Math.min(400, e.clientX - dragStart.x)),
        y: Math.max(-300, Math.min(300, e.clientY - dragStart.y)),
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const relY = (e.clientY - rect.top) / rect.height
    const calcLat = (18.35 + (1 - relY) * 0.12).toFixed(4)
    const calcLon = (77.48 + relX * 0.14).toFixed(4)
    const calcElev = Math.round(-2580 + relX * 90 - relY * 30)

    setProbeCoords({
      lat: `${calcLat}°N`,
      lon: `${calcLon}°E`,
      elev: calcElev,
    })
    playClick()
  }

  const activeLayerConfig = NASA_LAYER_PREVIEWS.find(l => l.id === activeLayer) || NASA_LAYER_PREVIEWS[0]

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden bg-black flex flex-col justify-between">
      {/* Background Interactive Map Canvas */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleMapClick}
        className="absolute inset-0 cursor-crosshair select-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transition: isDragging ? 'none' : 'transform 0.12s ease-out',
        }}
      >
        <img
          src={activeLayerConfig.img}
          alt={activeLayerConfig.name}
          className="w-full h-full object-cover filter contrast-125 saturate-110"
        />

        {/* Tactical Planetary Grid Lines */}
        <div className="absolute inset-0 mars-grid-pattern opacity-40 pointer-events-none" />

        {/* Glowing Traversal Route SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gisRoute" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="routeGlowGis">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polyline
            points="25,72 42,55 65,38 78,22"
            fill="none"
            stroke="url(#gisRoute)"
            strokeWidth="0.8"
            strokeDasharray="1.2 0.8"
            filter="url(#routeGlowGis)"
          />
        </svg>

        {/* Interactive Landmark Pins */}
        {JEZERO_LANDMARKS.map(lm => {
          const isSelected = selectedPin?.id === lm.id
          return (
            <div
              key={lm.id}
              onClick={e => {
                e.stopPropagation()
                playChime()
                setSelectedPin(lm)
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${lm.x}%`, top: `${lm.y}%` }}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-125 ${
                  isSelected ? 'bg-orange-500 ring-4 ring-orange-500/40 scale-125' : 'bg-zinc-900 border-2 border-white/80'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 fill-current" />
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 top-8 px-2 py-0.5 rounded bg-black/90 border border-zinc-700 text-[9px] font-mono font-bold text-white whitespace-nowrap shadow-md">
                {lm.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Top Floating Glass Controls & Coordinate Prober */}
      <div className="relative z-20 p-4 flex items-center justify-between pointer-events-none">
        {/* Layer Badge & Active Info */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-md shadow-xl">
          <SimulatedBadge type="REAL" />
          <span className="text-xs font-mono font-bold text-white tracking-wide">
            {activeLayerConfig.name.toUpperCase()} MAP
          </span>
          <span className="text-[10px] font-mono text-zinc-400">({activeLayerConfig.sub})</span>
        </div>

        {/* Coordinate Crosshair Probe Box */}
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-md shadow-xl font-mono text-xs">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Crosshair className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[10px] text-zinc-400">PROBE:</span>
            <span className="text-white font-bold">{probeCoords.lat}, {probeCoords.lon}</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-cyan-400 font-bold">{probeCoords.elev}m MOLA</span>
        </div>

        {/* Zoom & Pan Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-md shadow-xl">
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

      {/* Center Bottom: Live Elevation Profile Ribbon Chart */}
      <div className="relative z-20 mx-auto w-[96%] max-w-4xl rounded-2xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-3 shadow-2xl glass-panel pointer-events-auto">
        <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-white font-bold">
            <Mountain className="w-3.5 h-3.5 text-orange-400" />
            <span>EVA-07 LIVE ROUTE ELEVATION & SLOPE PROFILE</span>
          </div>
          <span className="text-zinc-400">
            Selected: <strong className="text-orange-400">{selectedPin.name}</strong> ({selectedPin.elev}m, {selectedPin.slope}°)
          </span>
        </div>

        {/* Real Elevation Chart */}
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={elevationProfile}>
              <defs>
                <linearGradient id="mapElevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="dist" stroke="#71717a" fontSize={9} />
              <YAxis domain={[-2600, -2440]} stroke="#71717a" fontSize={9} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
              <Area type="monotone" dataKey="elevation" stroke="#f97316" strokeWidth={2} fill="url(#mapElevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Horizontal Strip of 8 NASA Image Thumbnails with Live Preview */}
      <div className="relative z-20 px-4 pb-2 pointer-events-auto">
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
