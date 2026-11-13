'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  Monitor,
  Smartphone,
  ExternalLink,
  Download,
  Eye,
  Sparkles,
  ChevronRight,
  Maximize2,
  X,
  Compass,
  Layers,
  Play
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

interface ScreenshotItem {
  id: string
  title: string
  screenNumber: string
  route: string
  category: string
  description: string
  desktopImg: string
  mobileImg: string
  highlights: string[]
}

const SCREENSHOTS_DATA: ScreenshotItem[] = [
  {
    id: 'home_globe',
    title: '3D Rotating Mars Globe & Regional Hubs',
    screenNumber: 'Screen 01',
    route: '/',
    category: '3D Planetary Navigation',
    description: 'Slowly rotating 3D Mars globe with Viking/MOLA textures, day/night terminator, and clickable hotspot beacons.',
    desktopImg: '/screenshots/01_home_globe_desktop.png',
    mobileImg: '/screenshots/01_home_globe_mobile.png',
    highlights: ['Three.js WebGL 60 FPS', 'Jezero & Olympus Mons Beacons', 'Cinematic Region Zoom'],
  },
  {
    id: 'map_explorer',
    title: 'Interactive Multi-Layer GIS Map & Elevation Ribbon',
    screenNumber: 'Screen 02',
    route: '/explorer',
    category: 'GIS & Surface Navigation',
    description: 'Full-bleed satellite map with coordinate crosshair prober, 8 NASA thumbnail layer switchers, and live route elevation profile.',
    desktopImg: '/screenshots/02_map_explorer_desktop.png',
    mobileImg: '/screenshots/02_map_explorer_mobile.png',
    highlights: ['8 Real NASA PDS Layers', 'Live AreaChart Elevation Ribbon', 'Click-to-Probe MOLA Elevation'],
  },
  {
    id: 'mission_simulator',
    title: 'Mission Simulator & First-Person Helmet HUD',
    screenNumber: 'Screen 03',
    route: '/simulation',
    category: 'Simulation & Contingencies',
    description: 'Cinematic first-person visor view with animated Martian horizon, tactile environmental sliders, and Disaster Deck.',
    desktopImg: '/screenshots/03_mission_simulator_desktop.png',
    mobileImg: '/screenshots/03_mission_simulator_mobile.png',
    highlights: ['Helmet HUD vs 2D Tactical View', 'Dynamic Dust Storm & Alert Vignette', 'Historical Lesson Slide-in Toast'],
  },
  {
    id: 'route_lab',
    title: 'Constrained Route Optimizer & Comparison Matrix',
    screenNumber: 'Screen 04',
    route: '/planner',
    category: 'Pathfinding & Safety Envelopes',
    description: 'Three glowing candidate paths (Aegis, Ares, Apex) with single Speed vs Comfort slider and constraint violation locking.',
    desktopImg: '/screenshots/04_route_lab_desktop.png',
    mobileImg: '/screenshots/04_route_lab_mobile.png',
    highlights: ['Dynamic J = αR + βC + γT Re-ranking', '18° Rover Slope Limit Lockout', 'Route Comparison BarChart'],
  },
  {
    id: 'experiment_lab',
    title: 'Martian Experiment Lab Bench & AI Safety Dial',
    screenNumber: 'Screen 05',
    route: '/experiments',
    category: 'Science Protocols',
    description: 'Illustrated experiment templates with a large glowing Class A/B/C/D traffic-light dial and Commander approval workflow.',
    desktopImg: '/screenshots/05_experiment_lab_desktop.png',
    mobileImg: '/screenshots/05_experiment_lab_mobile.png',
    highlights: ['Class A-D AI Safety Classifier', 'Illustrated Template Tiles', 'Surface Execution Animation & XP'],
  },
  {
    id: 'risk_radar',
    title: 'AI Multi-Factor Risk Radar & ML Feature Weights',
    screenNumber: 'Screen 06',
    route: '/risk',
    category: 'Machine Learning',
    description: 'Radar chart displaying concentric risk envelopes alongside Random Forest feature importance weights and Before/After slider.',
    desktopImg: '/screenshots/06_risk_radar_desktop.png',
    mobileImg: '/screenshots/06_risk_radar_mobile.png',
    highlights: ['Polar RadarChart Envelope', 'Random Forest R² = 0.948 Weights', 'Draggable Split-Slider Comparison'],
  },
  {
    id: 'digital_twin',
    title: '3D Martian Digital Twin & Hazard Volumes',
    screenNumber: 'Screen 07',
    route: '/digital-twin',
    category: '3D Simulation',
    description: 'Interactive 3D Jezero crater elevation mesh with rover model, volumetric pulsing hazard cones, and replay scrubber.',
    desktopImg: '/screenshots/07_digital_twin_desktop.png',
    mobileImg: '/screenshots/07_digital_twin_mobile.png',
    highlights: ['MOLA Elevation Heightfield', 'Volumetric 3D Hazard Cones', 'Prior vs In-Situ Observation Split'],
  },
  {
    id: 'data_studio',
    title: 'Planetary Data Studio & 3D Flipping Gallery Wall',
    screenNumber: 'Screen 08',
    route: '/datasets',
    category: 'NASA Science Data',
    description: 'Gallery wall of 8 NASA image tiles that flip into interactive full-width data charts with NASA PDS attribution chips.',
    desktopImg: '/screenshots/08_data_studio_desktop.png',
    mobileImg: '/screenshots/08_data_studio_mobile.png',
    highlights: ['8 PDS Data Disciplines', 'CSS 3D Flip Card Animation', 'Interactive Recharts Visualizations'],
  },
  {
    id: 'safety_archive',
    title: 'NASA Historical Safety Mishap Archive & Filmstrip',
    screenNumber: 'Screen 09',
    route: '/history',
    category: 'Historical RAG',
    description: 'Horizontal scrollable filmstrip of documented spaceflight incidents (Apollo, ISS EVA 23) with Mars transferability limits.',
    desktopImg: '/screenshots/09_safety_archive_desktop.png',
    mobileImg: '/screenshots/09_safety_archive_mobile.png',
    highlights: ['Luca Parmitano ISS EVA 23 Report', 'Apollo 15 & 17 Lessons', 'Explicit Mars Limits Notes'],
  },
  {
    id: 'live_telemetry',
    title: 'Live Telemetry Dashboard & 8 Multi-Variable Graphs',
    screenNumber: 'Screen 10',
    route: '/overview',
    category: 'Mission Control',
    description: 'Streaming real-time telemetry curves for Temperature, Radiation, Battery, Oxygen, Workload, Cardiac ECG, and Composite Risk.',
    desktopImg: '/screenshots/10_live_telemetry_desktop.png',
    mobileImg: '/screenshots/10_live_telemetry_mobile.png',
    highlights: ['8 Interactive Recharts Graphs', 'Cardiac ECG Waveform Stream', 'Contingency Injection Triggers'],
  },
  {
    id: 'mission_report',
    title: 'Mission Completion Dossier & Interactive Story Reel',
    screenNumber: 'Screen 11',
    route: '/reports',
    category: 'Reporting & Logs',
    description: 'Comprehensive EVA-07 mission story with interactive highlight-reel replay, 96% Safety Scorecard, and instant PDF export.',
    desktopImg: '/screenshots/11_mission_report_desktop.png',
    mobileImg: '/screenshots/11_mission_report_mobile.png',
    highlights: ['Interactive Replay Animation', '96% Zero-Violation Scorecard', 'One-Click Print / PDF Export'],
  },
]

