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
  Camera
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

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
    rover: 'Perseverance & Ingenuity (Mars 2020)',
    image: '/assets/nasa/PIA24331.jpg',
    credit: 'NASA/JPL-Caltech/MRO HiRISE',
    targetPath: '/explorer',
  },
  {
    name: 'Olympus Mons',
    subtitle: "Solar System's Largest Shield Volcano",
    lat: 18.65,
    lon: -133.8,
    elevation: '+21,229 m MOLA',
    priority: 'HIGH PRIORITY',
    rover: 'Mars Global Surveyor / MRO CTX',
    image: '/assets/nasa/PIA24096.jpg',
    credit: 'NASA/GSFC/MOLA Science Team',
    targetPath: '/explorer',
  },
  {
    name: 'Valles Marineris',
    subtitle: '4,000 km Planetary Grand Canyon',
    lat: -13.9,
    lon: -59.2,
    elevation: '-7,000 m MOLA Depth',
    priority: 'STRATEGIC SURVEY',
    rover: '2001 Mars Odyssey THEMIS',
    image: '/assets/nasa/PIA24745.jpg',
    credit: 'NASA/JPL/ASU',
    targetPath: '/explorer',
  },
  {
    name: 'Gale Crater',
    subtitle: 'Mount Sharp Layered Sulfate Deposits',
    lat: -5.4,
    lon: 137.8,
    elevation: '-4,450 m MOLA',
    priority: 'SCIENCE ARCHIVE',
    rover: 'Curiosity (MSL)',
    image: '/assets/nasa/PIA24927.jpg',
    credit: 'NASA/JPL-Caltech/MSSS',
    targetPath: '/explorer',
  },
]

