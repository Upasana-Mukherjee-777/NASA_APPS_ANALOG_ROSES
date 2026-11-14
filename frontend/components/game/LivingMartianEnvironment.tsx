'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  Sun,
  Moon,
  Wind,
  Compass,
  Zap,
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import { TimeOfDay, WeatherState } from '@/types/game'

interface Particle {
  x: number
  y: number
  size: number
  vx: number
  vy: number
  alpha: number
  life: number
  maxLife: number
}

interface Star {
  x: number
  y: number
  size: number
  baseAlpha: number
  twinkleSpeed: number
}

interface LivingMartianEnvironmentProps {
  interactiveRover?: boolean
  showControls?: boolean
  onRoverMoved?: (pos: { x: number; y: number; lat: number; lon: number }) => void
}

export default function LivingMartianEnvironment({
  interactiveRover = true,
  showControls = true,
  onRoverMoved
}: LivingMartianEnvironmentProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { soundEnabled, playClick, playChime, playScan, triggerAnomalyEvent } = useMission()

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('noon')
  const [weather, setWeather] = useState<WeatherState>('clear')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [roverPos, setRoverPos] = useState({ x: 0.5, y: 0.65 }) // Normalized (0-1)
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null)
  const [isDriving, setIsDriving] = useState(false)
  const [roverHeading, setRoverHeading] = useState(0) // Radians

  const particlesRef = useRef<Particle[]>([])
  const starsRef = useRef<Star[]>([])
  const tracksRef = useRef<Array<{ x: number; y: number; alpha: number }>>([])
  const animFrameRef = useRef<number | null>(null)

  // Initialize stars once
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.65, // upper sky
        size: Math.random() * 1.8 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.05 + 0.02
      })
    }
    starsRef.current = stars
  }, [])

  // Handle canvas click to command rover
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !interactiveRover) return
    const rect = canvasRef.current.getBoundingClientRect()
    const clickX = (e.clientX - rect.left) / rect.width
    const clickY = (e.clientY - rect.top) / rect.height

    // Constrain rover to lower 60% ground plane
    const clampedY = Math.max(0.48, Math.min(0.85, clickY))
    setTargetPos({ x: clickX, y: clampedY })
    setIsDriving(true)
    playClick()

    // Calculate real-world Jezero lat/lon coordinates
    const calcLat = +(18.38 + (0.7 - clampedY) * 0.08).toFixed(4)
    const calcLon = +(77.58 + (clickX - 0.5) * 0.08).toFixed(4)
    if (onRoverMoved) {
      onRoverMoved({ x: clickX, y: clampedY, lat: calcLat, lon: calcLon })
    }
  }

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500)

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }
    window.addEventListener('resize', handleResize)

    // Particle manager
    const spawnParticle = (w: number, h: number): Particle => {
      const isDustStorm = weather === 'dust_storm'
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * (isDustStorm ? 3.5 : 2.0) + 0.5,
        vx: (Math.random() * 1.5 + 0.5) * (isDustStorm ? 3.5 : 1.0),
        vy: (Math.random() - 0.4) * 0.6,
        alpha: Math.random() * (isDustStorm ? 0.6 : 0.3) + 0.1,
        life: 0,
        maxLife: Math.random() * 200 + 100
      }
    }

    // Prepopulate particles
    particlesRef.current = []
    const particleCount = weather === 'dust_storm' ? 120 : weather === 'dust_devil' ? 80 : 40
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push(spawnParticle(width, height))
    }

    let timeTicks = 0

    const render = () => {
      timeTicks += 0.02
      ctx.clearRect(0, 0, width, height)

      // 1. SKY GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65)
      if (timeOfDay === 'dawn') {
        skyGrad.addColorStop(0, '#1a0b1e') // Deep purple dawn
        skyGrad.addColorStop(0.5, '#5c2234') // Crimson
        skyGrad.addColorStop(1, '#c25841') // Burnt peach
      } else if (timeOfDay === 'noon') {
        skyGrad.addColorStop(0, '#753b24') // Butterscotch high Mars sky
        skyGrad.addColorStop(0.6, '#b05a36')
        skyGrad.addColorStop(1, '#d87747') // Sandy amber
      } else if (timeOfDay === 'sunset') {
        skyGrad.addColorStop(0, '#0c142b') // Deep indigo
        skyGrad.addColorStop(0.6, '#462740') // Violet twilight
        skyGrad.addColorStop(0.85, '#226079') // Iconic Blue sunset corona!
        skyGrad.addColorStop(1, '#a6543b') // Red horizon
      } else {
        // Night
        skyGrad.addColorStop(0, '#030611') // Deep interstellar black
        skyGrad.addColorStop(0.7, '#070f24')
        skyGrad.addColorStop(1, '#1b1b36')
      }
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, width, height)

      // 2. CELESTIAL BODIES (Sun / Moons / Stars)
      if (timeOfDay === 'night') {
        // Draw starry sky
        starsRef.current.forEach(star => {
          const alpha = star.baseAlpha + Math.sin(timeTicks * star.twinkleSpeed * 10) * 0.2
          ctx.fillStyle = `rgba(220, 240, 255, ${Math.max(0.1, Math.min(1, alpha))})`
          ctx.beginPath()
          ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2)
          ctx.fill()
        })

        // Phobos (fast moving moon)
        const phobosX = ((timeTicks * 8) % (width + 60)) - 30
        ctx.fillStyle = '#b8aa9c'
        ctx.beginPath()
        ctx.arc(phobosX, height * 0.22, 6, 0, Math.PI * 2)
        ctx.fill()
        // Craters on Phobos
        ctx.fillStyle = '#8f8175'
        ctx.beginPath()
        ctx.arc(phobosX - 1.5, height * 0.22 - 1, 2, 0, Math.PI * 2)
        ctx.fill()

        // Deimos (distant tiny speck)
        ctx.fillStyle = '#ded5cb'
        ctx.beginPath()
        ctx.arc(width * 0.78, height * 0.16, 3, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Draw Sun
        let sunX = width * 0.5
        let sunY = height * 0.28
        let sunColor = '#ffe2b8'
        let sunGlow = '#e67a4c'

        if (timeOfDay === 'dawn') {
          sunX = width * 0.22
          sunY = height * 0.42
          sunColor = '#ffd0a3'
          sunGlow = '#c44d33'
        } else if (timeOfDay === 'sunset') {
          sunX = width * 0.78
          sunY = height * 0.48
          sunColor = '#bde3ff' // Iconic Martian Blue Sunset!
          sunGlow = '#2272a8'
        }

        // Sun Glow Halo
        const glowRad = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 90)
        glowRad.addColorStop(0, sunColor)
        glowRad.addColorStop(0.25, sunGlow)
        glowRad.addColorStop(1, 'transparent')
        ctx.fillStyle = glowRad
        ctx.beginPath()
        ctx.arc(sunX, sunY, 90, 0, Math.PI * 2)
        ctx.fill()

        // Sun Core Disk (Mars sun looks about 2/3 the size of Earth's sun)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(sunX, sunY, 12, 0, Math.PI * 2)
        ctx.fill()
      }

      // 3. DISTANT CRATER RIM & MOUNTAIN SILHOUETTE (Jezero Crater Wall)
      ctx.fillStyle = timeOfDay === 'night' ? '#141428' : timeOfDay === 'sunset' ? '#5a2d2f' : '#873c24'
      ctx.beginPath()
      ctx.moveTo(0, height * 0.52)
      for (let x = 0; x <= width; x += 40) {
        const y = height * 0.52 - Math.sin((x / width) * 5) * 25 - Math.cos((x / width) * 11) * 12
        ctx.lineTo(x, y)
      }
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()

      // 4. MID-GROUND DELTA REMNANT (Kodiak Butte Mesa)
      ctx.fillStyle = timeOfDay === 'night' ? '#1a182d' : timeOfDay === 'sunset' ? '#783832' : '#aa4d2e'
      ctx.beginPath()
      ctx.moveTo(width * 0.2, height * 0.6)
      ctx.lineTo(width * 0.28, height * 0.54)
      ctx.lineTo(width * 0.42, height * 0.54)
      ctx.lineTo(width * 0.48, height * 0.62)
      ctx.lineTo(width * 0.2, height * 0.62)
      ctx.closePath()
      ctx.fill()

      // Stratified layers on Kodiak Butte
      ctx.strokeStyle = timeOfDay === 'night' ? '#25203d' : '#883e28'
      ctx.lineWidth = 1.5
      for (let ly = height * 0.56; ly < height * 0.61; ly += 2.5) {
        ctx.beginPath()
        ctx.moveTo(width * 0.25, ly)
        ctx.lineTo(width * 0.45, ly)
        ctx.stroke()
      }

      // 5. FOREGROUND MARTIAN DUNES & REGOLITH GROUND
      const groundGrad = ctx.createLinearGradient(0, height * 0.58, 0, height)
      if (timeOfDay === 'night') {
        groundGrad.addColorStop(0, '#181b30')
        groundGrad.addColorStop(1, '#0e1122')
      } else if (timeOfDay === 'sunset') {
        groundGrad.addColorStop(0, '#8c4135')
        groundGrad.addColorStop(1, '#53231f')
      } else {
        groundGrad.addColorStop(0, '#bd5a35')
        groundGrad.addColorStop(0.4, '#a24828')
        groundGrad.addColorStop(1, '#78321c')
      }
      ctx.fillStyle = groundGrad
      ctx.beginPath()
      ctx.moveTo(0, height * 0.58)
      ctx.bezierCurveTo(width * 0.25, height * 0.55, width * 0.65, height * 0.64, width, height * 0.59)
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()

      // Dune ripple lines
      ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 2
      for (let d = 0; d < 5; d++) {
        const dy = height * (0.64 + d * 0.07)
        ctx.beginPath()
        ctx.moveTo(0, dy)
        ctx.bezierCurveTo(width * 0.3, dy + 15, width * 0.7, dy - 10, width, dy + 8)
        ctx.stroke()
      }

      // Boulders / Rocks scattered
      ctx.fillStyle = timeOfDay === 'night' ? '#121424' : '#572214'
      const rocks = [
        { x: width * 0.15, y: height * 0.72, w: 16, h: 10 },
        { x: width * 0.32, y: height * 0.82, w: 22, h: 14 },
        { x: width * 0.68, y: height * 0.76, w: 14, h: 9 },
        { x: width * 0.85, y: height * 0.68, w: 26, h: 16 }
      ]
      rocks.forEach(r => {
        ctx.beginPath()
        ctx.ellipse(r.x, r.y, r.w, r.h, 0.2, 0, Math.PI * 2)
        ctx.fill()
      })

      // 6. ROVER TRACKS TRAIL
      tracksRef.current.forEach((tr, idx) => {
        ctx.fillStyle = `rgba(50, 20, 10, ${tr.alpha * 0.35})`
        ctx.fillRect(tr.x * width - 4, tr.y * height - 1.5, 8, 3)
        tr.alpha -= 0.002
      })
      tracksRef.current = tracksRef.current.filter(t => t.alpha > 0.05)

      // 7. ROVER DRIVING PHYSICS & RENDERING
      const curRx = roverPos.x
      const curRy = roverPos.y

      if (targetPos) {
        const dx = targetPos.x - curRx
        const dy = targetPos.y - curRy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        setRoverHeading(angle)

        if (dist > 0.005) {
          const speed = 0.004
          const newX = curRx + Math.cos(angle) * speed
          const newY = curRy + Math.sin(angle) * speed
          setRoverPos({ x: newX, y: newY })

          // Add wheel track
          if (Math.random() < 0.3) {
            tracksRef.current.push({ x: newX, y: newY + 0.02, alpha: 1.0 })
          }
        } else {
          setTargetPos(null)
          setIsDriving(false)
        }
      }

      // Draw Futuristic 6-Wheeled Exploration Rover
      const rx = curRx * width
      const ry = curRy * height
      const rScale = 0.85

      ctx.save()
      ctx.translate(rx, ry)

      // Rover Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
      ctx.beginPath()
      ctx.ellipse(0, 14 * rScale, 36 * rScale, 10 * rScale, 0, 0, Math.PI * 2)
      ctx.fill()

      // 6 Wheels (Rocker-Bogie Bogies)
      ctx.fillStyle = '#27272a'
      const wheelOffsets = [
        { x: -26, y: 10 },
        { x: -14, y: 12 },
        { x: 0, y: 13 },
        { x: 14, y: 12 },
        { x: 26, y: 10 }
      ]
      wheelOffsets.forEach(w => {
        ctx.beginPath()
        ctx.roundRect((w.x - 4) * rScale, (w.y - 4) * rScale, 8 * rScale, 10 * rScale, 2)
        ctx.fill()
      })

      // Rover Chassis Body (Metallic Gold / Clean White)
      ctx.fillStyle = '#e4e4e7'
      ctx.beginPath()
      ctx.roundRect(-24 * rScale, -8 * rScale, 48 * rScale, 18 * rScale, 6)
      ctx.fill()

      // Orange Expedition Stripe
      ctx.fillStyle = '#f97316'
      ctx.fillRect(-22 * rScale, -1 * rScale, 44 * rScale, 4 * rScale)

      // Solar Panel Top Grid
      ctx.fillStyle = '#1e3a8a'
      ctx.beginPath()
      ctx.roundRect(-20 * rScale, -14 * rScale, 40 * rScale, 6 * rScale, 2)
      ctx.fill()

      // MastCam Tower (Sensor suite)
      ctx.strokeStyle = '#a1a1aa'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-8 * rScale, -14 * rScale)
      ctx.lineTo(-12 * rScale, -28 * rScale)
      ctx.stroke()

      // Sensor Head with glowing Cyan Lens
      ctx.fillStyle = '#18181b'
      ctx.fillRect(-18 * rScale, -33 * rScale, 12 * rScale, 8 * rScale)
      ctx.fillStyle = '#00f5ff'
      ctx.beginPath()
      ctx.arc(-12 * rScale, -29 * rScale, 2.5 * rScale, 0, Math.PI * 2)
      ctx.fill()

      // Headlight Beams (activated at night or during dust storm)
      if (timeOfDay === 'night' || weather === 'dust_storm') {
        const beamGrad = ctx.createRadialGradient(24 * rScale, 2 * rScale, 2, 70 * rScale, 18 * rScale, 60)
        beamGrad.addColorStop(0, 'rgba(255, 255, 200, 0.7)')
        beamGrad.addColorStop(0.7, 'rgba(255, 255, 150, 0.15)')
        beamGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = beamGrad
        ctx.beginPath()
        ctx.moveTo(22 * rScale, 2 * rScale)
        ctx.lineTo(85 * rScale, -10 * rScale)
        ctx.lineTo(95 * rScale, 30 * rScale)
        ctx.closePath()
        ctx.fill()
      }

      ctx.restore()

      // 8. DUST STORM & PARTICLES SIMULATION
      if (!reducedMotion) {
        particlesRef.current.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          p.life++

          if (p.x > width || p.y > height || p.y < 0 || p.life > p.maxLife) {
            p.x = -10
            p.y = Math.random() * height
            p.life = 0
          }

          ctx.fillStyle = `rgba(224, 130, 85, ${p.alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      // Dust Devil Whirlwind (if active)
      if (weather === 'dust_devil') {
        const ddx = (width * 0.72) + Math.sin(timeTicks * 2) * 15
        const ddy = height * 0.65
        for (let i = 0; i < 25; i++) {
          const vortexY = ddy - i * 5
          const vortexR = 4 + (i * 1.5) + Math.sin(timeTicks * 5 + i) * 6
          ctx.strokeStyle = `rgba(215, 120, 75, ${0.4 - i * 0.012})`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.ellipse(ddx, vortexY, vortexR, vortexR * 0.4, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [timeOfDay, weather, reducedMotion, roverPos, targetPos])

  return (
    <div className="relative w-full h-[480px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 select-none group">
      {/* Canvas Scene */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Top HUD Overlay: Environmental Controls & Telemetry */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Sol Clock & Sun Phase */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/80 px-3.5 py-1.5 backdrop-blur-xl shadow-lg">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-orange-400">
              <Sun className="w-3.5 h-3.5" />
              <span>SOL 1084</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-300">
              <span className="capitalize font-semibold text-white">{timeOfDay}</span>
              <span>Phase</span>
            </div>
          </div>

          {/* Time of Day Switcher Pills */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-zinc-950/80 p-1 backdrop-blur-xl">
            {(['dawn', 'noon', 'sunset', 'night'] as TimeOfDay[]).map(t => (
              <button
                key={t}
                onClick={() => {
                  playClick()
                  setTimeOfDay(t)
                }}
                className={`rounded-xl px-2.5 py-1 text-[10px] font-mono capitalize transition ${
                  timeOfDay === t
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Weather Presets */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-white/10 bg-zinc-950/80 p-1 backdrop-blur-xl">
            <button
              onClick={() => {
                playClick()
                setWeather('clear')
              }}
              className={`rounded-xl px-2 py-1 text-[10px] font-mono transition ${
                weather === 'clear' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Clear
            </button>
            <button
              onClick={() => {
                playClick()
                setWeather('dust_devil')
                playChime()
              }}
              className={`rounded-xl px-2 py-1 text-[10px] font-mono transition ${
                weather === 'dust_devil' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dust Devil
            </button>
            <button
              onClick={() => {
                playClick()
                setWeather('dust_storm')
                triggerAnomalyEvent('DUST_STORM', 'HIGH')
              }}
              className={`rounded-xl px-2 py-1 text-[10px] font-mono transition ${
                weather === 'dust_storm' ? 'bg-red-600 text-white font-bold animate-pulse' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dust Storm
            </button>
          </div>
        </div>
      )}

      {/* Bottom Interactive Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Drive Instructions */}
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-zinc-950/80 px-3.5 py-1.5 backdrop-blur-md text-[11px] font-mono text-zinc-300 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>
            {isDriving ? (
              <strong className="text-orange-400 animate-pulse">Rover Driving to Coordinates...</strong>
            ) : (
              'Click anywhere on the Martian ground to drive rover'
            )}
          </span>
        </div>

        {/* Rover Quick Telemetry Coordinates */}
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-zinc-950/80 px-3.5 py-1.5 backdrop-blur-md text-[10px] font-mono text-zinc-400 flex items-center gap-3">
          <span>LAT: {(18.38 + (0.7 - roverPos.y) * 0.08).toFixed(4)}°N</span>
          <span>LON: {(77.58 + (roverPos.x - 0.5) * 0.08).toFixed(4)}°E</span>
          <span className="text-emerald-400 font-bold">SOLAR CHG: {timeOfDay === 'noon' ? '98%' : timeOfDay === 'night' ? '0%' : '52%'}</span>
        </div>
      </div>
    </div>
  )
}