export default function ScreenshotsShowcasePage() {
  const { playClick, playChime } = useMission()
  const [deviceMode, setDeviceMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP')
  const [selectedItem, setSelectedItem] = useState<ScreenshotItem | null>(null)

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] p-4 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SimulatedBadge type="REAL" />
            <span className="text-xs font-mono font-bold text-zinc-400">
              AUDITED UI ARTIFACTS & VISUAL SHOWCASE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Camera className="w-7 h-7 text-orange-500" />
            <span>App Tour & Screenshots Gallery</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Inspect verified desktop (1280×820) and mobile (390×844) captures of all 11 redesigned Mars-Guard screens.
          </p>
        </div>

        {/* Desktop vs Mobile Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-md font-mono text-xs font-bold">
          <button
            onClick={() => { playClick(); setDeviceMode('DESKTOP'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition ${
              deviceMode === 'DESKTOP' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>DESKTOP VIEW (1280px)</span>
          </button>
          <button
            onClick={() => { playClick(); setDeviceMode('MOBILE'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition ${
              deviceMode === 'MOBILE' ? 'bg-orange-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>MOBILE VIEW (390px)</span>
          </button>
        </div>
      </div>

      {/* Grid of All 11 Redesigned Screen Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SCREENSHOTS_DATA.map(item => {
          const activeImg = deviceMode === 'DESKTOP' ? item.desktopImg : item.mobileImg
          return (
            <div
              key={item.id}
              className="rounded-3xl border border-white/10 bg-zinc-950/90 backdrop-blur-xl overflow-hidden shadow-xl hover:border-orange-500/50 transition-all flex flex-col justify-between group"
            >
              {/* Image Preview Container */}
              <div
                onClick={() => { playChime(); setSelectedItem(item); }}
                className={`relative cursor-pointer overflow-hidden bg-black/60 flex items-center justify-center p-2 border-b border-zinc-800/80 ${
                  deviceMode === 'MOBILE' ? 'h-72' : 'h-52'
                }`}
              >
                <img
                  src={activeImg}
                  alt={item.title}
                  className={`object-contain transition-transform duration-500 group-hover:scale-105 rounded-xl ${
                    deviceMode === 'MOBILE' ? 'h-full max-w-[200px] border-2 border-zinc-700 shadow-2xl' : 'w-full h-full object-cover'
                  }`}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-orange-600 text-white font-mono text-xs font-bold flex items-center gap-1 shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Full Size</span>
                  </span>
                </div>
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/80 border border-zinc-700 text-[10px] font-mono font-bold text-orange-400">
                  {item.screenNumber}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-700 text-[9px] font-mono text-zinc-300">
                  {deviceMode}
                </span>
              </div>

              {/* Information & Links */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight mt-0.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-300 font-sans mt-1 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Highlights Pills */}
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {item.highlights.map((hl, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-300"
                      >
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <Link
                    href={item.route}
                    onClick={playClick}
                    className="flex items-center gap-1 text-xs font-mono font-bold text-orange-400 hover:text-orange-300 transition"
                  >
                    <span>Launch Live Screen</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <a
                    href={activeImg}
                    download={`${item.id}_${deviceMode.toLowerCase()}.png`}
                    className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    title="Download Screenshot Image"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox Modal for Full-Size Screenshot View */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/20 bg-zinc-950 p-6 shadow-2xl glass-panel">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div>
                <span className="text-xs font-mono text-orange-400 font-bold">
                  {selectedItem.screenNumber} • {selectedItem.category}
                </span>
                <h2 className="text-xl font-bold text-white">{selectedItem.title}</h2>
              </div>
              <button
                onClick={() => { playClick(); setSelectedItem(null); }}
                className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={deviceMode === 'DESKTOP' ? selectedItem.desktopImg : selectedItem.mobileImg}
                alt={selectedItem.title}
                className="max-h-[65vh] w-auto rounded-2xl border border-zinc-700 shadow-2xl object-contain"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-xs text-zinc-300">{selectedItem.description}</p>
              <div className="flex items-center gap-2">
                <a
                  href={deviceMode === 'DESKTOP' ? selectedItem.desktopImg : selectedItem.mobileImg}
                  download={`${selectedItem.id}_${deviceMode.toLowerCase()}.png`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
                <Link
                  href={selectedItem.route}
                  onClick={() => { playClick(); setSelectedItem(null); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold transition shadow-lg"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Enter Live World</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
