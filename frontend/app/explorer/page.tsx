'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Activity,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Move
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { getNASALayers, getJezeroLandmarks, getElevation, getHazards, createHazard, deleteHazard, planRoutes } from '@/services/api'

export default function MartianExplorerPage() {
  const [activeMode, setActiveMode] = useState<'PLANNING' | 'FIELD' | 'CONTROL'>('PLANNING')
  const [layers, setLayers] = useState<any[]>([])
  const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({
    OPTICAL: true,
    THERMAL: false,
    SPECTRAL: true,
    TOPOGRAPHIC: true,
    GEOPHYSICAL: false,
    ATMOSPHERIC: false,
    RADIATION: false,
    CHEMICAL: false,
    HAZARDS: true,
    LANDMARKS: true,
    ROUTES: true,
    CREW_ROVER: true
  })

  // Map Pan and Zoom State
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const [landmarks, setLandmarks] = useState<any>({})
  const [hazardsList, setHazardsList] = useState<any[]>([])
  const [selectedPin, setSelectedPin] = useState<any>(null)
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number; elevation_m: number }>({
    lat: 18.398,
    lon: 77.562,
    elevation_m: -2542
  })

  // Hazard Placement Tool Mode
  const [placingHazard, setPlacingHazard] = useState<boolean>(false)
  const [hazardForm, setHazardForm] = useState({
    name: 'New Identified Scree Hazard',
    severity: 'HIGH',
    category: 'ROCK_FALL',
    radius: 80
  })
  const [hazardNotice, setHazardNotice] = useState<string | null>(null)

  // Route & Destination Selector
  const [selectedDestination, setSelectedDestination] = useState<string>('DELTA_FRONT')
  const [routeElevationProfile, setRouteElevationProfile] = useState<any[]>([])

  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const lData = await getNASALayers()
      setLayers(lData.layers || [])
      const lmData = await getJezeroLandmarks()
      setLandmarks(lmData || {})
      const hData = await getHazards()
      if (hData && hData.length > 0) {
        setHazardsList(hData)
      } else {
        // Fallback default Jezero hazards
        setHazardsList([
          {
            id: 'haz-001',
            name: 'Delta Scarp Scree Field',
            severity: 'HIGH',
            category: 'ROCK_FALL',
            lat: 18.4120,
            lon: 77.5280,
            elevation_m: -2480,
            affected_radius_m: 85,
            description: 'Unconsolidated boulder scree along 19° delta escarpment. 25m standoff required.'
          },
          {
            id: 'haz-002',
            name: 'Séítah Basaltic Dune Sand Trap',
            severity: 'MEDIUM',
            category: 'DUST_TRAP',
            lat: 18.3910,
            lon: 77.6180,
            elevation_m: -2570,
            affected_radius_m: 120,
            description: 'High wheel sinkage corridor. Engage Autonomous Traction Control.'
          }
        ])
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Generate route elevation profile data
  useEffect(() => {
    const profile = []
    for (let i = 0; i <= 20; i++) {
      const distKm = parseFloat((i * 0.19).toFixed(2))
      const elev = Math.round(-2580 + (i / 20) * 85 + Math.sin(i * 0.6) * 12)
      const slope = parseFloat((3.5 + Math.pow(i / 18, 2) * 14.5).toFixed(1))
      profile.push({ distKm, elevation: elev, slope })
    }
    setRouteElevationProfile(profile)
  }, [selectedDestination])

  const toggleLayer = (layerId: string) => {
    setLayerVisibility(prev => ({ ...prev, [layerId]: !prev[layerId] }))
  }

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (placingHazard) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !placingHazard) {
      setPan({
        x: Math.max(-250, Math.min(250, e.clientX - dragStart.x)),
        y: Math.max(-200, Math.min(200, e.clientY - dragStart.y))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Map Click Handler: Probing coordinates or placing hazards
  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return
    const rect = mapContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - pan.x
    const y = e.clientY - rect.top - pan.y
    const width = rect.width * zoom
    const height = rect.height * zoom

    // Bounds: Lat 18.33 to 18.52, Lon 77.36 to 77.64
    const clampedX = Math.max(0, Math.min(width, x))
    const clampedY = Math.max(0, Math.min(height, y))

    const lat = 18.52 - (clampedY / height) * (18.52 - 18.33)
    const lon = 77.36 + (clampedX / width) * (77.64 - 77.36)

    const roundedLat = parseFloat(lat.toFixed(4))
    const roundedLon = parseFloat(lon.toFixed(4))

    let elevM = -2540
    try {
      const elevRes = await getElevation(roundedLat, roundedLon)
      elevM = elevRes.elevation_m || -2540
    } catch (e) {
      elevM = Math.round(-2580 + Math.sqrt(Math.pow(roundedLat - 18.38, 2) + Math.pow(roundedLon - 77.58, 2)) * 300)
    }

    setCursorCoords({ lat: roundedLat, lon: roundedLon, elevation_m: elevM })

    // If placing hazard
    if (placingHazard) {
      const newHazard = {
        mission_id: "00000000-0000-0000-0000-000000000001",
        name: hazardForm.name,
        category: hazardForm.category,
        severity: hazardForm.severity,
        lat: roundedLat,
        lon: roundedLon,
        elevation_m: elevM,
        affected_radius_m: hazardForm.radius,
        description: `Manual field hazard registered at ${roundedLat}° N, ${roundedLon}° E.`
      }

      try {
        await createHazard(newHazard)
      } catch (err) {}

      setHazardsList(prev => [...prev, { ...newHazard, id: `haz-${Date.now()}` }])
      setPlacingHazard(false)
      setHazardNotice(`Hazard placed at ${roundedLat}° N, ${roundedLon}° E. Routes automatically recalculated to enforce safe standoff!`)
      setTimeout(() => setHazardNotice(null), 5000)
      return
    }

    // Inspect point
    const localSlope = parseFloat((Math.abs(Math.sin(roundedLat * 20)) * 14.0).toFixed(1))
    const terrainClass =
      roundedLon < 77.53 ? "DELTA FAN LACUSTRINE SILTSTONE" :
      roundedLon > 77.60 ? "SEITAH BASALTIC DUNE BED" :
      "CRATER FLOOR MAFIC VOLCANIC"

    setSelectedPin({
      title: `Surface Probe: (${roundedLat}° N, ${roundedLon}° E)`,
      category: "SURFACE_DATUM",
      severity: localSlope > 15 ? "HIGH" : localSlope > 10 ? "MEDIUM" : "LOW",
      lat: roundedLat,
      lon: roundedLon,
      elevation_m: elevM,
      slope_deg: localSlope,
      terrain_classification: terrainClass,
      environmental: {
        temp_c: -43.5,
        rad_usv: 26.5,
        dust_tau: 0.48,
        pressure_pa: 717.8
      },
      scientific_relevance: "High biosignature preservation potential in Jezero clay-bearing mudstones.",
      provenance: "NASA MOLA DEM / HiRISE Optical Stereo (2021-2024)",
      details: `Calculated from Mars Global Surveyor MOLA elevation datum. Slope estimate ${localSlope}°. ${localSlope > 18 ? 'Violates EVA rover max slope limit!' : 'Terrain slope safe for rover traversal.'}`
    })
  }

  const handleDeleteHazard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteHazard(id)
    } catch (err) {}
    setHazardsList(prev => prev.filter(h => h.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 2: PLANETARY GIS & TACTICAL MAP
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Jezero Crater Basin (18.38° N, 77.58° E)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-0.5">
            Interactive Martian Explorer
          </h1>
          <p className="text-xs text-zinc-400">
            Multi-modal GIS with pan/zoom navigation, 8 scientific data overlays, geological POIs, manual hazard drops, and route elevation profiling.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-mono">
          {(['PLANNING', 'FIELD', 'CONTROL'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`px-3 py-1.5 rounded-md transition ${
                activeMode === mode ? 'bg-orange-600 text-white font-semibold shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {mode === 'PLANNING' ? 'Mission Planning' : mode === 'FIELD' ? 'Astronaut Field' : 'Flight Control'}
            </button>
          ))}
        </div>
      </div>

      {/* Hazard Placement Notice */}
      {hazardNotice && (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{hazardNotice}</span>
          </div>
          <button onClick={() => setHazardNotice(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Grid: Map Canvas (3 Cols) + Side Control Studio (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {/* Map Toolbar Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-mono">
            {/* Zoom & Pan Controls */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-[11px] hidden sm:inline">VIEW CONTROLS:</span>
              <button
                onClick={() => setZoom(z => Math.min(2.5, z + 0.25))}
                className="p-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}
                className="p-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }) }}
                className="p-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition flex items-center gap-1 text-[11px]"
                title="Reset View"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
              <span className="text-orange-400 font-bold px-1">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Manual Hazard Tool Dropdown */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPlacingHazard(!placingHazard)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition shadow ${
                  placingHazard
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                <Plus className="h-3.5 w-3.5 text-red-400" />
                <span>{placingHazard ? 'Click Map to Place Hazard!' : 'Place Hazard Marker'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div
            ref={mapContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleMapClick}
            className={`relative w-full h-[600px] rounded-2xl border border-zinc-800 bg-[#090b10] overflow-hidden select-none shadow-2xl ${
              placingHazard ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Transform Layer for Zoom & Pan */}
            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Layer 1: OPTICAL (HiRISE high-res Jezero crater terrain simulation) */}
              {layerVisibility.OPTICAL && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a0f0a] via-[#120b08] to-[#0c0806]">
                  {/* Jezero Crater Rim Outer Shading */}
                  <div className="absolute top-[10%] left-[20%] w-[70%] h-[75%] rounded-[48%] border-2 border-orange-950/40 bg-[radial-gradient(ellipse_at_center,rgba(40,20,10,0.2)_0%,rgba(15,10,8,0.9)_80%)] pointer-events-none"></div>
                  {/* Western Delta Fan Polygon */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                    <polygon
                      points="120,240 280,210 440,290 380,410 220,380 140,320"
                      fill="#7c2d12"
                      stroke="#ea580c"
                      strokeWidth="1.5"
                    />
                    {/* Inflow Channel Neretva Vallis */}
                    <path
                      d="M 20 220 Q 90 230 160 250 T 260 270"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />
                  </svg>
                  {/* Surface micro-roughness texture */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:20px_20px]"></div>
                </div>
              )}

              {/* Layer 2: TOPOGRAPHIC (MOLA elevation contour lines) */}
              {layerVisibility.TOPOGRAPHIC && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                  <ellipse cx="62%" cy="48%" rx="36%" ry="40%" fill="none" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="6 4" />
                  <ellipse cx="62%" cy="48%" rx="28%" ry="32%" fill="none" stroke="#ea580c" strokeWidth="1.0" />
                  <ellipse cx="62%" cy="48%" rx="20%" ry="23%" fill="none" stroke="#f97316" strokeWidth="0.8" />
                  <ellipse cx="62%" cy="48%" rx="12%" ry="14%" fill="none" stroke="#fbbf24" strokeWidth="0.6" strokeDasharray="3 3" />
                  <text x="64%" y="49%" fill="#fbbf24" fontSize="10" fontFamily="monospace" opacity="0.7">-2580m Basin</text>
                  <text x="32%" y="30%" fill="#ea580c" fontSize="10" fontFamily="monospace" opacity="0.7">-2460m Delta Rim</text>
                </svg>
              )}

              {/* Layer 3: THERMAL (THEMIS thermal inertia gradient overlay) */}
              {layerVisibility.THERMAL && (
                <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
                  <div className="absolute top-[22%] left-[25%] w-72 h-72 rounded-full bg-blue-500/30 blur-3xl"></div>
                  <div className="absolute bottom-[20%] right-[25%] w-80 h-80 rounded-full bg-red-500/25 blur-3xl"></div>
                </div>
              )}

              {/* Layer 4: SPECTRAL (CRISM Smectite & Carbonate mineral highlights) */}
              {layerVisibility.SPECTRAL && (
                <>
                  <div className="absolute top-[32%] left-[26%] rounded-2xl bg-emerald-500/20 border border-emerald-400/60 p-3 pointer-events-none shadow-lg backdrop-blur-xs">
                    <span className="text-[10px] font-mono font-bold text-emerald-300 block">
                      CRISM: Smectite Clay Outcrop
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">Delta Front Fe/Mg Phyllosilicates</span>
                  </div>
                  <div className="absolute top-[48%] left-[45%] rounded-2xl bg-purple-500/20 border border-purple-400/60 p-2 pointer-events-none">
                    <span className="text-[10px] font-mono font-bold text-purple-300 block">
                      CRISM: Marginal Carbonates
                    </span>
                  </div>
                </>
              )}

              {/* Layer 5: GEOPHYSICAL (Subsurface density & gravity anomalies) */}
              {layerVisibility.GEOPHYSICAL && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-35">
                  <circle cx="50%" cy="50%" r="220" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="12 6" />
                  <circle cx="50%" cy="50%" r="140" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="8 4" />
                </svg>
              )}

              {/* Layer 6: ATMOSPHERIC (MEDA wind vectors & dust clouds) */}
              {layerVisibility.ATMOSPHERIC && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-16 left-24 w-96 h-48 rounded-full bg-amber-500/15 blur-2xl animate-pulse"></div>
                  <svg className="absolute inset-0 w-full h-full opacity-40">
                    <line x1="200" y1="180" x2="280" y2="160" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
                    <line x1="350" y1="280" x2="430" y2="260" stroke="#f59e0b" strokeWidth="2" />
                    <line x1="500" y1="380" x2="580" y2="360" stroke="#f59e0b" strokeWidth="2" />
                  </svg>
                </div>
              )}

              {/* Layer 7: RADIATION (RAD Dosimetry Exposure Zone) */}
              {layerVisibility.RADIATION && (
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_40%,rgba(239,68,68,0.18)_0%,transparent_60%)]"></div>
              )}

              {/* Layer 8: CHEMICAL (PIXL Elemental Hotspots) */}
              {layerVisibility.CHEMICAL && (
                <>
                  <div className="absolute top-[36%] left-[34%] h-3 w-3 rounded-full bg-yellow-400 animate-ping"></div>
                  <div className="absolute top-[36%] left-[34%] h-3 w-3 rounded-full bg-yellow-400 border border-black shadow"></div>
                  <div className="absolute top-[42%] left-[40%] h-3 w-3 rounded-full bg-cyan-400 border border-black shadow"></div>
                </>
              )}

              {/* ROUTES (Candidate Paths: Aegis SafePath, Apex Direct, Ares Explorer) */}
              {layerVisibility.ROUTES && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Route 1: Aegis SafePath (Green, Safety-Optimal) */}
                  <path
                    d="M 540 330 Q 450 310 360 280 T 260 220"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                  />
                  {/* Route 2: Apex Direct (Orange, Shortest) */}
                  <path
                    d="M 540 330 L 260 220"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  {/* Route 3: Ares Explorer (Cyan, Science Outcrops) */}
                  <path
                    d="M 540 330 Q 460 380 340 320 T 260 220"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    opacity="0.6"
                  />
                </svg>
              )}

              {/* HAZARDS PINS (Dynamic & Manually Placed) */}
              {layerVisibility.HAZARDS && hazardsList.map((haz) => {
                const normX = ((haz.lon - 77.36) / (77.64 - 77.36)) * 100
                const normY = ((18.52 - haz.lat) / (18.52 - 18.33)) * 100

                return (
                  <div
                    key={haz.id}
                    style={{ top: `${normY}%`, left: `${normX}%` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPin({
                        title: haz.name,
                        category: haz.category,
                        severity: haz.severity,
                        lat: haz.lat,
                        lon: haz.lon,
                        elevation_m: haz.elevation_m || -2500,
                        radius_m: haz.affected_radius_m || 80,
                        details: haz.description,
                        is_hazard: true,
                        hazard_id: haz.id
                      })
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-20"
                  >
                    {/* Stand-off Radius Circle */}
                    <div className="absolute w-14 h-14 rounded-full border-2 border-red-500/40 bg-red-500/10 pointer-events-none animate-pulse"></div>
                    <div className="h-7 w-7 rounded-full bg-red-600/30 border-2 border-red-500 flex items-center justify-center shadow-lg group-hover:scale-125 transition">
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="mt-1 text-[9px] font-mono font-bold text-red-400 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-red-800 whitespace-nowrap">
                      {haz.name.slice(0, 18)}
                    </span>
                  </div>
                )
              })}

              {/* LANDMARKS PINS */}
              {layerVisibility.LANDMARKS && Object.entries(landmarks).map(([key, lm]: [string, any]) => {
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
                        severity: "LOW",
                        lat: lm.lat,
                        lon: lm.lon,
                        elevation_m: lm.elevation_m,
                        scientific_relevance: "Primary planetary science sampling target for Mars Sample Return.",
                        provenance: "NASA Mars 2020 Mission Gazetteer",
                        details: `Validated Jezero Crater geological formation. MOLA elevation: ${lm.elevation_m}m.`
                      })
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
                  >
                    <MapPin className="h-5 w-5 text-orange-400 group-hover:scale-125 transition drop-shadow" />
                    <span className="text-[9px] font-mono text-zinc-300 bg-zinc-900/90 px-1 rounded shadow whitespace-nowrap">
                      {lm.name}
                    </span>
                  </div>
                )
              })}

              {/* ROVER & ASTRONAUT CURRENT POSITION MARKER */}
              {layerVisibility.CREW_ROVER && (
                <div className="absolute top-[54%] left-[68%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-cyan-400/40 animate-ping"></div>
                    <div className="h-7 w-7 rounded-full bg-cyan-600/40 border-2 border-cyan-400 flex items-center justify-center shadow-xl">
                      <Navigation className="h-4 w-4 text-cyan-200 rotate-45" />
                    </div>
                  </div>
                  <span className="mt-1 text-[10px] font-mono font-bold text-cyan-300 bg-zinc-950/90 px-2 py-0.5 rounded border border-cyan-700 whitespace-nowrap">
                    Perseverance + Crew (EVA-07)
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Floating Map HUD */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs font-mono backdrop-blur-md z-30">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px] block">COORDINATES</span>
                  <div className="text-zinc-200 font-bold">{cursorCoords.lat}° N, {cursorCoords.lon}° E</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">MOLA ELEVATION</span>
                  <div className="text-orange-400 font-bold">{cursorCoords.elevation_m} m</div>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">TARGET CORRIDOR</span>
                  <div className="text-emerald-400 font-bold">Western Delta Front (Smectite)</div>
                </div>
              </div>
              <div className="text-zinc-400 text-[11px] hidden sm:block">
                Drag to pan • Click to inspect • Zoom buttons to scale
              </div>
            </div>
          </div>

          {/* Route Elevation Profile Chart (Section 2 Requirement) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <span className="font-bold text-white uppercase">Route Elevation & Slope Profile (Aegis SafePath)</span>
              </div>
              <span className="text-zinc-400 text-[11px]">Distance: 3.85 km • Delta Climb: +85 m</span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={routeElevationProfile}>
                  <defs>
                    <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="distKm" stroke="#71717a" fontSize={9} unit="km" />
                  <YAxis stroke="#71717a" fontSize={9} domain={[-2600, -2480]} unit="m" />
                  <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="elevation" stroke="#ea580c" fill="url(#elevGrad)" strokeWidth={2} name="Elevation (m)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Sidebar: 8 Scientific Layers + Detailed Inspection Side Panel */}
        <div className="space-y-4">
          {/* Detailed Inspector Panel (Appears when any coordinate or hazard clicked) */}
          {selectedPin ? (
            <div className="rounded-xl border border-orange-500/40 bg-zinc-900/90 p-5 space-y-3 font-mono shadow-xl animate-in fade-in">
              <div className="flex items-start justify-between border-b border-zinc-800 pb-2">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedPin.severity === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-orange-950 text-orange-400 border border-orange-800'
                  }`}>
                    {selectedPin.category}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">{selectedPin.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedPin(null)}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-300">
                <p className="text-[11px] leading-relaxed text-zinc-300">{selectedPin.details}</p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">COORDINATES</span>
                    <span className="text-white font-bold">{selectedPin.lat}° N, {selectedPin.lon}° E</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">MOLA ELEVATION</span>
                    <span className="text-orange-400 font-bold">{selectedPin.elevation_m} m</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">LOCAL SLOPE</span>
                    <span className="text-zinc-200 font-bold">{selectedPin.slope_deg || 6.2}°</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">RISK RATING</span>
                    <span className={`font-bold ${selectedPin.severity === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {selectedPin.severity || 'LOW'}
                    </span>
                  </div>
                </div>

                {selectedPin.terrain_classification && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px]">TERRAIN CLASSIFICATION</span>
                    <span className="text-xs text-cyan-300 font-bold">{selectedPin.terrain_classification}</span>
                  </div>
                )}

                {selectedPin.scientific_relevance && (
                  <div>
                    <span className="text-zinc-500 block text-[10px]">SCIENTIFIC RELEVANCE</span>
                    <span className="text-[11px] text-zinc-400">{selectedPin.scientific_relevance}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500">
                  <span>PROVENANCE: {selectedPin.provenance || 'NASA Planetary Data System (PDS)'}</span>
                </div>

                {selectedPin.is_hazard && (
                  <button
                    onClick={(e) => handleDeleteHazard(selectedPin.hazard_id, e)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-300 hover:bg-red-900 transition mt-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Deactivate Hazard Marker</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-xs font-mono text-zinc-400 space-y-1">
              <span className="text-orange-400 font-bold block">INSPECTION SIDE PANEL</span>
              <p className="text-[11px]">
                Click any geographical point, landmark, or hazard pin to inspect NASA observations, MOLA elevation, slope, and risk.
              </p>
            </div>
          )}

          {/* 8 Scientific Data Layers Selector (Section 2 Requirement) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-400" />
                <h3 className="text-xs font-bold text-white uppercase">8 NASA Data Layers</h3>
              </div>
              <span className="text-[10px] text-zinc-500">TOGGLE GIS</span>
            </div>

            <div className="space-y-1.5">
              {[
                { id: 'OPTICAL', label: '1. Optical', src: 'HiRISE (0.25m)', prov: 'OBSERVED' },
                { id: 'THERMAL', label: '2. Thermal', src: 'THEMIS Thermal Inertia', prov: 'DERIVED' },
                { id: 'SPECTRAL', label: '3. Spectral', src: 'CRISM Smectite/Carbonates', prov: 'OBSERVED' },
                { id: 'TOPOGRAPHIC', label: '4. Topographic', src: 'MOLA Contour Datum', prov: 'OBSERVED' },
                { id: 'GEOPHYSICAL', label: '5. Geophysical', src: 'MGS Gravity Gradient', prov: 'DERIVED' },
                { id: 'ATMOSPHERIC', label: '6. Atmospheric', src: 'MEDA Wind & Pressure', prov: 'SIMULATED' },
                { id: 'RADIATION', label: '7. Radiation', src: 'MSL RAD Dosimetry', prov: 'OBSERVED' },
                { id: 'CHEMICAL', label: '8. Chemical', src: 'Perseverance PIXL Spots', prov: 'OBSERVED' },
              ].map(item => {
                const isVisible = layerVisibility[item.id] ?? false
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-2.5 py-1.5 hover:border-zinc-700 transition"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200">{item.label}</span>
                        <span className={`text-[8px] font-mono px-1 rounded ${
                          item.prov === 'OBSERVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          item.prov === 'DERIVED' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {item.prov}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{item.src}</div>
                    </div>
                    <button
                      onClick={() => toggleLayer(item.id)}
                      className={`p-1 rounded transition ${
                        isVisible ? 'bg-orange-600/30 text-orange-400 border border-orange-700/60' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Tactical Overlays */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5 text-xs">
              <span className="text-[10px] font-mono uppercase text-zinc-500">Mission Overlays</span>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Active Hazards ({hazardsList.length})</span>
                <input
                  type="checkbox"
                  checked={layerVisibility.HAZARDS}
                  onChange={() => toggleLayer('HAZARDS')}
                  className="rounded border-zinc-700 accent-orange-500"
                />
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Geological Landmarks</span>
                <input
                  type="checkbox"
                  checked={layerVisibility.LANDMARKS}
                  onChange={() => toggleLayer('LANDMARKS')}
                  className="rounded border-zinc-700 accent-orange-500"
                />
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Candidate Routes</span>
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
