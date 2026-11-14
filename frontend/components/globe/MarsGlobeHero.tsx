'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as THREE from 'three'
import {
  Compass,
  Play,
  RotateCw,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Shield,
  Activity,
  Database,
  Route,
  Camera,
  Layers,
  MapPin,
  ChevronRight,
  Info,
  Gamepad2,
  Sun,
  HelpCircle
} from 'lucide-react'
import { useMission } from '@/context/MissionContext'
import SimulatedBadge from '@/components/ui/SimulatedBadge'

export interface Hotspot {
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
  description: string
}

export const MARTIAN_HOTSPOTS: Hotspot[] = [
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
    description: 'Ancient river delta lakebed rich in clay minerals, biosignature potential, and active EVA sortie routes.'
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
    description: 'Towering 21 km shield volcano covering an area the size of France, bounded by dramatic 6 km perimeter cliffs.'
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
    description: 'Enormous tectonic fracture system spanning nearly a quarter of Mars circumference, plunging 7 km deep.'
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
    description: 'Sedimentary basin centered on Aeolis Mons, exhibiting billions of years of stratified lacustrine history.'
  },
]

interface MarsGlobeHeroProps {
  onSelectMode?: (mode: 'game' | 'surface' | 'globe') => void
  onOpenTutorial?: () => void
  activeMode?: 'game' | 'surface' | 'globe'
}

