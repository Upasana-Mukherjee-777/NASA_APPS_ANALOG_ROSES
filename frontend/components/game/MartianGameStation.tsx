'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Compass,
  Crosshair,
  ShieldAlert,
  Zap,
  Activity,
  Award,
  Layers,
  Sparkles,
  Mountain,
  Radio,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  BookOpen,
  Camera,
  Download,
  Info,
  HelpCircle,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import { soundEngine } from '@/lib/sound'
import {
  TerrainScanResult,
  GameMission,
  DiscoveryItem,
  AchievementBadge
} from '@/types/game'

// Real planetary landmarks with authentic scientific observations
const EXPLORATION_WAYPOINTS: TerrainScanResult[] = [
  {
    pointId: 'wp-1',
    name: 'Octavia E. Butler Landing Datum',
    lat: 18.380,
    lon: 77.580,
    elevationMeters: -2580,
    slopeDeg: 3.8,
    slopePlainEnglish: 'Gentle, flat volcanic crater floor. Ideal traction for 6-wheel rover mobility.',
    roughnessMeters: 0.12,
    minerals: [
      { name: 'Basaltic Regolith', percent: 55, description: 'Volcanic lava flow remnant', color: '#71717a', isHydrated: false },
      { name: 'Iron Oxide (Hematite)', percent: 30, description: 'Surface oxidized dust layer', color: '#ea580c', isHydrated: false },
      { name: 'Pyroxene', percent: 15, description: 'Igneous rock-forming mineral', color: '#10b981', isHydrated: false }
    ],
    waterIceProbability: 4,
    hazardLevel: 'SAFE',
    hazardNotes: 'Minimal boulder density. Zero steep scarps detected within 500m radius.',
    landingSuitability: 'EXCELLENT',
    scienceImage: '/assets/nasa/PIA24331.jpg',
    scienceTitle: 'High-Resolution HiRISE Jezero Touchdown Surface',
    scienceInstrument: 'Orbital High-Resolution Imaging (0.25 m/pixel)',
    solObserved: 1,
    datasetProvenance: 'MRO HiRISE & MOLA Elevation Datum',
    sampleAvailable: true
  },
  {
    pointId: 'wp-2',
    name: 'Kodiak Butte Isolated Mesa',
    lat: 18.362,
    lon: 77.545,
    elevationMeters: -2515,
    slopeDeg: 14.8,
    slopePlainEnglish: 'Steep stratified cliff. Caution: regolith slippage possible on incline faces.',
    roughnessMeters: 0.48,
    minerals: [
      { name: 'Smectite Clay', percent: 45, description: 'Phyllosilicates formed in calm ancient lake waters', color: '#a855f7', isHydrated: true },
      { name: 'Fluvial Sandstone', percent: 35, description: 'River-deposited sandstone cross-bedding', color: '#eab308', isHydrated: false },
      { name: 'Carbonates', percent: 20, description: 'Precipitated mineral carbonates', color: '#06b6d4', isHydrated: true }
    ],
    waterIceProbability: 18,
    hazardLevel: 'CAUTION',
    hazardNotes: 'Loose scree along basal slope. Keep rover speed below 0.15 km/h.',
    landingSuitability: 'ACCEPTABLE',
    scienceImage: '/assets/nasa/PIA24814.jpg',
    scienceTitle: 'Stratified Delta Outcrop Remnant',
    scienceInstrument: 'Mastcam-Z High Resolution Multispectral Camera',
    solObserved: 64,
    datasetProvenance: 'Planetary Science Archive & Mastcam-Z Mosaic',
    sampleAvailable: true
  },
  {
    pointId: 'wp-3',
    name: 'Western Delta Front Channel',
    lat: 18.420,
    lon: 77.520,
    elevationMeters: -2480,
    slopeDeg: 9.5,
    slopePlainEnglish: 'Moderate slope into ancient river delta mouth. Firm mudstone terrain.',
    roughnessMeters: 0.28,
    minerals: [
      { name: 'Fe/Mg Smectites', percent: 52, description: 'Rich aqueous alteration clay core zone', color: '#9333ea', isHydrated: true },
      { name: 'Quartz/Feldspar Silt', percent: 28, description: 'Fluvial sediment grain matrix', color: '#f59e0b', isHydrated: false },
      { name: 'Sulfates', percent: 20, description: 'Evaporitic sulfate salt ribbons', color: '#38bdf8', isHydrated: true }
    ],
    waterIceProbability: 25,
    hazardLevel: 'SAFE',
    hazardNotes: 'Scattered boulders up to 35cm. Easily circumvented with hazard avoidance.',
    landingSuitability: 'EXCELLENT',
    scienceImage: '/assets/nasa/PIA26252.jpg',
    scienceTitle: 'Clay-Rich Mudstone Core Caching Corridor',
    scienceInstrument: 'SuperCam Remote Chemical Micro-Imager & Spectrometer',
    solObserved: 280,
    datasetProvenance: 'SuperCam Spectral Observations & THEMIS IR',
    sampleAvailable: true
  },
  {
    pointId: 'wp-4',
    name: 'Neretva Vallis Ancient Inflow Channel',
    lat: 18.441,
    lon: 77.492,
    elevationMeters: -2420,
    slopeDeg: 19.4,
    slopePlainEnglish: 'DANGER: Steep 19.4° gorge wall exceeds standard 18° rollover limit! Find side route.',
    roughnessMeters: 0.72,
    minerals: [
      { name: 'Boulder Conglomerate', percent: 40, description: 'High-energy torrential flood deposits', color: '#64748b', isHydrated: false },
      { name: 'Hydrated Silica', percent: 35, description: 'Micro-crystalline silica opaline', color: '#06b6d4', isHydrated: true },
      { name: 'Basaltic Gravel', percent: 25, description: 'Coarse dark volcanic gravel bed', color: '#334155', isHydrated: false }
    ],
    waterIceProbability: 38,
    hazardLevel: 'DANGER',
    hazardNotes: 'High rollover hazard! Rocky scree slope with 40° approach cliffs.',
    landingSuitability: 'HAZARDOUS',
    scienceImage: '/assets/nasa/PIA26207.jpg',
    scienceTitle: 'Neretva Inflow Canyon Breach into Jezero Crater',
    scienceInstrument: 'Thermal Emission Imaging System (THEMIS)',
    solObserved: 412,
    datasetProvenance: 'THEMIS Thermal Infrared & Mars Express HRSC',
    sampleAvailable: true
  },
  {
    pointId: 'wp-5',
    name: 'Mount Sharp Layered Sulfate Unit (Gale Crater)',
    lat: -5.400,
    lon: 137.800,
    elevationMeters: -4150,
    slopeDeg: 11.2,
    slopePlainEnglish: 'Layered mountain flank with mineral sulfate benches. Excellent wheel grip on stone.',
    roughnessMeters: 0.35,
    minerals: [
      { name: 'Magnesium Sulfate', percent: 48, description: 'Ancient evaporating lake salts', color: '#60a5fa', isHydrated: true },
      { name: 'Calcium Sulfate (Gypsum)', percent: 32, description: 'Veins of bright crystal minerals', color: '#f8fafc', isHydrated: true },
      { name: 'Hematite Sand', percent: 20, description: 'Crystalline gray hematite grains', color: '#f97316', isHydrated: false }
    ],
    waterIceProbability: 12,
    hazardLevel: 'SAFE',
    hazardNotes: 'Curiosity traverse path corridor. Safe continuous bedrock travel.',
    landingSuitability: 'EXCELLENT',
    scienceImage: '/assets/nasa/PIA24096.jpg',
    scienceTitle: 'Curiosity Proposed Path up Mount Sharp Sulfate Horizon',
    scienceInstrument: 'Mars Hand Lens Imager (MAHLI) & ChemCam',
    solObserved: 750,
    datasetProvenance: 'Curiosity Traverse Science Path Archive & MOLA',
    sampleAvailable: true
  }
]

