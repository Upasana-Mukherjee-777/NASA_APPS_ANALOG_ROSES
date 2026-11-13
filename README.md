# MARS-GUARD: PLANETARY SAFETY & GUIDANCE PLATFORM
### Front-End Experience Overhaul (Visual, NASA-Imagery-Led, Playful Game-Quality)
**Developed for NASA's Space Apps Challenge 2026**  
**Challenge**: *Interplanetary Survival Guide: Martian Map*  
**Repository**: [https://github.com/Upasana-Mukherjee-777/NASA_Analog_Roses](https://github.com/Upasana-Mukherjee-777/NASA_Analog_Roses)

---

## 🌟 The Front-End Experience Overhaul

The MARS-GUARD front-end has been completely redesigned from a text-dense admin dashboard into an **immersive, game-quality space exploration application** designed so that anyone aged 14 to 70 can open it and instantly understand what to tap and want to keep exploring.

### Core Experience Principles
1. **ONE IDEA PER SCREEN**: No multiple cluttered panels of text. Clean, focused visual communication.
2. **IMAGE FIRST, TEXT SECOND**: Every screen is led by a large real NASA photo, 3D WebGL view, interactive map, or live animated visual.
3. **PROGRESSIVE DISCLOSURE**: Technical details live behind taps: tooltips, bottom sheets, flip cards, and expandable drawers (≤ 40 words visible text on any screen).
4. **EVERYTHING IS TOUCHABLE**: Every element responds to hover/tap with haptic-style micro-interactions, glows, and audio feedback.
5. **DISCOVERY AND FUN**: Mission XP, badges, interactive companion guide ("MARS-GUARD Buddy"), and guided walkthrough story.

---

## 🧭 Spatial Navigation Architecture

- **Home 3D Mars Globe (`/`)**: Full-screen slowly rotating 3D Mars globe built with Three.js using Viking/MOLA color and elevation bump maps. Glowing 3D beacons at Jezero Crater, Olympus Mons, Valles Marineris, and Gale Crater zoom the camera in with a cinematic transition and open that region's Mission Hub.
- **Floating Circular "Mission Dock"**: Persistent orbital dock menu reachable from any screen with one tap. Expands into 9 glowing planetary world capsules:
  1. 🚀 **Mission Simulator** (`/simulation`)
  2. 🗺️ **Route Lab** (`/planner`)
  3. 🔬 **Experiment Lab** (`/experiments`)
  4. 🎯 **Risk Radar** (`/risk`)
  5. 🧊 **3D Digital Twin** (`/digital-twin`)
  6. 📊 **Data Studio** (`/datasets`)
  7. 📜 **Safety Archive** (`/history`)
  8. 💓 **Live Telemetry** (`/overview`)
  9. 📑 **Mission Report** (`/reports`)
- **Persistent Mini HUD Strip**: Fixed top glass bar showing strictly: Mission Clock (MTC), Sol, color-coded Risk Gauge, Battery & Oxygen rings, Audio Toggle, and Guided Mode switch.
- **MARS-GUARD Buddy**: Animated astronaut helmet / rover companion providing reactive 1-sentence tips and anomaly warnings.
- **Guided Mission Mode**: Interactive 8-step story walk-through taking users step-by-step through EVA-07 with highlighted action targets.
- **Web Audio Soundscape**: Procedural audio synthesizer (ambient Mars hum, UI chirps, alarm sweeps) — OFF by default with one-tap toggle.

---

## 🛰️ Real NASA Data vs Simulated Mechanics

| Data Domain | Status | NASA Instrument / Mission Source | Application in MARS-GUARD |
| :--- | :--- | :--- | :--- |
| **Optical Satellite Imagery** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | MRO HiRISE (0.25 m/px) & CTX controlled mosaic | High-res surface context, boulder fields, landing site |
| **Thermal Diurnal Inertia** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | 2001 Mars Odyssey THEMIS IR Band 9 | Diurnal surface temperature (-82°C to -24°C), bedrock vs dust |
| **Spectral Mineralogy** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | MRO CRISM (Compact Reconnaissance Spectrometer) | Smectite clays, carbonates, hydrated sulfates |
| **Topography & Elevation** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | MGS MOLA + Mars Express HRSC blended DEM | 1m vertical elevation datum, slopes, escarpment profiles |
| **Atmospheric Dynamics** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | Mars 2020 Perseverance MEDA In-Situ Sensor | Pressure (718 Pa), wind speed, dust optical depth (Tau) |
| **Surface Ionizing Radiation** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | MSL Curiosity RAD (Radiation Assessment Detector) | 26.5 μSv/h baseline GCR dose rate |
| **Geochemical Composition** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | Mars 2020 Perseverance PIXL Micro-XRF | Elemental abundance (SiO2, FeO, Al2O3, MgO) |
| **Historical Mishap Reports** | <span style="color:#06b6d4;font-weight:bold;">REAL NASA DATA</span> | NASA Mishap Investigation Board (MIB) & Apollo Reports | ISS EVA 23 water leak, Apollo 15 fatigue, Apollo 17 dust |
| **Dust Storm Scenarios** | <span style="color:#f59e0b;font-weight:bold;">SIMULATED OVERLAY</span> | Synthetic contingency injection engine | Tau > 2.4 dust storm simulation with particle filter |
| **Astronaut Metabolic Telemetry**| <span style="color:#f59e0b;font-weight:bold;">SIMULATED OVERLAY</span> | LCVG thermodynamic suit models | Heart rate (BPM), workload (Watts), suit cooling loop |

*Note: All synthetic overlays carry an explicit, prominent `SIMULATED` badge in the UI.*

---

## 📸 Local NASA Asset Cache & Image Credits

A curated cache of 45 high-resolution NASA images and Mars planetary textures is stored locally under `/public/assets/nasa/` with a verified JSON manifest (`manifest.json`):

- **Mars Surface 3D Color Mosaic**: NASA Viking Orbiter MDIM2.1 Global Mosaic (MSSS/JPL)
- **Mars Elevation Bump Map**: MGS MOLA Global Topographic Elevation Model (NASA/GSFC)
- **Jezero Crater Landing Ellipse & Delta Front**: NASA / JPL-Caltech / University of Arizona (MRO HiRISE PIA24331, PIA24350, PIA25022)
- **Perseverance Surface Panoramas & Mastcam-Z**: NASA / JPL-Caltech / ASU / MSSS (PIA23962, PIA24546, PIA26378)
- **Drill & Sampling Operations at Skinner/Wildcat Ridge**: NASA / JPL-Caltech (PIA26575, PIA24925, PIA24929)
- **Historical Spaceflight Incident Imagery**: NASA Apollo Lunar Surface Journal (Apollo 15, Apollo 17) & NASA ISS Program Office (ISS EVA 23)

---

## ⚡ Quick Start & Running the Platform

### 1. Backend Server
```bash
cd backend
python -m uvicorn app.main:app --port 8000 --reload
```
*Health check: `http://localhost:8000/api/health`*

### 2. Frontend Application
```bash
cd frontend
npm install
npm run build
npm run start
```
*Application opens at: `http://localhost:3000`*

### 3. Verification Suite
```bash
# Backend 12-pillar verification
cd backend
python test_server.py

# Frontend TypeScript verification
cd ../frontend
npm run type-check
```

---

## 🎬 8-Step EVA-07 Walkthrough Demo Script

1. **Step 1: 3D Mars Recon (`/`)**:
   - Rotate the 3D Mars globe, observe day/night illumination and glowing regional hotspots.
   - Tap the glowing **Jezero Crater** beacon to zoom in and open the Mission Hub card.
   - Tap **"START EVA-07 JEZERO MISSION"**.

2. **Step 2: Multi-Layer GIS (`/explorer`)**:
   - Hover and tap along the bottom strip of 8 NASA image thumbnails (Optical, Thermal, Spectral, etc.).
   - Tap on a landmark pin to inspect the slim bottom sheet (Slope, Risk, Elevation) and expand the live elevation ribbon.

3. **Step 3: Route Comparison Lab (`/planner`)**:
   - Drag the large **"Speed vs Comfort"** slider.
   - Watch the 3 candidate paths (Aegis SafePath, Ares Balanced, Apex Direct) re-rank live.
   - Tap the locked **Apex Direct** card to view the safety violation reason (19.5° slope exceeds 18° limit).
   - Tap **"ENGAGE OPTIMAL ROUTE"** (+100 XP).

4. **Step 4: Mission Simulator (`/simulation`)**:
   - Toggle between Tactical 2D Map and the first-person **Helmet HUD View**.
   - Tap **"Severe Dust Storm"** from the Disaster Deck.
   - Watch the screen react with dynamic dust particle overlays, red alert vignette, and a slide-in **Lesson from History** toast.

5. **Step 5: Safety Archive (`/history`)**:
   - Filter through historical missions using icon chips (Water, Fatigue, Dust, Radiation).
   - Review the Luca Parmitano ISS EVA 23 water leak report with official NASA citations and Mars gravity limits.

6. **Step 6: Experiment Lab (`/experiments`)**:
   - Select the **Delta Core Drilling** illustrated template.
   - Observe the large glowing **Class C (Human Approval Required)** traffic-light dial.
   - Tap **"APPROVE"** and execute the drilling run on the surface (+75 XP).

7. **Step 7: 3D Digital Twin (`/digital-twin`)**:
   - Orbit and zoom around the 3D Jezero delta terrain.
   - Drag the **Before / After Observation Split Slider** to compare orbital prior recon with in-situ LiDAR.
   - Scrubber across the time-lapse mission replay bar.

8. **Step 8: Mission Report Story (`/reports`)**:
   - Play the interactive story replay animation showing each highlight reel event.
   - Verify the 96% Safety Scorecard and click **"EXPORT / PRINT PDF"**.

---

## 📊 Performance Benchmarks

Screenshots captured with Headless Chrome across all 11 screens (Desktop 1280x820 & Mobile 390x844) are stored in `/docs/screenshots/`:

| Screen | Route | Desktop Load Time | Mobile Load Time | 3D / Interactive Engine |
| :--- | :--- | :--- | :--- | :--- |
| **01 Home Globe** | `/` | 1082 ms | 980 ms | Three.js WebGL (60 FPS) |
| **02 Map Explorer** | `/explorer` | 1031 ms | 890 ms | Leaflet / Canvas GIS |
| **03 Mission Simulator** | `/simulation` | 822 ms | 740 ms | Canvas / Visor HUD |
| **04 Route Lab** | `/planner` | 868 ms | 790 ms | SVG Path Glow Engine |
| **05 Experiment Lab** | `/experiments` | 832 ms | 750 ms | Recharts + CSS 3D |
| **06 Risk Radar** | `/risk` | 784 ms | 710 ms | CSS Radar Beam + Recharts |
| **07 Digital Twin** | `/digital-twin` | 1016 ms | 920 ms | Three.js WebGL (60 FPS) |
| **08 Data Studio** | `/datasets` | 828 ms | 760 ms | CSS 3D Card Flip Wall |
| **09 Safety Archive** | `/history` | 798 ms | 730 ms | Filmstrip Slider |
| **10 Live Telemetry** | `/overview` | 816 ms | 740 ms | Heartbeat ECG Recharts |
| **11 Mission Report** | `/reports` | 776 ms | 700 ms | Interactive Story Reel |

*All screens operate with zero layout shift, optimized asset delivery, and respect user motion preferences.*