export default function MarsGlobeHomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { playClick, playChime, missionXP } = useMission()
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [isRotating, setIsRotating] = useState(true)

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Mesh | null>(null)
  const markerMeshesRef = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    if (!containerRef.current) return

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
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Starfield Background
    const starGeometry = new THREE.BufferGeometry()
    const starCount = 1800
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 50
      starPositions[i + 1] = (Math.random() - 0.5) * 50
      starPositions[i + 2] = -Math.random() * 40 - 5
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.035,
      transparent: true,
      opacity: 0.8,
    })
    const starField = new THREE.Points(starGeometry, starMaterial)
    scene.add(starField)

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xfff3e6, 2.5)
    sunLight.position.set(5, 2, 4)
    scene.add(sunLight)

    const ambientLight = new THREE.AmbientLight(0x1a2130, 0.45)
    scene.add(ambientLight)

    // Textures
    const textureLoader = new THREE.TextureLoader()
    const marsTexture = textureLoader.load('/assets/nasa/mars_surface_texture.jpg')
    const marsBump = textureLoader.load('/assets/nasa/mars_elevation_bump.jpg')

    const globeRadius = 1.25
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64)
    const globeMaterial = new THREE.MeshStandardMaterial({
      map: marsTexture,
      bumpMap: marsBump,
      bumpScale: 0.035,
      roughness: 0.82,
      metalness: 0.1,
    })
    const globe = new THREE.Mesh(globeGeometry, globeMaterial)
    scene.add(globe)
    globeRef.current = globe

    // Atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.025, 48, 48)
    const atmosphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xeb5e28,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    scene.add(atmosphere)

    const latLonToVector3 = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      )
    }

    markerMeshesRef.current = []
    MARTIAN_HOTSPOTS.forEach((spot, idx) => {
      const pos = latLonToVector3(spot.lat, spot.lon, globeRadius * 1.015)
      const markerGeom = new THREE.SphereGeometry(0.038, 16, 16)
      const markerMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xff4500 : 0x00f0ff,
      })
      const marker = new THREE.Mesh(markerGeom, markerMat)
      marker.position.copy(pos)
      marker.userData = { hotspot: spot }
      globe.add(marker)
      markerMeshesRef.current.push(marker)
    })

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onPointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(markerMeshesRef.current)

      if (intersects.length > 0) {
        const clickedMarker = intersects[0].object as THREE.Mesh
        const spot = clickedMarker.userData.hotspot as Hotspot
        if (spot) {
          playChime()
          setSelectedHotspot(spot)
          setIsRotating(false)
        }
      }
    }

    renderer.domElement.addEventListener('click', onPointerDown)

    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      if (globeRef.current && isRotating) {
        globeRef.current.rotation.y += 0.002
      }

      markerMeshesRef.current.forEach((m, i) => {
        const scale = 1 + Math.sin(Date.now() * 0.005 + i) * 0.25
        m.scale.set(scale, scale, scale)
      })

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
      renderer.domElement.removeEventListener('click', onPointerDown)
      cancelAnimationFrame(animationId)
      renderer.dispose()
    }
  }, [isRotating]) // eslint-disable-line

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#050608] via-[#090b12] to-[#040507]">
      {/* 3D WebGL Mars Canvas */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing z-0" />

      {/* Floating Spatial HUD Header */}
      <div className="absolute top-6 left-6 z-10 pointer-events-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <SimulatedBadge type="REAL" />
          <span className="text-[11px] font-mono text-zinc-400">Viking MOLA Orbit Mosaic</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
          PLANET MARS
        </h1>
        <p className="text-xs md:text-sm text-zinc-300 font-sans mt-0.5">
          Pick a glowing hotspot on the globe or access Maps & Graphs below.
        </p>

        {/* Quick-Access Pills for Maps & Graphs */}
        <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-xs">
          <Link
            href="/explorer"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 font-bold transition shadow-lg touch-react"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🗺️ GIS MAP (8 LAYERS)</span>
          </Link>
          <Link
            href="/overview"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/50 bg-orange-950/60 hover:bg-orange-900/80 text-orange-300 font-bold transition shadow-lg touch-react"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>📈 LIVE TELEMETRY GRAPHS</span>
          </Link>
          <Link
            href="/risk"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/50 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold transition shadow-lg touch-react"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>🎯 RISK RADAR & CHARTS</span>
          </Link>
          <Link
            href="/datasets"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/50 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 font-bold transition shadow-lg touch-react"
          >
            <Database className="w-3.5 h-3.5" />
            <span>📊 DATA STUDIO</span>
          </Link>
          <Link
            href="/gallery"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-500/50 bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 font-bold transition shadow-lg touch-react"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>📸 APP SHOWCASE GALLERY</span>
          </Link>
        </div>
      </div>

      {/* Center Prompt when nothing is selected */}
      {!selectedHotspot && (
        <div className="absolute bottom-16 left-6 right-6 md:left-auto md:right-8 z-10 flex flex-wrap gap-3 items-center pointer-events-auto">
          <button
            onClick={() => {
              playChime()
              setSelectedHotspot(MARTIAN_HOTSPOTS[0])
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-mono text-xs font-bold shadow-2xl hover:scale-105 transition glow-orange"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START EVA-07 JEZERO MISSION</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <Link
            href="/explorer"
            onClick={playClick}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/15 bg-zinc-900/80 backdrop-blur-md text-zinc-200 font-mono text-xs font-bold hover:bg-zinc-800 transition"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>OPEN MAP EXPLORER</span>
          </Link>

          <button
            onClick={() => {
              playClick()
              setIsRotating(!isRotating)
            }}
            className="p-3.5 rounded-2xl border border-white/10 bg-zinc-900/70 text-zinc-300 hover:text-white transition"
            title={isRotating ? 'Pause Rotation' : 'Resume Rotation'}
          >
            <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Hotspot Cinematic Mission Hub Bottom Sheet */}
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

              <h2 className="text-xl font-black text-white tracking-tight">
                {selectedHotspot.name}
              </h2>
              <p className="text-xs text-zinc-300 font-sans line-clamp-1">
                {selectedHotspot.subtitle}
              </p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-zinc-900/80 rounded-xl p-2 border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[9px]">ELEVATION</span>
                  <span className="text-zinc-200 font-bold">{selectedHotspot.elevation}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">SPACECRAFT</span>
                  <span className="text-cyan-300 font-bold truncate block">{selectedHotspot.rover}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={selectedHotspot.targetPath}
                  onClick={playChime}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold shadow-lg transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>ENTER MISSION HUB</span>
                </Link>
                <button
                  onClick={() => {
                    playClick()
                    setSelectedHotspot(null)
                    setIsRotating(true)
                  }}
                  className="px-3 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white font-mono text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