const INITIAL_MISSIONS: GameMission[] = [
  {
    id: 'm1',
    code: 'EXP-01',
    title: 'First Footprint: Touchdown & Calibration',
    difficulty: 'CADET',
    brief: 'Establish base communications at Octavia E. Butler datum, perform initial multi-spectral radar sweep, and confirm rover subsystem stability.',
    location: 'Octavia E. Butler Landing',
    status: 'active',
    rewardXP: 150,
    badgeReward: 'Red Planet Pioneer',
    badgeIcon: '🚀',
    objectives: [
      { id: 'm1-1', text: 'Select Octavia E. Butler Landing point', completed: false, targetAction: 'select_wp-1', xp: 40 },
      { id: 'm1-2', text: 'Run Multi-Spectral Terrain Scan', completed: false, targetAction: 'scan_wp-1', xp: 50 },
      { id: 'm1-3', text: 'Cache first geological core sample', completed: false, targetAction: 'sample_wp-1', xp: 60 }
    ]
  },
  {
    id: 'm2',
    code: 'EXP-02',
    title: 'Delta Riverbed Mystery: Ancient Clay Hunt',
    difficulty: 'SURVEYOR',
    brief: 'Traverse across Jezero floor to Kodiak Butte. Scan the stratified bottomset beds for smectite phyllosilicates indicating ancient calm water.',
    location: 'Kodiak Butte Isolated Mesa',
    status: 'locked',
    rewardXP: 250,
    badgeReward: 'Clay Mineralogist',
    badgeIcon: '🏺',
    objectives: [
      { id: 'm2-1', text: 'Drive rover to Kodiak Butte sector', completed: false, targetAction: 'select_wp-2', xp: 70 },
      { id: 'm2-2', text: 'Perform Deep Radar & Spectroscopy scan', completed: false, targetAction: 'scan_wp-2', xp: 80 },
      { id: 'm2-3', text: 'Collect stratified clay specimen', completed: false, targetAction: 'sample_wp-2', xp: 100 }
    ]
  },
  {
    id: 'm3',
    code: 'EXP-03',
    title: 'Steep Scarp Hazards: Rollover Avoidance',
    difficulty: 'SPECIALIST',
    brief: 'Survey Neretva Vallis gorge entrance. Detect steep 19.4° incline hazard, evaluate safe traverse corridors, and identify subterranean ice likelihood.',
    location: 'Neretva Vallis Inflow Channel',
    status: 'locked',
    rewardXP: 350,
    badgeReward: 'Master Navigator',
    badgeIcon: '🧭',
    objectives: [
      { id: 'm3-1', text: 'Inspect Neretva Vallis hazard zone', completed: false, targetAction: 'select_wp-4', xp: 100 },
      { id: 'm3-2', text: 'Detect >18° rollover hazard with scanner', completed: false, targetAction: 'scan_wp-4', xp: 120 },
      { id: 'm3-3', text: 'Preserve Rover Hull above 80%', completed: false, targetAction: 'preserve_hull', xp: 130 }
    ]
  },
  {
    id: 'm4',
    code: 'EXP-04',
    title: 'Mount Sharp Ascent: Layered Sulfates',
    difficulty: 'PIONEER',
    brief: 'Inspect the historical traverse route up Mount Sharp. Scan the sulfate-bearing unit to analyze the drying transition of ancient Mars.',
    location: 'Mount Sharp Sulfate Unit',
    status: 'locked',
    rewardXP: 500,
    badgeReward: 'Ancient Water Seeker',
    badgeIcon: '💧',
    objectives: [
      { id: 'm4-1', text: 'Access Mount Sharp exploration sector', completed: false, targetAction: 'select_wp-5', xp: 150 },
      { id: 'm4-2', text: 'Scan magnesium sulfate evaporite layers', completed: false, targetAction: 'scan_wp-5', xp: 150 },
      { id: 'm4-3', text: 'Cache ancient evaporite core sample', completed: false, targetAction: 'sample_wp-5', xp: 200 }
    ]
  }
]

