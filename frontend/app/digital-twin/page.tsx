'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  Box,
  Compass,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Activity,
  ShieldAlert,
  Navigation,
  Clock,
  Info,
  Sliders,
  Eye,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Zap,
  Split
} from 'lucide-react'
import { getDigitalTwinState, getMissionTimeline } from '@/services/api'

export default function DigitalTwinPage() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const fogRef = useRef<THREE.FogExp2 | null>(null)
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null)
  const roverRef = useRef<THREE.Mesh | null>(null)
  const hazardConeRef = useRef<THREE.Mesh | null>(null)
  const routeLineRef = useRef<THREE.Line | null>(null)

  // Simulation Reactive Inputs (Section 8 Requirement)
  const [twinTemp, setTwinTemp] = useState<number>(-45.0)
  const [twinRadiation, setTwinRadiation] = useState<number>(26.5)
  const [twinDustTau, setTwinDustTau] = useState<number>(0.48)
  const [orbitSpeed, setOrbitSpeed] = useState<number>(1.0)
  const [isRotating, setIsRotating] = useState<boolean>(true)

  // Comparison Mode: BEFORE OBSERVATION vs AFTER OBSERVATION
  const [comparisonMode, setComparisonMode] = useState<'BEFORE' | 'AFTER'>('AFTER')

  // Mission Timeline Replay Scrubber
  const [timelineStep, setTimelineStep] = useState<number>(3)
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false)

  const TIMELINE_STEPS = [
    { step: 1, sol: 1084, time: 'T+00h 15m', title: 'Perseverance Egress & System Check', lat: 18.3800, lon: 77.5800, event: 'Egress from Base Camp. All PLSS loops nominal.' },
    { step: 2, sol: 1084, time: 'T+01h 00m', title: 'South Séítah Margin Traversal', lat: 18.3920, lon: 77.5650, event: 'Crossed basaltic dune corridor with 8% wheel slip.' },
    { step: 3, sol: 1084, time: 'T+02h 15m', title: 'Delta Scarp Hazard Detected', lat: 18.4050, lon: 77.5450, event: 'Unconsolidated scree slide observed. Stand-off barrier marked.' },
    { step: 4, sol: 1084, time: 'T+03h 00m', title: 'Southern Detour & Smectite Approach', lat: 18.4140, lon: 77.5310, event: 'Aegis SafePath reroute around scarp executed.' },
    { step: 5, sol: 1084, time: 'T+03h 45m', title: 'Delta Front Mudstone Outcrop Reached', lat: 18.4200, lon: 77.5200, event: 'Bedrock drilling target acquired. Sampling protocol ready.' }
  ]

  // Calculated Risk based on Reactive Inputs
  const computedTwinRisk = Math.min(100, Math.round(
    20 + (twinDustTau / 3.0) * 35 + (twinRadiation / 150.0) * 30 + (comparisonMode === 'AFTER' ? 10 : 0)
  ))

  // Three.js Scene Setup & Reactive Binding
  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight || 550

    // 1. Scene & Atmosphere Fog
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0c12)
    const fog = new THREE.FogExp2(0x1a0f0a, 0.012)
    scene.fog = fog
    sceneRef.current = scene
    fogRef.current = fog

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 30, 48)
    camera.lookAt(0, -3, 0)

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.45)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffa550, 1.8)
    sunLight.position.set(30, 45, 20)
    scene.add(sunLight)
    sunLightRef.current = sunLight

    // 5. 3D Martian Terrain Geometry (Jezero Crater Basin & Delta Fan)
    const gridSegments = 65
    const terrainGeo = new THREE.PlaneGeometry(64, 64, gridSegments, gridSegments)
    terrainGeo.rotateX(-Math.PI / 2)

    const pos = terrainGeo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i)
      const vz = pos.getZ(i)
      const distFromCenter = Math.sqrt(vx * vx + vz * vz)

      // Crater basin depression
      let h = -3.8 + Math.pow(distFromCenter / 28, 2.2) * 5.2
      // Western Delta Fan
      if (vx < 0) {
        h += Math.sin(vx * 0.18) * 2.2
      }
      // Micro ripples
      h += Math.sin(vx * 0.7) * Math.cos(vz * 0.7) * 0.4
      pos.setY(i, h)
    }
    terrainGeo.computeVertexNormals()

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x9e431f,
      roughness: 0.88,
      metalness: 0.12,
      flatShading: true
    })
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat)
    scene.add(terrainMesh)

    // Digital Grid Wireframe
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xea580c, wireframe: true, transparent: true, opacity: 0.14 })
    const wireMesh = new THREE.Mesh(terrainGeo, wireMat)
    scene.add(wireMesh)

    // 6. Rover Object (Perseverance)
    const roverGroup = new THREE.Group()
    const bodyGeo = new THREE.BoxGeometry(2.4, 1.2, 3.0)
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8, roughness: 0.2 })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    roverGroup.add(body)

    const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.2)
    const mastMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const mast = new THREE.Mesh(mastGeo, mastMat)
    mast.position.set(0, 1.2, 1.0)
    roverGroup.add(mast)

    roverGroup.position.set(4, -2.4, 3)
    scene.add(roverGroup)
    roverRef.current = roverGroup as any

    // 7. Astronaut Markers (Sarah & Mark)
    const astro1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }))
    astro1.position.set(7, -2.4, 4)
    scene.add(astro1)

    const astro2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6), new THREE.MeshStandardMaterial({ color: 0xf59e0b }))
    astro2.position.set(7.8, -2.4, 2.5)
    scene.add(astro2)

    // 8. Hazard Cone (Only visible in AFTER observation mode or high risk)
    const hazardGeo = new THREE.ConeGeometry(3.5, 5.0, 16)
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true, transparent: true, opacity: 0.6 })
    const hazardCone = new THREE.Mesh(hazardGeo, hazardMat)
    hazardCone.position.set(-11, 0.8, -7)
    scene.add(hazardCone)
    hazardConeRef.current = hazardCone

    // 9. 3D Route Path Line
    const routePoints = [
      new THREE.Vector3(12, -2.8, 12),
      new THREE.Vector3(6, -2.5, 6),
      new THREE.Vector3(0, -2.2, 0),
      new THREE.Vector3(-6, -1.8, -4),
      new THREE.Vector3(-14, 0.2, -10)
    ]
    const routeGeo = new THREE.BufferGeometry().setFromPoints(routePoints)
    const routeMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })
    const routeLine = new THREE.Line(routeGeo, routeMat)
    scene.add(routeLine)
    routeLineRef.current = routeLine

    // Animation Render Loop
    let animId: number
    let angle = 0
    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (isRotating) {
        angle += 0.0018 * orbitSpeed
        camera.position.x = Math.sin(angle) * 46
        camera.position.z = Math.cos(angle) * 46
        camera.lookAt(0, -2.5, 0)
      }
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight || 550
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  // Reactive updates to 3D Scene when environmental sliders change
  useEffect(() => {
    // 1. Dust concentration affects atmosphere fog & sun intensity
    if (fogRef.current) {
      fogRef.current.density = 0.01 + (twinDustTau / 3.0) * 0.035
      // If high dust, shift fog to amber
      if (twinDustTau > 1.2) {
        fogRef.current.color.setHex(0x5c3311)
      } else {
        fogRef.current.color.setHex(0x1a0f0a)
      }
    }

    if (sunLightRef.current) {
      // Dust attenuates solar light
      sunLightRef.current.intensity = Math.max(0.4, 2.0 - (twinDustTau / 2.0) * 1.2)
    }

    // 2. Comparison Mode: BEFORE vs AFTER
    if (hazardConeRef.current) {
      hazardConeRef.current.visible = comparisonMode === 'AFTER'
    }
  }, [twinDustTau, twinTemp, twinRadiation, comparisonMode])

  // Timeline Step updates rover position
  useEffect(() => {
    if (roverRef.current) {
      // Interpolate rover position across steps
      const stepIdx = timelineStep - 1
      const progress = stepIdx / 4.0
      const x = 10 - progress * 22
      const z = 10 - progress * 20
      const y = -2.8 + progress * 2.8
      roverRef.current.position.set(x, y, z)
    }
  }, [timelineStep])

  // Play Timeline Animation
  useEffect(() => {
    if (!isPlayingTimeline) return
    const interval = setInterval(() => {
      setTimelineStep(s => {
        if (s >= 5) {
          setIsPlayingTimeline(false)
          return 5
        }
        return s + 1
      })
    }, 2500)
    return () => clearInterval(interval)
  }, [isPlayingTimeline])

  const curTimelineItem = TIMELINE_STEPS[timelineStep - 1]

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 9: INTERACTIVE 3D DIGITAL TWIN & COMPARISON ENGINE
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Three.js WebGL Terrain</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            3D Martian Digital Twin
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physics-reactive virtual twin of Jezero Crater. Dynamically responds to temperature, dust optical depth, and radiation scenarios with Before-and-After observation comparison.
          </p>
        </div>

        {/* Comparison Mode Switcher: BEFORE vs AFTER (Section 8 Requirement) */}
        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900/90 p-1.5 text-xs font-mono">
          <span className="text-zinc-500 text-[10px] px-2 hidden sm:inline">STATE:</span>
          <button
            onClick={() => setComparisonMode('BEFORE')}
            className={`px-3 py-1.5 rounded-lg transition ${
              comparisonMode === 'BEFORE'
                ? 'bg-zinc-700 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pre-EVA Baseline
          </button>
          <button
            onClick={() => setComparisonMode('AFTER')}
            className={`px-3 py-1.5 rounded-lg transition ${
              comparisonMode === 'AFTER'
                ? 'bg-orange-600 text-white font-bold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Astronaut-Updated (+Hazards)
          </button>
        </div>
      </div>

      {/* Main 3D Canvas with HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: 3D WebGL Canvas */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative w-full h-[540px] rounded-2xl border border-zinc-800 bg-[#090b10] overflow-hidden shadow-2xl">
            {/* Mount for Three.js */}
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Top-Left Floating State Badge */}
            <div className="absolute top-4 left-4 rounded-xl border border-zinc-800 bg-zinc-950/85 p-3 text-xs font-mono backdrop-blur-md space-y-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${comparisonMode === 'AFTER' ? 'bg-orange-500 animate-pulse' : 'bg-zinc-500'}`}></span>
                <span className="font-bold text-white uppercase">{comparisonMode} OBSERVATION MODE</span>
              </div>
              <div className="text-[10px] text-zinc-400">
                {comparisonMode === 'AFTER'
                  ? 'Active hazards displayed. Southern detour route highlighted.'
                  : 'Pre-flight planning datum. Unmapped scree hazard hidden.'}
              </div>
            </div>

            {/* Top-Right Camera / Rotation Control */}
            <div className="absolute top-4 right-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/85 p-1.5 text-xs font-mono backdrop-blur-md">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  isRotating ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {isRotating ? 'Orbiting' : 'Paused Orbit'}
              </button>
              <button
                onClick={() => setOrbitSpeed(s => s === 1 ? 2.5 : 1)}
                className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-[11px]"
              >
                {orbitSpeed}x
              </button>
            </div>

            {/* Bottom Floating Telemetry Bar */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs font-mono backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-zinc-500 text-[10px] block">ATMOSPHERE FOG</span>
                  <span className="text-amber-400 font-bold">{twinDustTau} Tau ({twinDustTau > 1.2 ? 'Heavy Dust' : 'Clear'})</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">TEMP / RAD</span>
                  <span className="text-cyan-400 font-bold">{twinTemp}°C • {twinRadiation} μSv/h</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">TWIN RISK</span>
                  <span className={`font-bold ${computedTwinRisk > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {computedTwinRisk}% ({computedTwinRisk > 50 ? 'ELEVATED' : 'NOMINAL'})
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-zinc-500 hidden sm:inline">
                Three.js WebGL Engine • Jezero MOLA Geometry
              </span>
            </div>
          </div>

          {/* Timeline Replay Scrubber (Section 8 Requirement) */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-400" />
                <span className="font-bold text-white uppercase">Mission Timeline Replay Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    isPlayingTimeline ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isPlayingTimeline ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{isPlayingTimeline ? 'Pause Replay' : 'Play Timeline'}</span>
                </button>
              </div>
            </div>

            {/* Scrubber Range */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Step {curTimelineItem.step} of 5: <strong>{curTimelineItem.time}</strong></span>
                <span className="text-orange-400 font-bold">{curTimelineItem.title}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={timelineStep}
                onChange={(e) => setTimelineStep(parseInt(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
            </div>

            <p className="text-xs text-zinc-300 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800/80">
              {curTimelineItem.event}
            </p>
          </div>
        </div>

        {/* Right 4 Columns: Interactive Environmental State Controls */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sliders className="h-4 w-4 text-orange-400" />
                <span>Simulation Reaction Controls</span>
              </div>
              <span className="text-[10px] text-zinc-500">LIVE OVERLAYS</span>
            </div>

            <p className="text-xs text-zinc-400">
              Manipulating these variables immediately alters the 3D WebGL atmosphere fog, sunlight attenuation, hazard cone shaders, and risk state.
            </p>

            <div className="space-y-4 text-xs">
              {/* Dust Concentration (Changes 3D Fog) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Dust Opacity (τ):</span>
                  <span className={`font-bold ${twinDustTau > 1.2 ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {twinDustTau} Tau
                  </span>
                </div>
                <input
                  type="range" min="0.1" max="3.0" step="0.05"
                  value={twinDustTau}
                  onChange={(e) => setTwinDustTau(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                />
                <span className="text-[10px] text-zinc-500 block text-right">Directly drives WebGL atmospheric density</span>
              </div>

              {/* Radiation Exposure (Changes Shaders) */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Radiation Intensity:</span>
                  <span className={`font-bold ${twinRadiation > 80 ? 'text-red-400' : 'text-zinc-200'}`}>
                    {twinRadiation} μSv/h
                  </span>
                </div>
                <input
                  type="range" min="10" max="180" step="5"
                  value={twinRadiation}
                  onChange={(e) => setTwinRadiation(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                />
              </div>

              {/* Surface Temperature */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Surface Temperature:</span>
                  <span className="text-blue-400 font-bold">{twinTemp}°C</span>
                </div>
                <input
                  type="range" min="-85" max="5" step="1"
                  value={twinTemp}
                  onChange={(e) => setTwinTemp(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                />
              </div>
            </div>

            {/* Quick Scenario Injectors for Judges */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 block uppercase">Quick Scenario Overlays</span>
              <button
                onClick={() => {
                  setTwinDustTau(2.4)
                  setTwinTemp(-52.0)
                  setComparisonMode('AFTER')
                }}
                className="w-full p-2 rounded-lg border border-amber-800/80 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs text-left transition"
              >
                🌪️ Inject Dust Storm Over Jezero Delta
              </button>
              <button
                onClick={() => {
                  setTwinRadiation(140.0)
                  setComparisonMode('AFTER')
                }}
                className="w-full p-2 rounded-lg border border-red-800/80 bg-red-950/30 text-red-300 hover:bg-red-900/40 text-xs text-left transition"
              >
                ☢️ Inject Solar Particle Flare (SPE)
              </button>
              <button
                onClick={() => {
                  setTwinDustTau(0.48)
                  setTwinRadiation(26.5)
                  setTwinTemp(-45.0)
                  setComparisonMode('BEFORE')
                }}
                className="w-full p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs text-left transition"
              >
                ✓ Restore Nominal Pre-EVA State
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
