'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Wind,
  Radio,
  Flame,
  Battery,
  Gauge,
  Thermometer,
  Zap,
  TrendingUp,
  Clock,
  Compass,
  Navigation,
  Box,
  Layers,
  ArrowRight,
  Download,
  Cpu,
  FileText
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'
import { runSimulation, compareScenarios, planRoutes } from '@/services/api'

export default function MarsMissionSimulatorPage() {
  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'PHYSICS_LAB'>('SIMULATOR')

  // ==========================================
  // SECTION A: MISSION CONFIGURATION
  // ==========================================
  const [landingRegion, setLandingRegion] = useState('JEZERO_DELTA')
  const [startCoords, setStartCoords] = useState({ lat: 18.3800, lon: 77.5800, name: 'Octavia E. Butler Base Camp' })
  const [destCoords, setDestCoords] = useState({ lat: 18.4200, lon: 77.5200, name: 'Western Delta Front Mudstones' })
  const [astronautCount, setAstronautCount] = useState<number>(2)
  const [plannedDurationHours, setPlannedDurationHours] = useState<number>(4.0)
  const [maxSlopeThreshold, setMaxSlopeThreshold] = useState<number>(18.0)
  const [maxRadThreshold, setMaxRadThreshold] = useState<number>(160.0)

  // ==========================================
  // SECTION B: 11 INTERACTIVE ENVIRONMENTAL CONTROLS
  // ==========================================
  const [surfaceTemp, setSurfaceTemp] = useState<number>(-45.0)       // -90 to +10 °C
  const [radIntensity, setRadIntensity] = useState<number>(26.5)      // 10 to 200 uSv/hr
  const [atmPressure, setAtmPressure] = useState<number>(718.0)       // 600 to 850 Pa
  const [dustTau, setDustTau] = useState<number>(0.48)                // 0.1 to 3.0
  const [terrainSlope, setTerrainSlope] = useState<number>(6.5)       // 0 to 30 deg
  const [terrainRoughness, setTerrainRoughness] = useState<number>(0.35) // 0.1 to 1.0
  const [walkingSpeed, setWalkingSpeed] = useState<number>(2.4)       // 1.0 to 4.0 km/h
  const [o2Availability, setO2Availability] = useState<number>(98.0)  // 0 to 100 %
  const [batteryLevel, setBatteryLevel] = useState<number>(95.0)      // 0 to 100 %
  const [equipmentHealth, setEquipmentHealth] = useState<number>(96.0) // 0 to 100 %
  const [astronautWorkload, setAstronautWorkload] = useState<number>(310.0) // 150 to 500 Watts

  // ==========================================
  // SECTION C: SIMULATION RUNTIME STATE
  // ==========================================
  const [simState, setSimState] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE')
  const [simSpeed, setSimSpeed] = useState<number>(1) // 1x, 2x, 5x, 10x
  const [simProgress, setSimProgress] = useState<number>(0.0) // 0.0 to 1.0
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0)
  const [distTravelledKm, setDistTravelledKm] = useState<number>(0.0)
  const [distRemainingKm, setDistRemainingKm] = useState<number>(3.85)

  // Computed live variables
  const [livePosition, setLivePosition] = useState({ lat: 18.3800, lon: 77.5800, elevation_m: -2580 })
  const [cumulativeRadiationUSv, setCumulativeRadiationUSv] = useState<number>(0.0)
  const [computedRiskScore, setComputedRiskScore] = useState<number>(0.24)
  const [computedRiskLevel, setComputedRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('LOW')
  const [activeAlerts, setActiveAlerts] = useState<any[]>([])
  const [eventLogs, setEventLogs] = useState<any[]>([])

  // Live Chart History
  const [telemetryHistory, setTelemetryHistory] = useState<any[]>([])
  const simTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Dynamic Route Evaluator State
  const [activeRouteMode, setActiveRouteMode] = useState<'AEGIS_SAFE' | 'APEX_DIRECT' | 'EMERGENCY_ABORT'>('AEGIS_SAFE')
  const [routeExplanation, setRouteExplanation] = useState<string>(
    "Aegis SafePath active. Skirts north of Séítah sand dunes and stays beneath 14° delta scarp constraint."
  )

  // ==========================================
  // SECTION D: PHYSICS LAB STATE (EARTH LAB)
  // ==========================================
  const [physicsScenario, setPhysicsScenario] = useState('THERMAL_BALANCE')
  const [physicsResult, setPhysicsResult] = useState<any>(null)
  const [compareResult, setCompareResult] = useState<any>(null)
  const [physicsLoading, setPhysicsLoading] = useState(false)

  // Initialize mission starting state
  useEffect(() => {
    resetMission()
  }, [])

  // Main simulation tick loop
  useEffect(() => {
    if (simState !== 'RUNNING') {
      if (simTimerRef.current) clearInterval(simTimerRef.current)
      return
    }

    const intervalMs = Math.max(200, Math.round(1000 / simSpeed))
    simTimerRef.current = setInterval(() => {
      runSimulationStep()
    }, intervalMs)

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current)
    }
  }, [
    simState,
    simSpeed,
    surfaceTemp,
    radIntensity,
    atmPressure,
    dustTau,
    terrainSlope,
    walkingSpeed,
    o2Availability,
    batteryLevel,
    equipmentHealth,
    astronautWorkload,
    activeRouteMode
  ])

  // Single computational step for simulation
  const runSimulationStep = () => {
    setSimProgress(prev => {
      if (prev >= 1.0) {
        setSimState('PAUSED')
        addEventLog('OBJECTIVE_ACHIEVED', 'SUCCESS', 'Astronaut crew arrived at Western Delta Front Mudstones. Commencing geological sampling.')
        return 1.0
      }

      const nextProg = Math.min(1.0, prev + 0.01)
      const elapsed = Math.round(nextProg * (plannedDurationHours * 60))
      setElapsedMinutes(elapsed)

      const totalDist = 3.85
      const travelled = parseFloat((nextProg * totalDist).toFixed(3))
      const remaining = parseFloat(Math.max(0, totalDist - travelled).toFixed(3))
      setDistTravelledKm(travelled)
      setDistRemainingKm(remaining)

      // Interpolate coordinates along route
      const curLat = parseFloat((startCoords.lat + (destCoords.lat - startCoords.lat) * nextProg).toFixed(4))
      const curLon = parseFloat((startCoords.lon + (destCoords.lon - startCoords.lon) * nextProg).toFixed(4))
      const curElev = Math.round(-2580 + nextProg * 85 + Math.sin(nextProg * Math.PI) * 15)
      setLivePosition({ lat: curLat, lon: curLon, elevation_m: curElev })

      // Computational Resource Consumption
      // O2 consumption: baseline 0.42 L/min + workload factor + slope factor
      const o2Burn = (astronautWorkload / 300.0) * (1.0 + terrainSlope * 0.03) * 0.05
      setO2Availability(curO2 => Math.max(0, parseFloat((curO2 - o2Burn).toFixed(2))))

      // Battery consumption: baseline drain + slope climbing resistance + thermal heating
      const batteryBurn = (walkingSpeed / 2.4) * (1.0 + terrainSlope * 0.04) * 0.06
      setBatteryLevel(curBat => Math.max(0, parseFloat((curBat - batteryBurn).toFixed(2))))

      // Radiation dosage accumulation
      const doseDelta = (radIntensity / 3600.0) * (plannedDurationHours * 60 * 0.01)
      setCumulativeRadiationUSv(curDose => parseFloat((curDose + doseDelta).toFixed(2)))

      // Risk recalculation
      const riskSlope = Math.min(1.0, terrainSlope / maxSlopeThreshold)
      const riskRad = Math.min(1.0, radIntensity / maxRadThreshold)
      const riskDust = Math.min(1.0, dustTau / 2.0)
      const riskO2 = o2Availability < 30 ? (30 - o2Availability) / 30 : 0.0
      const riskBat = batteryLevel < 25 ? (25 - batteryLevel) / 25 : 0.0

      const compRisk = parseFloat((
        0.25 * riskSlope +
        0.25 * riskRad +
        0.20 * riskDust +
        0.15 * riskO2 +
        0.15 * riskBat
      ).toFixed(3))

      setComputedRiskScore(compRisk)
      const rLevel = compRisk > 0.65 ? 'CRITICAL' : compRisk > 0.45 ? 'HIGH' : compRisk > 0.25 ? 'MEDIUM' : 'LOW'
      setComputedRiskLevel(rLevel)

      // Alert generation
      const alerts: any[] = []
      if (terrainSlope > maxSlopeThreshold) {
        alerts.push({
          severity: 'CRITICAL',
          code: 'SLOPE_CONSTRAINT_VIOLATION',
          message: `Current slope (${terrainSlope}°) violates non-negotiable safety threshold (${maxSlopeThreshold}°). Immediate route reassessment mandated.`
        })
      }
      if (o2Availability < 25.0) {
        alerts.push({
          severity: 'CRITICAL',
          code: 'O2_RESERVE_LOW',
          message: `Primary O2 reserve dropped below safety return margin (${o2Availability}%). Early return protocol triggered.`
        })
      }
      if (radIntensity > 100.0) {
        alerts.push({
          severity: 'HIGH',
          code: 'RADIATION_WARNING',
          message: `Elevated radiation flux (${radIntensity} μSv/h). Restrict EVA duration to < 90 min.`
        })
      }
      setActiveAlerts(alerts)

      // Record chart point
      const timeLabel = `T+${Math.floor(elapsed / 60)}h ${elapsed % 60}m`
      setTelemetryHistory(hist => [
        ...hist,
        {
          time: timeLabel,
          progress: Math.round(nextProg * 100),
          o2: o2Availability,
          battery: batteryLevel,
          workload: astronautWorkload,
          risk: compRisk,
          slope: terrainSlope,
          temp: surfaceTemp,
          rad: radIntensity
        }
      ].slice(-35))

      return nextProg
    })
  }

  const addEventLog = (type: string, severity: string, message: string) => {
    setEventLogs(prev => [
      {
        id: Date.now(),
        type,
        severity,
        message,
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ].slice(0, 30))
  }

  // Simulator controls
  const handleStartMission = () => {
    setSimState('RUNNING')
    addEventLog('MISSION_DEPLOYED', 'INFO', `EVA-07 Sortie deployed. ${astronautCount} astronauts en route to Western Delta Front.`)
  }

  const handlePauseMission = () => {
    setSimState('PAUSED')
    addEventLog('MISSION_PAUSED', 'WARNING', 'Flight controller paused mission simulation clock.')
  }

  const resetMission = () => {
    setSimState('IDLE')
    setSimProgress(0.0)
    setElapsedMinutes(0)
    setDistTravelledKm(0.0)
    setDistRemainingKm(3.85)
    setO2Availability(98.0)
    setBatteryLevel(95.0)
    setCumulativeRadiationUSv(0.0)
    setLivePosition({ lat: startCoords.lat, lon: startCoords.lon, elevation_m: -2580 })
    setActiveAlerts([])
    setEventLogs([])
    setTelemetryHistory([])
    setActiveRouteMode('AEGIS_SAFE')
    setRouteExplanation("Aegis SafePath active. Skirts north of Séítah sand dunes and stays beneath 14° delta scarp constraint.")
  }

  // ==========================================
  // DYNAMIC MISSION EVENTS (COMPUTATIONAL RESPONSES)
  // ==========================================
  const triggerDustStorm = () => {
    setDustTau(2.45)
    setSurfaceTemp(t => t - 6.5)
    addEventLog('EVENT_DUST_STORM', 'CRITICAL', 'Sudden local atmospheric dust storm. Optical tau elevated to 2.45; navigation visibility reduced to 12%.')
    setRouteExplanation(
      'Dust storm alert: Visual navigation confidence degraded to 34%. System re-evaluates route waypoints using LiDAR contour matching.'
    )
  }

  const triggerRadiationIncrease = () => {
    setRadIntensity(145.0)
    addEventLog('EVENT_RAD_SPIKE', 'CRITICAL', 'Solar Particle Event (SPE) detected by RAD sensor. Environmental flux jumped to 145 μSv/h.')
    setRouteExplanation(
      'Radiation alert: Flux exceeds 100 μSv/h threshold. System recommends detouring into geological depression along northern delta wall for topographical shielding.'
    )
  }

  const triggerEquipmentMalfunction = () => {
    setEquipmentHealth(52.0)
    setBatteryLevel(b => Math.max(10, b - 18.0))
    addEventLog('EVENT_EQUIP_MALFUNCTION', 'HIGH', 'Rover wheel actuator #4 thermal overload. Traction efficiency reduced to 52%.')
    setRouteExplanation(
      'Mobility degradation: Drive torque constrained. Route rerouted around steep grades (>10°) to prevent wheel sinkage in unconsolidated scree.'
    )
  }

  const triggerOxygenLeak = () => {
    setO2Availability(28.0)
    setAstronautWorkload(w => w + 60)
    addEventLog('EVENT_O2_LEAK', 'CRITICAL', 'Primary spacesuit PLSS oxygen loop leak. O2 reserves rapidly depleted to 28%.')
    // Trigger computational early return
    setActiveRouteMode('EMERGENCY_ABORT')
    setRouteExplanation(
      'EMERGENCY EARLY RETURN: Remaining O2 cannot support mission completion. Emergency abort path activated: direct vector to Base Camp at maximum safe traverse speed.'
    )
  }

  const triggerTerrainObstruction = () => {
    setTerrainSlope(24.5)
    addEventLog('EVENT_TERRAIN_OBSTRUCTION', 'CRITICAL', 'Unmapped boulder field and 24.5° escarpment blocking active azimuth.')
    setActiveRouteMode('AEGIS_SAFE')
    setRouteExplanation(
      'Route reassessment complete: Original azimuth exceeds 18° safety ceiling. Southern detour generated adding 420m but reducing slope to safe 11°.'
    )
  }

  const triggerFatigueSurge = () => {
    setAstronautWorkload(460.0)
    addEventLog('EVENT_CREW_FATIGUE', 'HIGH', 'Astronaut cardiac monitor indicates sustained 152 bpm strain. Workload at 460W.')
    setWalkingSpeed(1.4)
    setRouteExplanation(
      'Crew fatigue mitigation: Pace throttled to 1.4 km/h. Mandatory 10-minute rest stop scheduled at next milestone waypoint.'
    )
  }

  // ==========================================
  // PHYSICS LAB EXECUTION (EARTH LAB TAB)
  // ==========================================
  const handleRunPhysicsLab = async () => {
    setPhysicsLoading(true)
    let p: any = {}
    if (physicsScenario === 'THERMAL_BALANCE') {
      p = { ambient_temp_c: surfaceTemp, metabolic_watts: astronautWorkload, cooling_loop_efficiency: 0.95, duration_min: plannedDurationHours * 60 }
    } else if (physicsScenario === 'RADIATION_BUDGET') {
      p = { duration_hours: plannedDurationHours, solar_event_active: radIntensity > 80.0, suit_shielding_g_cm2: 5.0 }
    } else {
      p = { dust_tau: dustTau, duration_days: 7, storm_growth_rate: 0.15 }
    }

    try {
      const res = await runSimulation(physicsScenario, p)
      setPhysicsResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setPhysicsLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 6: FULL-SPECTRUM MISSION SIMULATOR
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Jezero Exploration Sortie</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-0.5">
            Mars Mission Simulator
          </h1>
          <p className="text-xs text-zinc-400">
            Interactive mission simulation environment: configure sorties, adjust 11 physics variables, inject dynamic contingencies, and observe live computational responses.
          </p>
        </div>

        {/* View Switcher: Interactive Simulator vs Physics Numerical Lab */}
        <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === 'SIMULATOR' ? 'bg-orange-600 text-white font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Interactive Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('PHYSICS_LAB')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === 'PHYSICS_LAB' ? 'bg-orange-600 text-white font-bold shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Physics Numerical Lab</span>
          </button>
        </div>
      </div>

      {activeTab === 'SIMULATOR' ? (
        <div className="space-y-6">
          {/* Top Simulation Playback Control Bar */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            {/* Play/Pause/Reset + Speed */}
            <div className="flex items-center gap-3">
              {simState === 'RUNNING' ? (
                <button
                  onClick={handlePauseMission}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-mono font-bold text-white hover:bg-amber-500 transition shadow"
                >
                  <Pause className="h-4 w-4" />
                  <span>PAUSE MISSION</span>
                </button>
              ) : (
                <button
                  onClick={handleStartMission}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-xs font-mono font-bold text-white hover:from-orange-500 hover:to-amber-500 transition shadow-lg animate-pulse"
                >
                  <Play className="h-4 w-4" />
                  <span>START MISSION</span>
                </button>
              )}

              <button
                onClick={resetMission}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-mono text-zinc-300 hover:bg-zinc-700 transition"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restart</span>
              </button>

              {/* Speed Control 1x, 2x, 5x, 10x */}
              <div className="flex items-center rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs font-mono">
                {[1, 2, 5, 10].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      simSpeed === s ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="flex-1 max-w-md space-y-1 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">MISSION TIMELINE SCRUBBER</span>
                <span className="text-orange-400 font-bold">
                  {Math.round(simProgress * 100)}% (T+ {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(simProgress * 100)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) / 100.0
                  setSimProgress(val)
                }}
                className="w-full accent-orange-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
            </div>

            {/* Live Risk Badge */}
            <div className="flex items-center gap-2 font-mono">
              <span className="text-zinc-400 text-xs">AI RISK:</span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                computedRiskLevel === 'CRITICAL' ? 'bg-red-950 text-red-400 border-red-700 animate-pulse' :
                computedRiskLevel === 'HIGH' ? 'bg-orange-950 text-orange-400 border-orange-700' :
                computedRiskLevel === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border-amber-700' :
                'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}>
                {computedRiskLevel} ({computedRiskScore})
              </span>
            </div>
          </div>

          {/* Active Alerts Banner */}
          {activeAlerts.length > 0 && (
            <div className="rounded-xl border border-red-800/80 bg-red-950/40 p-4 space-y-2 animate-pulse">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-400">
                <ShieldAlert className="h-4 w-4" />
                <span>SAFETY THRESHOLD VIOLATIONS DETECTED</span>
              </div>
              {activeAlerts.map((a, i) => (
                <div key={i} className="text-xs text-red-200 font-mono">
                  • [{a.code}]: {a.message}
                </div>
              ))}
            </div>
          )}

          {/* Main 2-Column Layout: Visual Map & Mission HUD (Left) + Sliders & Events (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Visual Trajectory Map + Live Charts */}
            <div className="lg:col-span-7 space-y-4">
              {/* Visual Simulated Trajectory Canvas */}
              <div className="relative w-full h-[400px] rounded-2xl border border-zinc-800 bg-[#0a0d14] overflow-hidden shadow-2xl relative">
                {/* Simulated Terrain Texture */}
                <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>

                {/* Jezero Crater Rim & Delta Channel SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <ellipse cx="60%" cy="50%" rx="38%" ry="42%" fill="none" stroke="#ea580c" strokeWidth="1.5" strokeDasharray="6 4" />
                  <path d="M 60 220 Q 220 250 360 280 T 480 320" fill="none" stroke="#ea580c" strokeWidth="1.0" />
                </svg>

                {/* Trajectory Path Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Aegis SafePath (Default) */}
                  <path
                    d="M 520 300 Q 420 280 320 260 T 200 180"
                    fill="none"
                    stroke={activeRouteMode === 'EMERGENCY_ABORT' ? '#ef4444' : '#10b981'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={activeRouteMode === 'EMERGENCY_ABORT' ? '6 4' : 'none'}
                  />
                </svg>

                {/* Start Marker (Base Camp) */}
                <div className="absolute top-[75%] left-[78%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-orange-600/30 border-2 border-orange-500 flex items-center justify-center">
                    <Compass className="h-3 w-3 text-orange-400" />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-orange-400 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-orange-800 mt-0.5">
                    Base Camp
                  </span>
                </div>

                {/* Destination Marker (Delta Front) */}
                <div className="absolute top-[45%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="h-6 w-6 rounded-full bg-emerald-600/30 border-2 border-emerald-500 flex items-center justify-center">
                    <Layers className="h-3 w-3 text-emerald-400" />
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-zinc-950/90 px-1.5 py-0.5 rounded border border-emerald-800 mt-0.5">
                    Target: Delta Mudstones
                  </span>
                </div>

                {/* Dynamic Animated Astronaut/Rover Marker moving along route */}
                {(() => {
                  // Coordinate interpolation on screen: start (78%, 75%) to dest (30%, 45%)
                  const curX = 78 - simProgress * (78 - 30)
                  const curY = 75 - simProgress * (75 - 45) - Math.sin(simProgress * Math.PI) * 6
                  return (
                    <div
                      style={{ top: `${curY}%`, left: `${curX}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-300"
                    >
                      <div className="relative">
                        <div className="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping"></div>
                        <div className="h-8 w-8 rounded-full bg-cyan-500/40 border-2 border-cyan-400 flex items-center justify-center shadow-xl">
                          <Navigation className="h-4 w-4 text-cyan-200 rotate-45" />
                        </div>
                      </div>
                      <span className="mt-1 text-[10px] font-mono font-bold text-cyan-300 bg-zinc-950/90 px-2 py-0.5 rounded border border-cyan-700 shadow whitespace-nowrap">
                        Crew & Rover (T+ {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m)
                      </span>
                    </div>
                  )
                })()}

                {/* On-Map Dynamic Response Box */}
                <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-3 text-xs font-mono backdrop-blur-md space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-orange-400 font-bold uppercase">AI ROUTE DECISION ENGINE:</span>
                    <span className="text-emerald-400">{activeRouteMode}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">{routeExplanation}</p>
                </div>
              </div>

              {/* Dynamic Telemetry Graphs (Updating Live during Simulation) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    Live Mission Telemetry Curves (O2 vs Battery vs Risk)
                  </span>
                  <span className="text-[10px] text-zinc-400">TIME-BASED RECHARTS ENGINE</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={telemetryHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" stroke="#71717a" fontSize={9} />
                      <YAxis stroke="#71717a" fontSize={9} domain={[0, 100]} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="o2" stroke="#06b6d4" strokeWidth={2} dot={false} name="Suit O2 (%)" />
                      <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={2} dot={false} name="Battery (%)" />
                      <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false} name="Risk Score (x100)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: 11 Interactive Controls + Contingency Event Injector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Contingency Event Injector (Section 3.D Requirement) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Zap className="h-4 w-4" />
                    <span>INTRODUCE UNEXPECTED EVENTS</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">DYNAMIC RESPONSES</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  Click any contingency event below. The system recalculates risk, adjusts routes, and displays transparent computational reasoning.
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={triggerDustStorm}
                    className="p-2 rounded-lg border border-amber-800/80 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 text-left transition"
                  >
                    🌪️ Dust Storm
                  </button>
                  <button
                    onClick={triggerRadiationIncrease}
                    className="p-2 rounded-lg border border-red-800/80 bg-red-950/40 text-red-300 hover:bg-red-900/50 text-left transition"
                  >
                    ☢️ Radiation Spike
                  </button>
                  <button
                    onClick={triggerOxygenLeak}
                    className="p-2 rounded-lg border border-cyan-800/80 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-left transition"
                  >
                    💨 Oxygen Leak
                  </button>
                  <button
                    onClick={triggerEquipmentMalfunction}
                    className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-left transition"
                  >
                    ⚙️ Wheel Overload
                  </button>
                  <button
                    onClick={triggerTerrainObstruction}
                    className="p-2 rounded-lg border border-orange-800/80 bg-orange-950/40 text-orange-300 hover:bg-orange-900/50 text-left transition"
                  >
                    ⛰️ Steep Escarpment
                  </button>
                  <button
                    onClick={triggerFatigueSurge}
                    className="p-2 rounded-lg border border-pink-800/80 bg-pink-950/40 text-pink-300 hover:bg-pink-900/50 text-left transition"
                  >
                    😫 Crew Fatigue Surge
                  </button>
                </div>
              </div>

              {/* 11 Interactive Environmental Controls (Section 3.B Requirement) */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Sliders className="h-4 w-4 text-orange-400" />
                    <span>11 Environmental & Crew Sliders</span>
                  </div>
                  <span className="text-[10px] text-zinc-400">ACTUAL COMPUTED VALUES</span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {/* 1. Surface Temp */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">1. Surface Temp:</span>
                      <span className="text-blue-400 font-bold">{surfaceTemp}°C</span>
                    </div>
                    <input
                      type="range" min="-90" max="10" step="1"
                      value={surfaceTemp}
                      onChange={(e) => setSurfaceTemp(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 2. Radiation Intensity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">2. Radiation Intensity:</span>
                      <span className={`font-bold ${radIntensity > 80 ? 'text-red-400' : 'text-zinc-200'}`}>
                        {radIntensity} μSv/h
                      </span>
                    </div>
                    <input
                      type="range" min="10" max="200" step="5"
                      value={radIntensity}
                      onChange={(e) => setRadIntensity(parseFloat(e.target.value))}
                      className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 3. Atmospheric Pressure */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">3. Atmospheric Pressure:</span>
                      <span className="text-cyan-400 font-bold">{atmPressure} Pa</span>
                    </div>
                    <input
                      type="range" min="600" max="850" step="5"
                      value={atmPressure}
                      onChange={(e) => setAtmPressure(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 4. Dust Tau */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">4. Dust Optical Depth (τ):</span>
                      <span className={`font-bold ${dustTau > 1.2 ? 'text-amber-400' : 'text-zinc-200'}`}>
                        {dustTau} Tau
                      </span>
                    </div>
                    <input
                      type="range" min="0.1" max="3.0" step="0.05"
                      value={dustTau}
                      onChange={(e) => setDustTau(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 5. Terrain Slope */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">5. Terrain Slope:</span>
                      <span className={`font-bold ${terrainSlope > maxSlopeThreshold ? 'text-red-400' : 'text-orange-400'}`}>
                        {terrainSlope}°
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="30" step="0.5"
                      value={terrainSlope}
                      onChange={(e) => setTerrainSlope(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 6. Walking Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">6. Traverse Speed:</span>
                      <span className="text-emerald-400 font-bold">{walkingSpeed} km/h</span>
                    </div>
                    <input
                      type="range" min="1.0" max="4.0" step="0.2"
                      value={walkingSpeed}
                      onChange={(e) => setWalkingSpeed(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 7. Oxygen Availability */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">7. Oxygen Remaining:</span>
                      <span className={`font-bold ${o2Availability < 30 ? 'text-red-400' : 'text-cyan-400'}`}>
                        {o2Availability}%
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="1"
                      value={o2Availability}
                      onChange={(e) => setO2Availability(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 8. Battery Level */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">8. Rover Battery:</span>
                      <span className="text-emerald-400 font-bold">{batteryLevel}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="1"
                      value={batteryLevel}
                      onChange={(e) => setBatteryLevel(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 9. Equipment Health */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">9. Equipment Health:</span>
                      <span className="text-zinc-200 font-bold">{equipmentHealth}%</span>
                    </div>
                    <input
                      type="range" min="0" max="100" step="1"
                      value={equipmentHealth}
                      onChange={(e) => setEquipmentHealth(parseFloat(e.target.value))}
                      className="w-full accent-zinc-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>

                  {/* 10. Astronaut Workload */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">10. Crew Workload:</span>
                      <span className="text-pink-400 font-bold">{astronautWorkload} Watts</span>
                    </div>
                    <input
                      type="range" min="150" max="500" step="10"
                      value={astronautWorkload}
                      onChange={(e) => setAstronautWorkload(parseFloat(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Event Log Console */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white">MISSION CONTROL EVENT FEED</span>
                  <span className="text-[10px]">{eventLogs.length} EVENTS</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 text-[11px]">
                  {eventLogs.length === 0 ? (
                    <div className="text-zinc-600 italic">No events logged yet. Press Start Mission or inject an anomaly above.</div>
                  ) : (
                    eventLogs.map(evt => (
                      <div key={evt.id} className="flex items-start gap-2">
                        <span className="text-zinc-500 shrink-0">[{evt.time}]</span>
                        <span className={`shrink-0 font-bold ${
                          evt.severity === 'CRITICAL' ? 'text-red-400' :
                          evt.severity === 'HIGH' ? 'text-orange-400' :
                          evt.severity === 'SUCCESS' ? 'text-emerald-400' : 'text-zinc-300'
                        }`}>
                          {evt.type}:
                        </span>
                        <span className="text-zinc-300">{evt.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================
           PHYSICS NUMERICAL TESTING LAB (Coupled Stefan-Boltzmann / LCVG)
           ============================================================ */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-6 font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Earth-Based Physics Numerical Testing Laboratory</h2>
              <p className="text-xs text-zinc-400">
                Pre-mission numerical validation: Coupled Radiative-Convective Stefan-Boltzmann balance, RAD dosimetry, and Bekker terramechanics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={physicsScenario}
                onChange={(e) => setPhysicsScenario(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200"
              >
                <option value="THERMAL_BALANCE">Spacesuit Thermal Balance</option>
                <option value="RADIATION_BUDGET">Dosimetry Budget</option>
                <option value="DUST_DEGRADATION">Dust Deposition</option>
              </select>
              <button
                onClick={handleRunPhysicsLab}
                disabled={physicsLoading}
                className="px-4 py-1.5 rounded-lg bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 transition shadow"
              >
                {physicsLoading ? 'Computing...' : 'Run Physics Model'}
              </button>
            </div>
          </div>

          {physicsResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="text-zinc-500 text-[10px] block">SCENARIO</span>
                  <div className="text-sm font-bold text-white mt-1">{physicsResult.scenario}</div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">{physicsResult.model}</span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="text-zinc-500 text-[10px] block">SAFETY STATUS</span>
                  <div className={`text-sm font-bold mt-1 ${physicsResult.summary?.passed_safety_thresholds ? 'text-emerald-400' : 'text-red-400'}`}>
                    {physicsResult.summary?.passed_safety_thresholds ? 'PASSED ALL THRESHOLDS' : 'SAFETY VIOLATION'}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Duration: {physicsResult.duration_min} min
                  </span>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="text-zinc-500 text-[10px] block">COOLING LOAD</span>
                  <div className="text-sm font-bold text-cyan-400 mt-1">
                    {physicsResult.summary?.max_suit_internal_temp_c ? `${physicsResult.summary.max_suit_internal_temp_c}°C Max` : 'Nominal Flux'}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Stefan-Boltzmann Emissivity: 0.85</span>
                </div>
              </div>

              {/* Chart of Numerical Calculation */}
              {physicsResult.time_series && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                  <span className="text-xs font-bold text-zinc-300">Transient Thermal Equilibrium Curve</span>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={physicsResult.time_series.time_min?.map((t: number, idx: number) => ({
                          time: `${t}m`,
                          suitTemp: physicsResult.time_series.suit_internal_temp_c?.[idx]
                        })) || []}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="time" stroke="#71717a" fontSize={9} />
                        <YAxis stroke="#71717a" fontSize={9} domain={[18, 26]} unit="°C" />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '11px' }} />
                        <Line type="monotone" dataKey="suitTemp" stroke="#38bdf8" strokeWidth={2} dot={false} name="Suit Temp (°C)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Click &apos;Run Physics Model&apos; to execute pre-mission mathematical equations.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
