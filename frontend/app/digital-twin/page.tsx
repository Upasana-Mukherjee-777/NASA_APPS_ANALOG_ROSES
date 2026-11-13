'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  Box,
  Compass,
  Play,
  RotateCcw,
  Layers,
  Activity,
  ShieldAlert,
  Navigation,
  Clock,
  Info
} from 'lucide-react'
import { getDigitalTwinState, getMissionTimeline, replayTimelineStep } from '@/services/api'

export default function DigitalTwinPage() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [twinState, setTwinState] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [selectedStep, setSelectedStep] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  useEffect(() => {
    loadTwin()
    loadTimeline()
  }, [])

  const loadTwin = async () => {
    try {
      const state = await getDigitalTwinState()
      setTwinState(state)
    } catch (e) {
      console.error(e)
    }
  }

  const loadTimeline = async () => {
    try {
      const tl = await getMissionTimeline()
      setTimeline(tl || [])
    } catch (e) {
      console.error(e)
    }
  }

  // Three.js Interactive 3D Terrain Rendering
  useEffect(() => {
    if (!mountRef.current) return

    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 500

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0c12)
    scene.fog = new THREE.FogExp2(0x0a0c12, 0.012)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 32, 45)
    camera.lookAt(0, -4, 0)

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 3. Lighting (Simulating low-angle Martian sunlight)
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.4)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffa550, 1.8)
    sunLight.position.set(30, 45, 20)
    scene.add(sunLight)

    // 4. Martian Terrain Mesh with Jezero Crater Geometry
    const gridSegments = 60
    const terrainGeo = new THREE.PlaneGeometry(60, 60, gridSegments, gridSegments)
    terrainGeo.rotateX(-Math.PI / 2)

    const pos = terrainGeo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i)
      const vz = pos.getZ(i)
      const distFromCenter = Math.sqrt(vx * vx + vz * vz)

      // Crater basin depression + rim rise + delta fan elevation
      let h = -3.5 + Math.pow(distFromCenter / 28, 2.2) * 5.0
      // Delta scarp on west (vx < 0)
      if (vx < 0) {
        h += Math.sin(vx * 0.15) * 1.8
      }
      // Micro ripples
      h += Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.35
      pos.setY(i, h)
    }
    terrainGeo.computeVertexNormals()

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x8b3a1a, // Martian rust
      roughness: 0.85,
      metalness: 0.15,
      wireframe: false,
      flatShading: true
    })
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat)
    scene.add(terrainMesh)

    // Wireframe grid overlay for digital twin HUD effect
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xcc5500, wireframe: true, transparent: true, opacity: 0.12 })
    const wireMesh = new THREE.Mesh(terrainGeo, wireMat)
    scene.add(wireMesh)

    // 5. Rover Object (Perseverance representation)
    const roverGeo = new THREE.BoxGeometry(2.2, 1.2, 2.8)
    const roverMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.7, roughness: 0.3 })
    const rover = new THREE.Mesh(roverGeo, roverMat)
    rover.position.set(3, -2.6, 2)
    scene.add(rover)

    // Rover antenna mast
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.0)
    const mastMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const mast = new THREE.Mesh(mastGeo, mastMat)
    mast.position.set(3, -1.2, 1.2)
    scene.add(mast)

    // 6. Astronaut Position Markers
    const astroGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.6)
    const astroMat1 = new THREE.MeshStandardMaterial({ color: 0x38bdf8 }) // Blue suit highlight (Sarah)
    const astro1 = new THREE.Mesh(astroGeo, astroMat1)
    astro1.position.set(5.5, -2.6, 2.5)
    scene.add(astro1)

    const astroMat2 = new THREE.MeshStandardMaterial({ color: 0xf59e0b }) // Amber highlight (Mark)
    const astro2 = new THREE.Mesh(astroGeo, astroMat2)
    astro2.position.set(6.2, -2.6, 1.2)
    scene.add(astro2)

    // 7. Active Hazard Cones (e.g. Scree slope)
    const hazardGeo = new THREE.ConeGeometry(3.0, 4.0, 16)
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.5 })
    const hazardCone = new THREE.Mesh(hazardGeo, hazardMat)
    hazardCone.position.set(-10, 0.5, -8)
    scene.add(hazardCone)

    // Animation Loop (Slow orbital pan)
    let animationFrameId: number
    let angle = 0
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      angle += 0.002
      camera.position.x = Math.sin(angle) * 45
      camera.position.z = Math.cos(angle) * 45
      camera.lookAt(0, -3, 0)
      hazardCone.rotation.y += 0.01
      renderer.render(scene, camera)
    }
    animate()

    // Handle Resize
    const handleResize = () => {
      if (!mountRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight || 500
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
      renderer.dispose()
    }
  }, [])

  const handleStepReplay = async (stepNum: number) => {
    setSelectedStep(stepNum)
    try {
      await replayTimelineStep(stepNum)
    } catch (e) {}
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 8: MISSIONS DIGITAL TWIN
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Interactive 3D Three.js Surface Model</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Astronaut-Updated 3D Digital Twin
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Synchronizes in-situ astronaut observations, rover telemetry, terrain elevations, and active hazards into a spatial digital twin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
          >
            <Play className="h-4 w-4" />
            <span>{isPlaying ? "Pause Replay" : "Replay Sortie Timeline"}</span>
          </button>
        </div>
      </div>

      {/* Main 3D Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Scene Canvas (3 Cols wide) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative w-full h-[520px] rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            {/* Three.js DOM Container */}
            <div ref={mountRef} className="w-full h-full"></div>

            {/* Top-Right HUD Badge */}
            <div className="absolute top-4 right-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs font-mono backdrop-blur-md space-y-1">
              <div className="text-zinc-400 text-[10px] uppercase font-bold">DIGITAL TWIN HUD</div>
              <div className="flex items-center gap-2 text-zinc-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Rover Telemetry: LINKED</span>
              </div>
              <div className="text-[10px] text-zinc-400">
                State Version: <strong className="text-white">v{twinState?.version || 1}</strong>
              </div>
            </div>

            {/* 3D Scene Controls Guide */}
            <div className="absolute bottom-4 left-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-[11px] font-mono text-zinc-400 backdrop-blur-md">
              Autonomic Orbital Pan • Jezero Basin Floor (-2532m MOLA) • 3D Mesh (60x60 segments)
            </div>
          </div>
        </div>

        {/* Right (1 col): Timeline Event Replay */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span>Event Timeline Replay</span>
            </h3>
            <span className="text-[10px] text-zinc-400">{timeline.length} STEPS</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {timeline.map((step) => (
              <div
                key={step.step}
                onClick={() => handleStepReplay(step.step)}
                className={`p-3 rounded-xl border cursor-pointer transition space-y-1 ${
                  selectedStep === step.step
                    ? 'border-orange-500 bg-orange-950/30 shadow'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-orange-400 font-bold">STEP {step.step}</span>
                  <span className="text-zinc-500">{step.timestamp}</span>
                </div>
                <div className="text-xs font-bold text-zinc-200">{step.title}</div>
                <p className="text-[11px] text-zinc-400 font-sans line-clamp-2">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