export default function MarsGlobeHero({
  onSelectMode,
  onOpenTutorial,
  activeMode = 'globe'
}: MarsGlobeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { playClick, playChime } = useMission()

  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [hoveredHotspot, setHoveredHotspot] = useState<Hotspot | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [isRotating, setIsRotating] = useState(true)
  const [webGLAvailable, setWebGLAvailable] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1.0)

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const globeRef = useRef<THREE.Mesh | null>(null)
  const tiltGroupRef = useRef<THREE.Group | null>(null)
  const markerMeshesRef = useRef<THREE.Mesh[]>([])
  const markerGroupsRef = useRef<THREE.Group[]>([])
  const targetCameraZRef = useRef<number>(3.8)
  const targetRotationRef = useRef<{ x: number; y: number } | null>(null)
  const isInteractingRef = useRef<boolean>(false)
  const lastInteractionTimeRef = useRef<number>(0)
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Helper: Convert Lat/Lon to Sphere Vector3
  const latLonToVector3 = useCallback((lat: number, lon: number, r: number) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
  }, [])

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const available = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
      setWebGLAvailable(available)
    } catch {
      setWebGLAvailable(false)
    }
  }, [])

  useEffect(() => {
    if (!containerRef.current || !webGLAvailable) return

    const container = containerRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || 700

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, targetCameraZRef.current)
    cameraRef.current = camera

    // WebGL Renderer with ACES tone mapping
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      container.innerHTML = ''
      container.appendChild(renderer.domElement)
      rendererRef.current = renderer
    } catch (e) {
      console.warn('WebGL initialization failed, falling back', e)
      setWebGLAvailable(false)
      return
    }

    // Starfield Background (Multi-depth cosmic field)
    const starGeometry = new THREE.BufferGeometry()
    const starCount = 1800
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3
      starPositions[idx] = (Math.random() - 0.5) * 60
      starPositions[idx + 1] = (Math.random() - 0.5) * 60
      starPositions[idx + 2] = -Math.random() * 50 - 5

      // Slight star color variations (warm white, cool blue, pale amber)
      const tint = Math.random()
      if (tint > 0.8) {
        starColors[idx] = 0.8
        starColors[idx + 1] = 0.9
        starColors[idx + 2] = 1.0
      } else if (tint > 0.6) {
        starColors[idx] = 1.0
        starColors[idx + 1] = 0.85
        starColors[idx + 2] = 0.75
      } else {
        starColors[idx] = 1.0
        starColors[idx + 1] = 1.0
        starColors[idx + 2] = 1.0
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

    const starMaterial = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    })
    const starField = new THREE.Points(starGeometry, starMaterial)
    scene.add(starField)

    // Dynamic Lighting: Warm Sun Light with Realistic Terminator
    const sunLight = new THREE.DirectionalLight(0xfff2e2, 2.6)
    sunLight.position.set(5.5, 2.4, 4.0)
    scene.add(sunLight)

    // Space Rim Backlight (Cool Cyan Fill)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7)
    rimLight.position.set(-5.0, -2.0, -3.5)
    scene.add(rimLight)

    // Soft Ambient Light for Shadow Detail
    const ambientLight = new THREE.AmbientLight(0x182030, 0.45)
    scene.add(ambientLight)

    // Mars Axial Tilt Group (Mars obliquity: ~25.19 degrees)
    const tiltGroup = new THREE.Group()
    tiltGroup.rotation.z = THREE.MathUtils.degToRad(12.5) // Gentle cinematic tilt
    scene.add(tiltGroup)
    tiltGroupRef.current = tiltGroup

    // Mars Sphere Setup
    const globeRadius = 1.25
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64)
    const textureLoader = new THREE.TextureLoader()

    const marsTexture = textureLoader.load('/assets/nasa/mars_surface_texture.jpg')
    const marsBump = textureLoader.load('/assets/nasa/mars_elevation_bump.jpg')

    marsTexture.colorSpace = THREE.SRGBColorSpace
    marsTexture.generateMipmaps = true
    marsTexture.minFilter = THREE.LinearMipmapLinearFilter

    const globeMaterial = new THREE.MeshStandardMaterial({
      map: marsTexture,
      bumpMap: marsBump,
      bumpScale: 0.042,
      roughness: 0.82,
      metalness: 0.08,
    })

    const globe = new THREE.Mesh(globeGeometry, globeMaterial)
    tiltGroup.add(globe)
    globeRef.current = globe

    // Atmospheric Glow (Layer 1: Inner Rayleigh/Sunset Limb Scattering Shader)
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.026, 64, 64)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          float rim = 1.0 - max(0.0, dot(vNormal, viewDir));
          float intensity = pow(rim, 2.9);
          // Martian atmospheric color: warm orange-peach limb with subtle cyan edge
          vec3 glowColor = mix(vec3(0.98, 0.42, 0.16), vec3(0.28, 0.65, 0.95), pow(rim, 5.5));
          gl_FragColor = vec4(glowColor, intensity * 0.85);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)
    tiltGroup.add(atmosphere)

    // Atmospheric Glow (Layer 2: Soft Outer Halo)
    const haloGeometry = new THREE.SphereGeometry(globeRadius * 1.09, 48, 48)
    const haloMaterial = new THREE.MeshStandardMaterial({
      color: 0xeb5e28,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const halo = new THREE.Mesh(haloGeometry, haloMaterial)
    tiltGroup.add(halo)

    // Interactive Hotspot Markers
    markerMeshesRef.current = []
    markerGroupsRef.current = []

    MARTIAN_HOTSPOTS.forEach((spot, idx) => {
      const pos = latLonToVector3(spot.lat, spot.lon, globeRadius * 1.018)
      const markerGroup = new THREE.Group()

      // Core Glowing Beacon
      const coreGeo = new THREE.SphereGeometry(0.038, 16, 16)
      const coreMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xff4500 : 0x00f0ff,
      })
      const coreMesh = new THREE.Mesh(coreGeo, coreMat)
      coreMesh.userData = { hotspot: spot, index: idx }
      markerGroup.add(coreMesh)

      // Outer Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.052, 0.076, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xff8800 : 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0))
      markerGroup.add(ringMesh)

      // Secondary Halo Ring
      const haloRingGeo = new THREE.RingGeometry(0.082, 0.098, 32)
      const haloRingMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xffaa33 : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      })
      const haloRingMesh = new THREE.Mesh(haloRingGeo, haloRingMat)
      haloRingMesh.lookAt(new THREE.Vector3(0, 0, 0))
      markerGroup.add(haloRingMesh)

      markerGroup.position.copy(pos)
      markerGroup.userData = { hotspot: spot, index: idx }
      globe.add(markerGroup)

      markerMeshesRef.current.push(coreMesh)
      markerGroupsRef.current.push(markerGroup)
    })

    // Pointer Drag & Inertia Interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    let isDragging = false
    let pointerDownPos = { x: 0, y: 0 }
    let prevPointerPos = { x: 0, y: 0 }
    let dragDistance = 0

    const getRelativeCoords = (e: MouseEvent | Touch) => {
      const rect = renderer.domElement.getBoundingClientRect()
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        clientX: e.clientX,
        clientY: e.clientY
      }
    }

    const checkHover = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(markerMeshesRef.current)

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh
        const spot = hit.userData.hotspot as Hotspot
        if (spot) {
          setHoveredHotspot(spot)
          setTooltipPos({ x: clientX, y: clientY })
          renderer.domElement.style.cursor = 'pointer'
          return
        }
      }
      setHoveredHotspot(null)
      setTooltipPos(null)
      renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab'
    }

    // Pointer Event Handlers
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      dragDistance = 0
      pointerDownPos = { x: e.clientX, y: e.clientY }
      prevPointerPos = { x: e.clientX, y: e.clientY }
      velocityRef.current = { x: 0, y: 0 }
      targetRotationRef.current = null
      isInteractingRef.current = true
      lastInteractionTimeRef.current = Date.now()
      renderer.domElement.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (isDragging && globeRef.current) {
        const deltaX = e.clientX - prevPointerPos.x
        const deltaY = e.clientY - prevPointerPos.y
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY)

        velocityRef.current = {
          x: deltaX * 0.005,
          y: deltaY * 0.005,
        }

        globeRef.current.rotation.y += velocityRef.current.x
        globeRef.current.rotation.x = Math.max(
          -0.85,
          Math.min(0.85, globeRef.current.rotation.x + velocityRef.current.y)
        )

        prevPointerPos = { x: e.clientX, y: e.clientY }
        lastInteractionTimeRef.current = Date.now()
      } else {
        checkHover(e.clientX, e.clientY)
      }
    }

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return
      isDragging = false
      renderer.domElement.style.cursor = 'grab'
      lastInteractionTimeRef.current = Date.now()

      // If it was a quick click without significant drag, check marker hit
      if (dragDistance < 6) {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(markerMeshesRef.current)

        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh
          const spot = hit.userData.hotspot as Hotspot
          if (spot) {
            playChime()
            setSelectedHotspot(spot)
            setIsRotating(false)

            // Smoothly rotate to bring hotspot towards user
            const targetY = -((spot.lon + 180) * (Math.PI / 180)) + Math.PI / 2
            const targetX = spot.lat * (Math.PI / 180) * 0.5
            targetRotationRef.current = { x: targetX, y: targetY }
          }
        }
      }
    }

    // Wheel Zoom Handler
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = e.deltaY * 0.0025
      const newZ = Math.max(2.1, Math.min(5.8, targetCameraZRef.current + zoomDelta))
      targetCameraZRef.current = newZ
      setZoomLevel(Number(((3.8 / newZ)).toFixed(2)))
      lastInteractionTimeRef.current = Date.now()
    }

    // Mobile Touch Pinch Zoom
    let touchStartDist = 0
    let touchStartZ = 3.8

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        touchStartDist = Math.sqrt(dx * dx + dy * dy)
        touchStartZ = targetCameraZRef.current
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const currentDist = Math.sqrt(dx * dx + dy * dy)
        const ratio = touchStartDist / currentDist
        const newZ = Math.max(2.1, Math.min(5.8, touchStartZ * ratio))
        targetCameraZRef.current = newZ
        setZoomLevel(Number(((3.8 / newZ)).toFixed(2)))
        lastInteractionTimeRef.current = Date.now()
      }
    }

    const dom = renderer.domElement
    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('wheel', onWheel, { passive: false })
    dom.addEventListener('touchstart', onTouchStart, { passive: true })
    dom.addEventListener('touchmove', onTouchMove, { passive: true })

    // Animation Render Loop
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // 1. Smooth Camera Zoom Lerp
      camera.position.z += (targetCameraZRef.current - camera.position.z) * 0.08

      // 2. Hotspot Target Rotation Interpolation
      if (targetRotationRef.current && globeRef.current) {
        const target = targetRotationRef.current
        globeRef.current.rotation.y += (target.y - globeRef.current.rotation.y) * 0.06
        globeRef.current.rotation.x += (target.x - globeRef.current.rotation.x) * 0.06

        if (
          Math.abs(target.y - globeRef.current.rotation.y) < 0.005 &&
          Math.abs(target.x - globeRef.current.rotation.x) < 0.005
        ) {
          targetRotationRef.current = null
        }
      } else if (globeRef.current) {
        // 3. Momentum & Inertia Damping
        if (
          Math.abs(velocityRef.current.x) > 0.0001 ||
          Math.abs(velocityRef.current.y) > 0.0001
        ) {
          globeRef.current.rotation.y += velocityRef.current.x
          globeRef.current.rotation.x = Math.max(
            -0.85,
            Math.min(0.85, globeRef.current.rotation.x + velocityRef.current.y)
          )
          velocityRef.current.x *= 0.93
          velocityRef.current.y *= 0.93
        } else if (isRotating && Date.now() - lastInteractionTimeRef.current > 1800) {
          // 4. Continuous Auto-Rotation around polar axis
          globeRef.current.rotation.y += 0.0018
        }
      }

      // 5. Starfield subtle drift
      starField.rotation.y += 0.0002

      // 6. Beacon Pulse Animation
      const time = Date.now() * 0.004
      markerGroupsRef.current.forEach((group, i) => {
        const isHovered = hoveredHotspot?.name === group.userData.hotspot?.name
        const isSelected = selectedHotspot?.name === group.userData.hotspot?.name

        const baseScale = isSelected ? 1.4 : isHovered ? 1.3 : 1.0
        const pulse = Math.sin(time + i * 1.5) * 0.15
        const currentScale = baseScale + pulse

        group.scale.set(currentScale, currentScale, currentScale)
      })

      renderer.render(scene, camera)
    }
    animate()

    // Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize)
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('wheel', onWheel)
      dom.removeEventListener('touchstart', onTouchStart)
      dom.removeEventListener('touchmove', onTouchMove)
      cancelAnimationFrame(animationId)

      // Dispose Three.js objects
      globeGeometry.dispose()
      globeMaterial.dispose()
      marsTexture.dispose()
      marsBump.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      atmosphereGeometry.dispose()
      atmosphereMaterial.dispose()
      haloGeometry.dispose()
      haloMaterial.dispose()
      renderer.dispose()
    }
  }, [webGLAvailable, isRotating, latLonToVector3, hoveredHotspot, selectedHotspot, playChime])

  // Zoom Controls
  const handleZoomIn = () => {
    playClick()
    targetCameraZRef.current = Math.max(2.1, targetCameraZRef.current - 0.5)
    setZoomLevel(Number(((3.8 / targetCameraZRef.current)).toFixed(2)))
    lastInteractionTimeRef.current = Date.now()
  }

  const handleZoomOut = () => {
    playClick()
    targetCameraZRef.current = Math.min(5.8, targetCameraZRef.current + 0.5)
    setZoomLevel(Number(((3.8 / targetCameraZRef.current)).toFixed(2)))
    lastInteractionTimeRef.current = Date.now()
  }

  const handleResetView = () => {
    playClick()
    targetCameraZRef.current = 3.8
    setZoomLevel(1.0)
    targetRotationRef.current = null
    if (globeRef.current) {
      globeRef.current.rotation.x = 0
    }
    setSelectedHotspot(null)
    setIsRotating(true)
    lastInteractionTimeRef.current = Date.now()
  }

  return (
    <div className="relative w-full h-[calc(100vh-4.5rem)] min-h-[640px] max-h-[960px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#030508] via-[#080c16] to-[#04060a] select-none rounded-3xl border border-white/10 shadow-2xl">
      {/* 3D WebGL Mars Canvas */}
      {webGLAvailable ? (
        <div
          ref={containerRef}
          className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing touch-none"
        />
      ) : (
        /* Performance & Compatibility Fallback for Low-Powered Devices */
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-black p-6 text-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-orange-500/60 shadow-[0_0_80px_rgba(235,94,40,0.35)] animate-pulse mb-6">
            <img
              src="/assets/nasa/mars_surface_texture.jpg"
              alt="Planet Mars Surface"
              className="w-full h-full object-cover scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-orange-500/20" />
          </div>
          <span className="font-mono text-xs text-orange-400 bg-orange-950/80 px-3 py-1 rounded-full border border-orange-700/60 mb-2">
            2D Scientific Fallback Mode Active
          </span>
          <p className="text-xs text-zinc-400 max-w-md">
            Hardware WebGL acceleration unavailable. All scientific telemetry, routes, and GIS layers remain fully accessible.
          </p>
        </div>
      )}

      {/* TOP LEFT: FLOATING SPATIAL HUD HEADER */}
      <div className="absolute top-5 left-5 md:top-7 md:left-7 z-10 pointer-events-auto max-w-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <SimulatedBadge type="REAL" />
          <span className="text-[11px] font-mono text-zinc-400 tracking-wide">
            Planetary MOLA Orbit Mosaic • Viking Mars 2020 Grid
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] flex items-center gap-3">
          <span>PLANET MARS</span>
          <span className="text-orange-500 text-sm md:text-base font-mono px-2 py-0.5 rounded-lg bg-orange-950/70 border border-orange-600/40 font-bold">
            3D ORBIT
          </span>
        </h1>
        <p className="text-xs md:text-sm text-zinc-300 font-sans mt-1 max-w-lg drop-shadow-md">
          Continuous rotating 3D planetary model with realistic day/night terminator. Select any glowing beacon or explore GIS layers below.
        </p>

        {/* Quick-Access Pills for Scientific Modules */}
        <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-[11px]">
          <Link
            href="/explorer"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-zinc-950/75 hover:bg-cyan-950/80 text-cyan-300 font-bold backdrop-blur-md transition shadow-lg hover:border-cyan-400"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>🗺️ GIS MAP (8 LAYERS)</span>
          </Link>
          <Link
            href="/overview"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/40 bg-zinc-950/75 hover:bg-orange-950/80 text-orange-300 font-bold backdrop-blur-md transition shadow-lg hover:border-orange-400"
          >
            <Activity className="w-3.5 h-3.5 text-orange-400" />
            <span>📈 LIVE TELEMETRY</span>
          </Link>
          <Link
            href="/risk"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-zinc-950/75 hover:bg-rose-950/80 text-rose-300 font-bold backdrop-blur-md transition shadow-lg hover:border-rose-400"
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>🎯 RISK RADAR</span>
          </Link>
          <Link
            href="/planner"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-zinc-950/75 hover:bg-emerald-950/80 text-emerald-300 font-bold backdrop-blur-md transition shadow-lg hover:border-emerald-400"
          >
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚡ ROUTE LAB</span>
          </Link>
          <Link
            href="/datasets"
            onClick={playClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-zinc-950/75 hover:bg-purple-950/80 text-purple-300 font-bold backdrop-blur-md transition shadow-lg hover:border-purple-400"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>📊 DATA STUDIO</span>
          </Link>
        </div>
      </div>

      {/* TOP RIGHT: MODE SWITCHER & QUICK CONTROLS */}
      <div className="absolute top-5 right-5 md:top-7 md:right-7 z-10 pointer-events-auto flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-2xl">
          <button
            onClick={() => {
              playClick()
              onSelectMode?.('globe')
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition shadow-md ${
              activeMode === 'globe'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-orange-950'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Interactive 3D Mars Globe"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3D GLOBE</span>
          </button>

          <button
            onClick={() => {
              playClick()
              onSelectMode?.('game')
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition shadow-md ${
              activeMode === 'game'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-cyan-950'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Switch to Ares Expedition Game Station"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ARES</span>
            <span>GAME</span>
          </button>

          <button
            onClick={() => {
              playClick()
              onSelectMode?.('surface')
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition shadow-md ${
              activeMode === 'surface'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-purple-950'
                : 'text-zinc-400 hover:text-white'
            }`}
            title="Living Martian Surface Environment"
          >
            <Sun className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LIVING</span>
            <span>SURFACE</span>
          </button>

          <button
            onClick={() => {
              playClick()
              onOpenTutorial?.()
            }}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-mono font-bold text-cyan-300 hover:bg-cyan-950/60 transition"
            title="Open Interactive Explorer Onboarding"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">TUTORIAL</span>
          </button>
        </div>

        {/* Hotspot Quick Select Indicator Bar */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-zinc-500">BEACONS:</span>
          {MARTIAN_HOTSPOTS.map((spot, idx) => (
            <button
              key={spot.name}
              onClick={() => {
                playChime()
                setSelectedHotspot(spot)
                setIsRotating(false)
                if (globeRef.current) {
                  const targetY = -((spot.lon + 180) * (Math.PI / 180)) + Math.PI / 2
                  const targetX = spot.lat * (Math.PI / 180) * 0.5
                  targetRotationRef.current = { x: targetX, y: targetY }
                }
              }}
              className={`px-2 py-0.5 rounded transition ${
                selectedHotspot?.name === spot.name
                  ? 'bg-orange-600 text-white font-bold'
                  : 'hover:text-zinc-200'
              }`}
            >
              {spot.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* HOVER TOOLTIP ON BEACON */}
      {hoveredHotspot && tooltipPos && !selectedHotspot && (
        <div
          className="fixed z-40 pointer-events-none -translate-x-1/2 -translate-y-12 px-3 py-1.5 rounded-xl border border-cyan-500/50 bg-zinc-950/90 backdrop-blur-md shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{hoveredHotspot.name}</span>
          </div>
          <div className="font-mono text-[10px] text-cyan-300">
            {hoveredHotspot.lat}°N, {hoveredHotspot.lon}°E • {hoveredHotspot.elevation}
          </div>
        </div>
      )}

      {/* BOTTOM CENTER: PRIMARY CTA & INTERACTION CONTROLS */}
      {!selectedHotspot && (
        <div className="absolute bottom-6 left-5 right-5 md:left-auto md:right-7 z-10 flex flex-wrap gap-3 items-center justify-between md:justify-end pointer-events-auto">
          {/* Main Mission Launch CTA */}
          <button
            onClick={() => {
              playChime()
              setSelectedHotspot(MARTIAN_HOTSPOTS[0])
              if (globeRef.current) {
                const spot = MARTIAN_HOTSPOTS[0]
                const targetY = -((spot.lon + 180) * (Math.PI / 180)) + Math.PI / 2
                const targetX = spot.lat * (Math.PI / 180) * 0.5
                targetRotationRef.current = { x: targetX, y: targetY }
              }
            }}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-mono text-xs font-bold shadow-2xl hover:scale-105 transition glow-orange"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>START EVA-07 JEZERO MISSION</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Direct Map Explorer Link */}
          <Link
            href="/explorer"
            onClick={playClick}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border border-white/15 bg-zinc-950/80 backdrop-blur-md text-zinc-200 font-mono text-xs font-bold hover:bg-zinc-900 transition hover:border-cyan-500/50"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>FREE EXPLORE MAP</span>
          </Link>

          {/* Interactive Globe Control Bar */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md">
            {/* Auto-Rotation Toggle */}
            <button
              onClick={() => {
                playClick()
                setIsRotating(!isRotating)
              }}
              className={`p-2.5 rounded-xl transition ${
                isRotating
                  ? 'bg-orange-950/70 border border-orange-700/60 text-orange-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title={isRotating ? 'Pause Continuous Rotation' : 'Resume Continuous Rotation'}
            >
              <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            </button>

            {/* Zoom In */}
            <button
              onClick={handleZoomIn}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white transition hover:bg-zinc-900"
              title="Zoom In Camera (or Mouse Wheel Up)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              onClick={handleZoomOut}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white transition hover:bg-zinc-900"
              title="Zoom Out Camera (or Mouse Wheel Down)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Reset View */}
            <button
              onClick={handleResetView}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white transition hover:bg-zinc-900"
              title="Reset View and Camera Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* HOTSPOT CINEMATIC MISSION HUB BOTTOM DRAWER */}
      {selectedHotspot && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[95%] max-w-2xl rounded-3xl border border-orange-500/40 bg-zinc-950/95 backdrop-blur-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 glass-panel pointer-events-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Real Planetary Surface Imagery Thumbnail */}
            <div className="relative w-full sm:w-48 h-36 rounded-2xl overflow-hidden border border-zinc-700/80 shrink-0 shadow-lg">
              <img
                src={selectedHotspot.image}
                alt={selectedHotspot.name}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono text-zinc-300">
                {selectedHotspot.credit}
              </div>
            </div>

            {/* Region Info & Actions */}
            <div className="flex-1 space-y-2.5 w-full">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-orange-950 border border-orange-700/60 text-orange-400 text-[10px] font-mono font-bold tracking-wider">
                  {selectedHotspot.priority}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {selectedHotspot.lat}°N, {selectedHotspot.lon}°E
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{selectedHotspot.name}</span>
                </h3>
                <p className="text-xs text-orange-400/90 font-mono">
                  {selectedHotspot.subtitle}
                </p>
              </div>

              <p className="text-xs text-zinc-300 font-sans line-clamp-2 leading-relaxed">
                {selectedHotspot.description}
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-zinc-900/90 rounded-xl p-2.5 border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[9px]">ELEVATION</span>
                  <span className="text-zinc-200 font-bold">{selectedHotspot.elevation}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">SURVEY VEHICLE</span>
                  <span className="text-cyan-300 font-bold truncate block">
                    {selectedHotspot.rover}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={selectedHotspot.targetPath}
                  onClick={playChime}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-mono text-xs font-bold shadow-lg transition glow-orange"
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
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-white font-mono text-xs transition"
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
