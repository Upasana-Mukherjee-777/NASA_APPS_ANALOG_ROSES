'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  Box,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
  Sliders,
  Eye
} from 'lucide-react'
import { getDigitalTwinState } from '@/services/api'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

const TIMELINE_EVENTS = [
  { step: 1, title: 'Base Egress', time: 'T+00h', desc: 'Perseverance departs Octavia Butler camp.' },
  { step: 2, title: 'Séítah Crossing', time: 'T+01h', desc: 'Dune navigation with 8% wheel slip.' },
  { step: 3, title: 'Delta Scarp Slide', time: 'T+02h', desc: 'Loose scree observed. Standoff deployed.' },
  { step: 4, title: 'Reroute Detour', time: 'T+03h', desc: 'Aegis SafePath navigation activated.' },
  { step: 5, title: 'Sampling Outcrop', time: 'T+04h', desc: 'Mudstone drill target acquired.' },
]

export default function DigitalTwinPage() {
  const { playClick, playChime } = useMission()
  const containerRef = useRef<HTMLDivElement>(null)

  // Simulation & Observation Slider
  const [obsSplit, setObsSplit] = useState(50) // 0% = Before Observation, 100% = After Observation
  const [currentStep, setCurrentStep] = useState(3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)

  // Three.js References
  const roverMeshRef = useRef<THREE.Group | null>(null)
  const hazardConeRef = useRef<THREE.Mesh | null>(null)
  const terrainMeshRef = useRef<THREE.Mesh | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x06070a)
    scene.fog = new THREE.FogExp2(0x180d08, 0.015)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 24, 38)
    camera.lookAt(0, -2, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Lighting
    const ambient = new THREE.AmbientLight(0xffddbb, 0.5)
    scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xffa040, 2.0)
    sun.position.set(25, 40, 20)
    scene.add(sun)

    // Terrain Mesh with MOLA/Elevation heightfield
    const segments = 60
    const terrainGeo = new THREE.PlaneGeometry(55, 55, segments, segments)
    terrainGeo.rotateX(-Math.PI / 2)

    const pos = terrainGeo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const dist = Math.sqrt(x * x + z * z)
      let y = -3.5 + Math.pow(dist / 24, 2) * 4.5
      if (x < 0) y += Math.sin(x * 0.2) * 2.0 // Delta fan
      y += Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.3 // Regolith ripples
      pos.setY(i, y)
    }
    terrainGeo.computeVertexNormals()

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x9e431f,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    })
    const terrain = new THREE.Mesh(terrainGeo, terrainMat)
    scene.add(terrain)
    terrainMeshRef.current = terrain

    // Wireframe overlay for digital twin aesthetic
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xea580c, wireframe: true, transparent: true, opacity: 0.15 })
    const wireframe = new THREE.Mesh(terrainGeo, wireMat)
    scene.add(wireframe)

    // 3D Rover Model
    const rover = new THREE.Group()
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.0, 2.8),
      new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.8, roughness: 0.2 })
    )
    rover.add(chassis)

    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    )
    mast.position.set(0, 1.0, 0.8)
    rover.add(mast)

    rover.position.set(3, -1.8, 2)
    scene.add(rover)
    roverMeshRef.current = rover

    // Pulsing 3D Volumetric Hazard Zone (Translucent Cone)
    const hazardGeo = new THREE.CylinderGeometry(4.5, 0.1, 8.0, 32, 1, true)
    const hazardMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    })
    const hazardCone = new THREE.Mesh(hazardGeo, hazardMat)
    hazardCone.position.set(-6, 1.5, -4)
    scene.add(hazardCone)
    hazardConeRef.current = hazardCone

    // Interactive Drag to Rotate Camera
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let theta = 0
    let phi = 0.55

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      prevMouseX = e.clientX
      prevMouseY = e.clientY

      theta -= deltaX * 0.006
      phi = Math.max(0.2, Math.min(1.4, phi + deltaY * 0.006))

      const radius = 45
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta)
      camera.position.y = radius * Math.cos(phi)
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta)
      camera.lookAt(0, -2, 0)
    }

    const onMouseUp = () => { isDragging = false }

    renderer.domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Animation Loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      if (autoRotate && !isDragging) {
        theta += 0.002
        const radius = 45
        camera.position.x = radius * Math.sin(phi) * Math.sin(theta)
        camera.position.y = radius * Math.cos(phi)
        camera.position.z = radius * Math.sin(phi) * Math.cos(theta)
        camera.lookAt(0, -2, 0)
      }

      // Pulse Hazard Cone Volume
      if (hazardConeRef.current) {
        const s = 1 + Math.sin(Date.now() * 0.004) * 0.15
        hazardConeRef.current.scale.set(s, 1, s)
      }

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
      renderer.domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      cancelAnimationFrame(animId)
      renderer.dispose()
    }
  }, [autoRotate])

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] overflow-hidden flex flex-col justify-between bg-black">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing select-none" />

      {/* Prominent SIMULATED Digital Twin Ribbon */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/50 bg-amber-950/80 backdrop-blur-xl shadow-2xl text-amber-300 font-mono text-[11px] font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>SIMULATED 3D DIGITAL TWIN — SYNTHETIC HAZARD VOLUMES</span>
        </div>
      </div>

      {/* Top Slider: Before vs After Observation */}
      <div className="relative z-20 p-4 max-w-xl mx-auto w-full pointer-events-auto">
        <div className="rounded-2xl border border-white/15 bg-zinc-950/85 backdrop-blur-2xl p-3 shadow-xl glass-panel">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-zinc-400">◄ PRIOR RECON (ORBITAL)</span>
            <span className="text-white font-bold">TERRAIN OBSERVATION SPLIT</span>
            <span className="text-cyan-400 font-bold">IN-SITU OBSERVATION (LIDAR) ►</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={obsSplit}
            onChange={e => setObsSplit(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-mono text-zinc-400 mt-1">
            <span>Coarse DEM (50m)</span>
            <span className="text-orange-400 font-bold">Split: {obsSplit}%</span>
            <span>Micro-Topography (0.2m)</span>
          </div>
        </div>
      </div>

      {/* Bottom Replay & Timeline Bar */}
      <div className="relative z-20 p-4 max-w-3xl mx-auto w-full pointer-events-auto">
        <div className="rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-4 shadow-2xl glass-panel">
          {/* Timeline Step Indicators */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {TIMELINE_EVENTS.map(evt => {
              const isCurrent = evt.step === currentStep
              return (
                <button
                  key={evt.step}
                  onClick={() => {
                    playClick()
                    setCurrentStep(evt.step)
                  }}
                  className={`p-2 rounded-xl border text-left transition-all touch-react ${
                    isCurrent
                      ? 'border-orange-500 bg-orange-950/60 shadow-lg shadow-orange-950/30'
                      : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-[9px] font-mono text-orange-400 block">{evt.time}</span>
                  <span className="text-xs font-bold text-white block truncate">{evt.title}</span>
                </button>
              )
            })}
          </div>

          {/* Current Event Description (<40 words) */}
          <p className="text-xs text-zinc-300 font-sans text-center">
            {TIMELINE_EVENTS[currentStep - 1]?.desc}
          </p>
        </div>
      </div>
    </div>
  )
}
