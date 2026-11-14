'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import {
  Compass,
  Play,
  Sparkles,
  MapPin,
  ChevronRight,
  Shield,
  Layers,
  Info,
  RotateCw,
  Eye,
  Award,
  BarChart2,
  Route,
  Activity,
  Database,
  Camera,
  Bot,
  Gamepad2,
  Crosshair,
  Sun,
  HelpCircle
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'
import LivingMartianEnvironment from '@/components/game/LivingMartianEnvironment'
import MartianGameStation from '@/components/game/MartianGameStation'
import BeginnerOnboardingModal from '@/components/game/BeginnerOnboardingModal'

interface Hotspot {
  name: string
  subtitle: string
  lat: number
  lon: number
  elevation: string
  priority: string
  rover: string
  image: string
  credit: string
  targetPath: string
}

const MARTIAN_HOTSPOTS: Hotspot[] = [
  {
    name: 'Jezero Crater',
    subtitle: 'Primary Exploration Corridor (EVA-07)',
    lat: 18.38,
    lon: 77.58,
    elevation: '-2,548 m MOLA',
    priority: 'PRIMARY TARGET',
    rover: 'Advanced Surface Rover & Aerial Scout',
    image: '/assets/nasa/PIA24331.jpg',
    credit: 'Planetary Science Archive / HiRISE 0.25m/px',
    targetPath: '/explorer',
  },
  {
    name: 'Olympus Mons',
    subtitle: "Solar System's Largest Shield Volcano",
    lat: 18.65,
    lon: -133.8,
    elevation: '+21,229 m MOLA',
    priority: 'HIGH PRIORITY',
    rover: 'Global Topographic Orbital Surveyor',
    image: '/assets/nasa/PIA24096.jpg',
    credit: 'Planetary Elevation Science / MOLA Topography',
    targetPath: '/explorer',
  },
  {
    name: 'Valles Marineris',
    subtitle: '4,000 km Planetary Grand Canyon',
    lat: -13.9,
    lon: -59.2,
    elevation: '-7,000 m MOLA Depth',
    priority: 'STRATEGIC SURVEY',
    rover: 'Diurnal Thermal Infrared Orbiter',
    image: '/assets/nasa/PIA24745.jpg',
    credit: 'Thermal Emission Imaging Archive / THEMIS',
    targetPath: '/explorer',
  },
  {
    name: 'Gale Crater',
    subtitle: 'Mount Sharp Layered Sulfate Deposits',
    lat: -5.4,
    lon: 137.8,
    elevation: '-4,450 m MOLA',
    priority: 'SCIENCE ARCHIVE',
    rover: 'Curiosity Heavy Science Traverse',
    image: '/assets/nasa/PIA24927.jpg',
    credit: 'Mars Science Laboratory Camera System',
    targetPath: '/explorer',
  },
]