export default function MartianGameStation() {
  const {
    missionXP,
    addXP,
    playClick,
    playChime,
    playWarning,
    setBuddyMessage,
    badges: userBadges
  } = useMission()

  // Game States
  const [selectedWaypoint, setSelectedWaypoint] = useState<TerrainScanResult>(EXPLORATION_WAYPOINTS[0])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scannedPoints, setScannedPoints] = useState<string[]>([])
  const [missions, setMissions] = useState<GameMission[]>(INITIAL_MISSIONS)
  const [activeMissionId, setActiveMissionId] = useState('m1')

  // Simulated Survival HUD Resources (clearly labeled as game mechanics)
  const [battery, setBattery] = useState(94)
  const [oxygen, setOxygen] = useState(96)
  const [hull, setHull] = useState(100)
  const [sampleBay, setSampleBay] = useState<string[]>([])
  const [showCodex, setShowCodex] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<TerrainScanResult | null>(null)

  // Audio helper
  const handleScanSector = () => {
    if (isScanning) return
    playClick()
    soundEngine.playScan()
    setIsScanning(true)
    setScanProgress(0)

    // Consume slight battery
    setBattery(b => Math.max(10, b - 4))

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          soundEngine.playDiscovery()

          // Mark point as scanned
          if (!scannedPoints.includes(selectedWaypoint.pointId)) {
            setScannedPoints(p => [...p, selectedWaypoint.pointId])
            addXP(60)
          }

          setLastScanResult(selectedWaypoint)

          // Companion Reaction
          if (selectedWaypoint.hazardLevel === 'DANGER') {
            setBuddyMessage(`Careful, Explorer! ${selectedWaypoint.name} has a slope of ${selectedWaypoint.slopeDeg}°! That exceeds our rover's 18° rollover limit.`)
          } else if (selectedWaypoint.waterIceProbability > 20) {
            setBuddyMessage(`Jackpot! High water-ice probability (${selectedWaypoint.waterIceProbability}%) detected at ${selectedWaypoint.name}! Ancient Mars had water here!`)
          } else {
            setBuddyMessage(`Scan complete! ${selectedWaypoint.name} reveals ${selectedWaypoint.minerals[0]?.name}. Plain English: firm regolith, safe for travel!`)
          }

          // Progress mission objectives
          progressObjective(`scan_${selectedWaypoint.pointId}`)
          return 100
        }
        return prev + 25
      })
    }, 280)
  }

  const handleCollectSample = () => {
    if (sampleBay.length >= 8) {
      playWarning()
      setBuddyMessage("Rover sample carousel is full! Review existing cores in your Field Codex.")
      return
    }

    if (sampleBay.includes(selectedWaypoint.name)) {
      setBuddyMessage(`Sample from ${selectedWaypoint.name} is already safely cached in your rover hold!`)
      return
    }

    soundEngine.playSampleCollect()
    setSampleBay(prev => [...prev, selectedWaypoint.name])
    addXP(100)
    setBuddyMessage(`Core sample securely cached! Added 100 XP to your explorer profile.`)
    progressObjective(`sample_${selectedWaypoint.pointId}`)
  }

  const progressObjective = (actionKey: string) => {
    setMissions(prevMissions => {
      return prevMissions.map(m => {
        let changed = false
        const updatedObjs = m.objectives.map(obj => {
          if (!obj.completed && obj.targetAction === actionKey) {
            changed = true
            return { ...obj, completed: true }
          }
          return obj
        })

        const allDone = updatedObjs.every(o => o.completed)
        if (changed && allDone && m.status === 'active') {
          // Mission completed!
          playChime()
          setBuddyMessage(`MISSION ACCOMPLISHED: ${m.title}! Earned ${m.rewardXP} XP and badge [${m.badgeReward}]!`)
          addXP(m.rewardXP)

          // Unlock next mission
          setTimeout(() => {
            setMissions(curr => {
              const nextIdx = curr.findIndex(x => x.id === m.id) + 1
              if (nextIdx < curr.length) {
                return curr.map((cm, idx) => idx === nextIdx ? { ...cm, status: 'active' } : cm)
              }
              return curr
            })
          }, 600)

          return { ...m, objectives: updatedObjs, status: 'completed' as const }
        }

        return changed ? { ...m, objectives: updatedObjs } : m
      })
    })
  }

  const selectWaypoint = (wp: TerrainScanResult) => {
    playClick()
    setSelectedWaypoint(wp)
    progressObjective(`select_${wp.pointId}`)
  }

  const activeMission = missions.find(m => m.id === activeMissionId) || missions[0]

  return (
    <div className="w-full space-y-6">
      {/* GAME STATUS HEADER & SURVIVAL TELEMETRY HUD */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/90 p-5 backdrop-blur-2xl shadow-2xl glass-panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-950">
              <Compass className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold tracking-wider text-white">
                  ARES EXPEDITION STATION
                </h2>
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-800">
                  SYSTEM READY
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                Interactive Martian Exploration & Multi-Spectral Terrain Scanner
              </p>
            </div>
          </div>

          {/* Player Level & XP */}
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-2 text-right">
              <div className="text-[10px] font-mono uppercase text-zinc-400">EXPLORER RANK</div>
              <div className="text-sm font-mono font-bold text-orange-400">
                {missionXP > 600 ? 'PLANETARY PIONEER' : missionXP > 300 ? 'TERRAIN SPECIALIST' : 'CADET RECON'}
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/40 px-4 py-2 text-center">
              <div className="text-[10px] font-mono uppercase text-cyan-300">EXPLORATION XP</div>
              <div className="text-base font-mono font-bold text-cyan-200">{missionXP} pts</div>
            </div>
          </div>
        </div>

        {/* Survival Simulation Gauges (Explicitly labeled) */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                ROVER SURVIVAL SUBSYSTEMS
              </span>
              <span className="text-[9px] font-mono text-amber-400/90 rounded bg-amber-950/60 px-1.5 py-0.2 border border-amber-800/40">
                SIMULATED GAMEPLAY MECHANICS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  playChime()
                  setBattery(100)
                  setBuddyMessage("Solar arrays supercharged to 100% capacity under noon sun!")
                }}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline"
              >
                Solar Recharge
              </button>
              <button
                onClick={() => setShowCodex(true)}
                className="text-[10px] font-mono text-orange-400 hover:text-orange-300 underline flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Field Codex ({sampleBay.length} samples)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Battery */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Battery
                </span>
                <span className="font-bold text-amber-300">{battery}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${battery}%` }}
                />
              </div>
            </div>

            {/* EVA Oxygen */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Life Support O₂
                </span>
                <span className="font-bold text-cyan-300">{oxygen}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-500"
                  style={{ width: `${oxygen}%` }}
                />
              </div>
            </div>

            {/* Hull & Wheel Integrity */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Chassis Integrity
                </span>
                <span className="font-bold text-emerald-300">{hull}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${hull}%` }}
                />
              </div>
            </div>

            {/* Core Sample Bay */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-zinc-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" /> Sample Bay
                </span>
                <span className="font-bold text-purple-300">{sampleBay.length} / 8 slots</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-500"
                  style={{ width: `${(sampleBay.length / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GAMEPLAY VIEWPORT: LEFT TACTICAL WAYPOINT MAP / RIGHT SCANNING & LAB PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: TACTICAL SECTOR MAP (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl glass-panel relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-orange-400" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Martian Surface Waypoints (Jezero & Gale Corridors)
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                Click any sector to lock sensor reticle
              </span>
            </div>

            {/* Interactive Waypoint Cards Grid */}
            <div className="space-y-2.5">
              {EXPLORATION_WAYPOINTS.map(wp => {
                const isSelected = selectedWaypoint.pointId === wp.pointId
                const isScanned = scannedPoints.includes(wp.pointId)
                const isSampled = sampleBay.includes(wp.name)

                return (
                  <div
                    key={wp.pointId}
                    onClick={() => selectWaypoint(wp)}
                    className={`group relative rounded-2xl border p-4 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-950/30 shadow-lg shadow-orange-950/40 ring-1 ring-orange-500/50'
                        : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Waypoint thumbnail */}
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                          <Image
                            src={wp.scienceImage}
                            alt={wp.name}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-300"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-mono text-sm font-bold text-white">
                              {wp.name}
                            </h3>
                            {isScanned && (
                              <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[9px] font-mono text-cyan-400 border border-cyan-800">
                                SCANNED
                              </span>
                            )}
                            {isSampled && (
                              <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[9px] font-mono text-purple-400 border border-purple-800">
                                CACHED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 mt-0.5 line-clamp-1 font-sans">
                            {wp.slopePlainEnglish}
                          </p>

                          <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-zinc-400">
                            <span>ELEV: {wp.elevationMeters}m</span>
                            <span>SLOPE: {wp.slopeDeg}°</span>
                            <span className={wp.hazardLevel === 'DANGER' ? 'text-red-400 font-bold' : wp.hazardLevel === 'CAUTION' ? 'text-amber-400' : 'text-emerald-400'}>
                              {wp.hazardLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {wp.lat > 0 ? `${wp.lat}°N` : `${Math.abs(wp.lat)}°S`}, {wp.lon}°E
                        </span>
                        <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-orange-400 translate-x-1' : 'text-zinc-600'}`} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Quick Map Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800/80 pt-3 text-[10px] font-mono text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Safe (&lt;10°)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Moderate (10-18°)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" /> Rollover Risk (&gt;18°)
                </span>
              </div>
              <span>Data source: Planetary Observation PDS</span>
            </div>
          </div>

          {/* ACTIVE EXPEDITION MISSION CARD */}
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl glass-panel">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeMission.badgeIcon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-400">
                      {activeMission.code}
                    </span>
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-mono text-zinc-300">
                      {activeMission.difficulty}
                    </span>
                  </div>
                  <h4 className="font-mono text-sm font-bold text-white">
                    {activeMission.title}
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-zinc-400">REWARD</span>
                <div className="text-xs font-mono font-bold text-cyan-300">
                  +{activeMission.rewardXP} XP
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-4 font-sans leading-relaxed">
              {activeMission.brief}
            </p>

            {/* Objectives Check List */}
            <div className="space-y-2">
              {activeMission.objectives.map(obj => (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-mono transition ${
                    obj.completed
                      ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-900/50 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${obj.completed ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span>{obj.text}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">+{obj.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SCANNING SUITE & SCIENCE LAB BENCH (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-2xl glass-panel relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Target Inspection: {selectedWaypoint.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">
                SENSOR ARRAY ACTIVE
              </span>
            </div>

            {/* Real Planetary Observation Image */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/10 group mb-4">
              <Image
                src={selectedWaypoint.scienceImage}
                alt={selectedWaypoint.name}
                fill
                className="object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Scanning Reticle Overlay Animation */}
              {isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-950/40 backdrop-blur-xs">
                  <div className="w-20 h-20 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin flex items-center justify-center">
                    <Crosshair className="w-8 h-8 text-cyan-300" />
                  </div>
                  <span className="mt-3 font-mono text-xs font-bold text-cyan-300 tracking-wider">
                    ANALYZING SPECTRAL ABSORPTION... {scanProgress}%
                  </span>
                </div>
              )}

              {/* Image Metadata attribution without NASA logos */}
              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                <div className="text-xs font-mono font-bold leading-tight">
                  {selectedWaypoint.scienceTitle}
                </div>
                <div className="text-[10px] text-zinc-300 font-mono mt-0.5">
                  Sol {selectedWaypoint.solObserved} • {selectedWaypoint.scienceInstrument}
                </div>
              </div>
            </div>

            {/* Scan Action Controls */}
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={handleScanSector}
                disabled={isScanning}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 font-mono text-xs font-bold text-white shadow-lg shadow-cyan-950/50 hover:from-cyan-500 hover:to-blue-500 transition disabled:opacity-50"
              >
                <Radio className="w-4 h-4" />
                <span>{isScanning ? 'SCANNING TERRAIN...' : 'RUN TERRAIN SCAN (-4% BATT)'}</span>
              </button>
              {selectedWaypoint.sampleAvailable && (
                <button
                  onClick={handleCollectSample}
                  disabled={sampleBay.includes(selectedWaypoint.name)}
                  className="rounded-2xl border border-purple-500/50 bg-purple-950/60 px-4 py-3 font-mono text-xs font-bold text-purple-300 hover:bg-purple-900/60 transition disabled:opacity-40"
                  title="Cache core sample in rover bay"
                >
                  {sampleBay.includes(selectedWaypoint.name) ? 'CACHED' : 'CACHE CORE'}
                </button>
              )}
            </div>

            {/* Plain-English Analysis Accordion */}
            <div className="space-y-3">
              {/* Beginner Guide Card */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 mb-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>WHAT DOES THIS TERRAIN MEAN?</span>
                </div>
                <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                  {selectedWaypoint.slopePlainEnglish}
                </p>
              </div>

              {/* Mineral Composition Breakdown */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" /> MINERALOGICAL SPECTROMETRY
                  </span>
                  <span className="text-[10px] text-zinc-500">CRISM & PIXL</span>
                </div>

                <div className="space-y-2">
                  {selectedWaypoint.minerals.map((min, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-200 font-medium">{min.name}</span>
                        <span className="font-mono text-zinc-400">{min.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${min.percent}%`, backgroundColor: min.color }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 italic">
                        {min.description} {min.isHydrated && '💧 (Hydrated mineral - formed in liquid water!)'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Water Ice & Hazard Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">SUB-SURFACE ICE</div>
                  <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                    {selectedWaypoint.waterIceProbability}%
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Radar Detection</div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">LANDING SAFETY</div>
                  <div className={`text-sm font-mono font-bold mt-1 ${selectedWaypoint.landingSuitability === 'HAZARDOUS' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedWaypoint.landingSuitability}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Slope {selectedWaypoint.slopeDeg}°</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIELD CODEX & DISCOVERY JOURNAL MODAL */}
      {showCodex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-2xl glass-panel max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                <h3 className="font-mono text-base font-bold text-white">
                  MARTIAN FIELD CODEX & CORE INVENTORY
                </h3>
              </div>
              <button
                onClick={() => setShowCodex(false)}
                className="rounded-full p-1 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-zinc-300">
                Catalog of geological drill cores and multispectral terrain scans safely preserved in your exploration rover storage hold.
              </p>

              {sampleBay.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500 font-mono text-xs">
                  No geological samples cached yet. Travel to a waypoint and click &quot;Cache Core&quot; to begin your collection!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sampleBay.map((sampleName, idx) => {
                    const match = EXPLORATION_WAYPOINTS.find(w => w.name === sampleName)
                    return (
                      <div key={idx} className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3 flex items-start gap-3">
                        {match && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                            <Image src={match.scienceImage} alt={sampleName} fill className="object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-mono font-bold text-white">
                            Core #{idx + 1}: {sampleName}
                          </div>
                          <div className="text-[10px] text-purple-300 font-mono mt-0.5">
                            {match?.minerals[0]?.name} ({match?.minerals[0]?.percent}%)
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1">
                            Status: Sealed in hermetic titanium tube
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Scientific Attribution */}
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-[11px] text-zinc-400 font-sans">
                <strong>Data Provenance:</strong> Geological analysis and imaging are based on authentic observational data from the Planetary Science Data System (PDS), HiRISE, THEMIS, and CRISM archives. Presented through the Mars-Guard independent exploration interface.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

