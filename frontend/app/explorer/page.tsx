'use client'

import React, { useState, useEffect } from 'react'
import {
  Compass,
  Layers,
  MapPin,
  ShieldAlert,
  Flame,
  Radio,
  Eye,
  EyeOff,
  Crosshair,
  Info,
  Maximize2,
  Navigation,
  Activity
} from 'lucide-react'
import { getNASALayers, getJezeroLandmarks, getElevation } from '@/services/api'

export default function MartianExplorerPage() {
  const [activeMode, setActiveMode] = useState<'PLANNING' | 'FIELD' | 'CONTROL'>('PLANNING')
  const [layers, setLayers] = useState<any[]>([])
  const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({
    OPTICAL: true,
    THERMAL: true,
    SPECTRAL: true,
    TOPOGRAPHIC: true,
    GEOPHYSICAL: false,
    ATMOSPHERIC: true,
    RADIATION: true,
    CHEMICAL: true,
    HAZARDS: true,
    LANDMARKS: true,
    ROUTES: true,
    CREW_ROVER: true
  })

  const [landmarks, setLandmarks] = useState<any>({})
  const [selectedPin, setSelectedPin] = useState<any>(null)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; elevation_m: number }>({
    lat: 18.384,
    lon: 77.575,
    elevation_m: -2532
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const lData = await getNASALayers()
        setLayers(lData.layers || [])
        const lmData = await getJezeroLandmarks()
        setLandmarks(lmData || {})
      } catch (err) {
        console.error(err)
      }
    }
    loadData()
  }, [])

  const toggleLayer = (layerId: string) => {
    setLayerVisibility(prev => ({ ...prev, [layerId]: !prev[layerId] }))
  }

  // Handle map canvas click
  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const width = rect.width
    const height = rect.height

    // Map bounds: Lat 18.33 to 18.52, Lon 77.36 to 77.64
    const lat = 18.52 - (y / height) * (18.52 - 18.33)
    const lon = 77.36 + (x / width) * (77.64 - 77.36)

    try {
      const elev = await getElevation(lat, lon)
      setCursorCoords({
        lat: roundNum(lat, 4),
        lon: roundNum(lon, 4),
        elevation_m: elev.elevation_m
      })
      setSelectedPin({
        title: "Selected Map Coordinate",
        lat: roundNum(lat, 4),
        lon: roundNum(lon, 4),
        elevation_m: elev.elevation_m,
        category: "SURFACE_PROBE",
        details: "MOLA elevation calculated from Jezero basin datum."
      })
    } catch (err) {
      setCursorCoords({ lat: roundNum(lat, 4), lon: roundNum(lon, 4), elevation_m: -2510 })
    }
  }

  function roundNum(n: number, dec: number) {
    return Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Mode Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 2: PLANETARY GIS
            </span>
            <span className="text-xs text-zinc-500">• MOLA Datum (0m = 610.5 Pa)</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Interactive Martian Explorer — Jezero Crater</h1>
        </div>

        {/* 3 Map Modes Switcher */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-mono">
          <button
            onClick={() => setActiveMode('PLANNING')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeMode === 'PLANNING' ? 'bg-orange-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Mission Planning Mode
          </button>
          <button
            onClick={() => setActiveMode('FIELD')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeMode === 'FIELD' ? 'bg-orange-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Astronaut Field Mode
          </button>
          <button
            onClick={() => setActiveMode('CONTROL')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeMode === 'CONTROL' ? 'bg-orange-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Mission Control Mode
          </button>
        </div>
      </div>

      {/* Main Explorer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Canvas (3 Cols wide) */}
        <div className="lg:col-span-3 space-y-3">
          <div
            onClick={handleMapClick}
            className="relative w-full h-[580px] rounded-2xl border border-zinc-800 bg-gradient-to-br from-amber-950/20 via-zinc-950 to-stone-950 overflow-hidden cursor-crosshair shadow-2xl relative select-none"
          >
            {/* Topographic Contour Lines (SVG Simulation of Jezero Basin) */}
            <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="65%" cy="50%" rx="35%" ry="42%" fill="none" stroke="#d9532f" strokeWidth="1.2" strokeDasharray="6 4" />
              <ellipse cx="65%" cy="50%" rx="28%" ry="33%" fill="none" stroke="#d9532f" strokeWidth="1.0" />
              <ellipse cx="65%" cy="50%" rx="20%" ry="24%" fill="none" stroke="#d9532f" strokeWidth="0.8" />
              {/* Western Delta Channel Fan */}
              <path d="M 50 160 Q 200 240 380 270 Q 420 320 340 380 Z" fill="rgba(217, 83, 47, 0.08)" stroke="#ea580c" strokeWidth="1.5" />
              {/* Inflow Channel Neretva Vallis */}
              <path d="M 20 140 Q 120 190 240 230" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
            </svg>

            {/* Simulated Martian Terrain Texture / Grayscale Optical Mask */}
            {layerVisibility.OPTICAL && (
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#cc5500_1px,transparent_1px)] [background-size:16px_16px]"></div>
            )}

            {/* Thermal Overlay */}
            {layerVisibility.THERMAL && (
              <div className="absolute top-12 left-12 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>
            )}

            {/* Mineral/Spectral Highlights (Delta Smectite Clay Region) */}
            {layerVisibility.SPECTRAL && (
              <div className="absolute top-[32%] left-[28%] rounded-full bg-emerald-500/15 border border-emerald-400/40 p-4 pointer-events-none text-[10px] font-mono text-emerald-300">
                CRISM Smectite / Carbonate Strata
              </div>
            )}

            {/* Candidate Route Line (Aegis SafePath) */}
            {layerVisibility.ROUTES && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <path
                  d="M 540 310 Q 440 280 340 260 T 260 210"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                />
              </svg>
            )}

            {/* Hazards Pins */}
            {layerVisibility.HAZARDS && (
              <>
                {/* Hazard 1: Delta Scarp */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPin({
                      title: "Delta Scarp Unconsolidated Scree",
                      category: "ROCK_FALL",
                      severity: "HIGH",
                      lat: 18.4120,
                      lon: 77.5280,
                      affected_radius_m: 85,
                      details: "Loose boulder debris prone to sliding along 19° delta front escarpment. Minimum 25m standoff mandated."
                    })
                  }}
                  className="absolute top-[38%] left-[42%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                >
                  <div className="h-8 w-8 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center animate-pulse">
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="mt-1 text-[10px] font-mono font-bold text-red-400 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-red-800">
                    HAZ-001 (Scree)
                  </span>
                </div>

                {/* Hazard 2: Séítah Dunes */}
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPin({
                      title: "Séítah Basaltic Dune Sand Trap",
                      category: "DUST_TRAP",
                      severity: "MEDIUM",
                      lat: 18.3910,
                      lon: 77.6180,
                      affected_radius_m: 120,
                      details: "High wheel sinkage corridor with unconsolidated sand ripples. Engage Autonomous Traction Control."
                    })
                  }}
                  className="absolute top-[52%] left-[72%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                >
                  <div className="h-7 w-7 rounded-full bg-amber-600/30 border-2 border-amber-500 flex items-center justify-center">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <span className="mt-1 text-[10px] font-mono text-amber-400 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-amber-800">
                    HAZ-002 (Dunes)
                  </span>
                </div>
              </>
            )}

            {/* Landmarks Pins */}
            {layerVisibility.LANDMARKS && Object.entries(landmarks).map(([key, lm]: [string, any], idx) => {
              // Simple projection approximation for Jezero landmarks
              const normX = ((lm.lon - 77.36) / (77.64 - 77.36)) * 100
              const normY = ((18.52 - lm.lat) / (18.52 - 18.33)) * 100

              return (
                <div
                  key={key}
                  style={{ top: `${normY}%`, left: `${normX}%` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedPin({
                      title: lm.name,
                      category: "SCIENTIFIC_LANDMARK",
                      lat: lm.lat,
                      lon: lm.lon,
                      elevation_m: lm.elevation_m,
                      details: `Validated Jezero Crater geological formation. Elevation: ${lm.elevation_m}m.`
                    })
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
                >
                  <MapPin className="h-5 w-5 text-orange-400 group-hover:scale-125 transition" />
                  <span className="text-[9px] font-mono text-zinc-300 bg-zinc-900/90 px-1 rounded shadow">
                    {lm.name.split(' ')[0]}
                  </span>
                </div>
              )
            })}

            {/* Rover & Astronaut Positions */}
            {layerVisibility.CREW_ROVER && (
              <div className="absolute top-[54%] left-[68%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-cyan-500/40 border-2 border-cyan-400 flex items-center justify-center shadow-lg">
                  <Navigation className="h-3.5 w-3.5 text-cyan-200 rotate-45" />
                </div>
                <span className="mt-1 text-[10px] font-mono font-bold text-cyan-300 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-cyan-700">
                  Perseverance + Crew (Sarah, Mark)
                </span>
              </div>
            )}

            {/* On-Map Bottom HUD */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/85 p-3 text-xs font-mono backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px]">COORDINATES</span>
                  <div className="text-zinc-200 font-bold">{cursorCoords.lat}° N, {cursorCoords.lon}° E</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">MOLA ELEVATION</span>
                  <div className="text-orange-400 font-bold">{cursorCoords.elevation_m} m</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">MAP MODE</span>
                  <div className="text-emerald-400 font-bold">{activeMode}</div>
                </div>
              </div>
              <div className="text-zinc-400 text-[11px] hidden sm:block">
                Click anywhere on surface to probe elevation & local strata
              </div>
            </div>
          </div>

          {/* Selected Pin Details Box */}
          {selectedPin && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-orange-950 text-orange-400 border border-orange-800 text-[10px] font-mono font-bold">
                    {selectedPin.category}
                  </span>
                  <h4 className="text-sm font-bold text-white">{selectedPin.title}</h4>
                </div>
                <p className="text-xs text-zinc-300">{selectedPin.details}</p>
                <div className="text-[11px] font-mono text-zinc-400 pt-1">
                  Latitude: {selectedPin.lat}° N • Longitude: {selectedPin.lon}° E • Elevation: {selectedPin.elevation_m || -2520}m
                </div>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-xs text-zinc-500 hover:text-zinc-300 font-mono"
              >
                ✕ Close
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: 8 NASA Layers Toggles & Provenance */}
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white">8 NASA Data Layers</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">TOGGLE OVERLAYS</span>
            </div>

            <div className="space-y-2">
              {layers.map((layer) => {
                const isVisible = layerVisibility[layer.id] ?? false
                return (
                  <div
                    key={layer.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 hover:border-zinc-700 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200">{layer.category}</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                          {layer.provenance}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono line-clamp-1">
                        {layer.instrument} ({layer.spacecraft})
                      </div>
                    </div>

                    <button
                      onClick={() => toggleLayer(layer.id)}
                      className={`p-1.5 rounded transition ${
                        isVisible ? 'bg-orange-600/20 text-orange-400 border border-orange-700/60' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Tactical Overlays Toggles */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Mission Overlays</span>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Active Hazards</span>
                <input
                  type="checkbox"
                  checked={layerVisibility.HAZARDS}
                  onChange={() => toggleLayer('HAZARDS')}
                  className="rounded border-zinc-700 accent-orange-500"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Geological Landmarks</span>
                <input
                  type="checkbox"
                  checked={layerVisibility.LANDMARKS}
                  onChange={() => toggleLayer('LANDMARKS')}
                  className="rounded border-zinc-700 accent-orange-500"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-300">
                <span>Planned Route Paths</span>
                <input
                  type="checkbox"
                  checked={layerVisibility.ROUTES}
                  onChange={() => toggleLayer('ROUTES')}
                  className="rounded border-zinc-700 accent-orange-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