export default function MarsGlobeHomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { playClick, playChime, missionXP } = useMission()

  // Primary View Mode
  const [activeViewMode, setActiveViewMode] = useState<'game' | 'surface' | 'globe'>('game')
  const [showTutorial, setShowTutorial] = useState(false)
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [isRotating, setIsRotating] = useState(true)

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Mesh | null>(null)
  const markerMeshesRef = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    if (activeViewMode !== 'globe' || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 3.8)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffecd2, 1.8)
    sunLight.position.set(5, 3, 4)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x00f5ff, 0.7)
    rimLight.position.set(-5, -2, -3)
    scene.add(rimLight)

    // Starfield Background
    const starsGeo = new THREE.BufferGeometry()
    const starCount = 600
    const starCoords = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i++) {
      starCoords[i] = (Math.random() - 0.5) * 40
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3))
    const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.6 })
    const starField = new THREE.Points(starsGeo, starsMat)
    scene.add(starField)

    // Mars Sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64)
    const textureLoader = new THREE.TextureLoader()

    const marsTexture = textureLoader.load('/assets/nasa/mars_surface_texture.jpg')
    const marsBump = textureLoader.load('/assets/nasa/mars_elevation_bump.jpg')

    const sphereMat = new THREE.MeshStandardMaterial({
      map: marsTexture,
      bumpMap: marsBump,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.1,
    })

    const globe = new THREE.Mesh(sphereGeo, sphereMat)
    scene.add(globe)
    globeRef.current = globe

    // Atmospheric Glow
    const atmosGeo = new THREE.SphereGeometry(1.24, 64, 64)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0xff5522,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.22,
    })
    const atmosphere = new THREE.Mesh(atmosGeo, atmosMat)
    scene.add(atmosphere)

    // Hotspot Beacon Markers
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      const x = -(radius * Math.sin(phi) * Math.cos(theta))
      const z = radius * Math.sin(phi) * Math.sin(theta)
      const y = radius * Math.cos(phi)
      return new THREE.Vector3(x, y, z)
    }

    markerMeshesRef.current = []
    MARTIAN_HOTSPOTS.forEach((hotspot, idx) => {
      const pos = latLonToVector3(hotspot.lat, hotspot.lon, 1.22)
      const markerGroup = new THREE.Group()

      // Core Beacon
      const coreGeo = new THREE.SphereGeometry(0.035, 16, 16)
      const coreMat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0xff5500 : 0x00f5ff })
      const coreMesh = new THREE.Mesh(coreGeo, coreMat)
      markerGroup.add(coreMesh)

      // Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.05, 0.075, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xffaa00 : 0x00f5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0))
      markerGroup.add(ringMesh)

      markerGroup.position.copy(pos)
      markerGroup.userData = { hotspotIndex: idx }
      globe.add(markerGroup)
      markerMeshesRef.current.push(coreMesh)
    })

    // Animation Loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      if (isRotating && globeRef.current) {
        globeRef.current.rotation.y += 0.0018
      }
      starField.rotation.y += 0.0002
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
    }
  }, [activeViewMode, isRotating])

  return (
    <div className="relative w-full min-h-screen px-4 md:px-8 py-6 space-y-6">
      {/* TOP HEADER: GAME TITLE & MODE SWITCHER */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 backdrop-blur-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type="REAL" />
            <span className="text-[11px] font-mono text-zinc-400">
              Planetary Observation Archive • Jezero & Gale Corridors
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <span>ARES: RED PLANET EXPEDITION</span>
            <span className="text-orange-500 text-lg">v2.5</span>
          </h1>
          <p className="text-xs text-zinc-300 font-sans mt-0.5">
            Interactive AI-Powered Martian Exploration, Terrain Scanning & Rover Survival Simulator
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              playClick()
              setActiveViewMode('game')
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold transition shadow-lg ${
              activeViewMode === 'game'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-orange-950'
                : 'border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>EXPEDITION GAME</span>
          </button>

          <button
            onClick={() => {
              playClick()
              setActiveViewMode('surface')
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold transition shadow-lg ${
              activeViewMode === 'surface'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-cyan-950'
                : 'border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>LIVING SURFACE</span>
          </button>

          <button
            onClick={() => {
              playClick()
              setActiveViewMode('globe')
            }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold transition shadow-lg ${
              activeViewMode === 'globe'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-purple-950'
                : 'border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>3D MARS GLOBE</span>
          </button>

          {/* Tutorial Trigger Button */}
          <button
            onClick={() => {
              playClick()
              setShowTutorial(true)
            }}
            className="flex items-center gap-1.5 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-2.5 text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-900/60 transition shadow-lg"
            title="Open Interactive Explorer Onboarding"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>TUTORIAL</span>
          </button>
        </div>
      </div>

      {/* QUICK JUMP NAVIGATION BAR TO SCIENTIFIC MODULES */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <Link
          href="/explorer"
          onClick={playClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/50 hover:bg-cyan-900/70 text-cyan-300 font-bold transition shadow-md"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>🗺️ GIS MAP (8 REAL LAYERS)</span>
        </Link>
        <Link
          href="/overview"
          onClick={playClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-orange-500/40 bg-orange-950/50 hover:bg-orange-900/70 text-orange-300 font-bold transition shadow-md"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>📈 LIVE TELEMETRY GRAPHS</span>
        </Link>
        <Link
          href="/risk"
          onClick={playClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-500/40 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 font-bold transition shadow-md"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>🎯 RISK RADAR & CHARTS</span>
        </Link>
        <Link
          href="/planner"
          onClick={playClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 font-bold transition shadow-md"
        >
          <Route className="w-3.5 h-3.5" />
          <span>⚡ ROUTE OPTIMIZER LAB</span>
        </Link>
        <Link
          href="/datasets"
          onClick={playClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-blue-500/40 bg-blue-950/50 hover:bg-blue-900/70 text-blue-300 font-bold transition shadow-md"
        >
          <Database className="w-3.5 h-3.5" />
          <span>📊 PLANETARY DATA STUDIO</span>
        </Link>
        <Link
          href="/gallery"
          onClick={playClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-pink-500/40 bg-pink-950/50 hover:bg-pink-900/70 text-pink-300 font-bold transition shadow-md"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>📸 APP TOUR & LIGHTBOX</span>
        </Link>
      </div>

      {/* DYNAMIC CONTENT VIEWPORTS BASED ON ACTIVE MODE */}
      {activeViewMode === 'game' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <MartianGameStation />
        </div>
      )}

      {activeViewMode === 'surface' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <LivingMartianEnvironment />
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 backdrop-blur-2xl text-xs text-zinc-300 font-sans leading-relaxed">
            <h3 className="font-mono text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Sun className="w-4 h-4 text-orange-400" />
              <span>Living Martian Environment Mechanics</span>
            </h3>
            <p>
              Experience a dynamic Martian surface with particle dust storms, interactive time-of-day illumination (including the iconic blue Martian sunset and nocturnal starfields featuring moons Phobos & Deimos), and click-to-drive rover mobility with dust trails.
            </p>
          </div>
        </div>
      )}

      {activeViewMode === 'globe' && (
        <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-white/10 bg-black animate-in fade-in duration-300">
          {/* 3D WebGL Mars Canvas */}
          <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-0" />

          {/* Floating Spatial HUD Header */}
          <div className="absolute top-6 left-6 z-10 pointer-events-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <SimulatedBadge type="REAL" />
              <span className="text-[11px] font-mono text-zinc-400">Planetary MOLA Orbit Mosaic</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              PLANET MARS
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 font-sans mt-0.5">
              Select any glowing beacon on the globe to inspect coordinates.
            </p>
          </div>

          {/* Hotspot details bottom sheet */}
          {selectedHotspot && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-xl rounded-3xl border border-orange-500/40 bg-zinc-950/90 backdrop-blur-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 glass-panel">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:w-44 h-32 rounded-2xl overflow-hidden border border-zinc-700 shrink-0">
                  <img
                    src={selectedHotspot.image}
                    alt={selectedHotspot.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                    {selectedHotspot.credit}
                  </div>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-orange-950 border border-orange-700/60 text-orange-400 text-[10px] font-mono font-bold">
                      {selectedHotspot.priority}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {selectedHotspot.lat}°N, {selectedHotspot.lon}°E
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight">
                    {selectedHotspot.name}
                  </h3>
                  <p className="text-xs text-zinc-300 font-sans line-clamp-1">
                    {selectedHotspot.subtitle}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block text-[9px]">ELEVATION</span>
                      <span className="text-zinc-200 font-bold">{selectedHotspot.elevation}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px]">SURVEY</span>
                      <span className="text-cyan-300 font-bold truncate block">{selectedHotspot.rover}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={selectedHotspot.targetPath}
                      onClick={playChime}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold shadow-lg transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>ENTER SECTOR MAP</span>
                    </Link>
                    <button
                      onClick={() => {
                        playClick()
                        setSelectedHotspot(null)
                        setIsRotating(true)
                      }}
                      className="px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white font-mono text-xs transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BEGINNER INTERACTIVE TUTORIAL MODAL */}
      <BeginnerOnboardingModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
      />
    </div>
  )
}
