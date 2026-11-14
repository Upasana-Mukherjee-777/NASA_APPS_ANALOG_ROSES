# ARES: RED PLANET EXPEDITION (MARS-GUARD)
### Immersive, AI-Powered Martian Exploration & Planetary Survival Game
**Destination Repository**: [https://github.com/Upasana-Mukherjee-777/NASA_APPS_ANALOG_ROSES](https://github.com/Upasana-Mukherjee-777/NASA_APPS_ANALOG_ROSES)

---

## 🌟 Overview: A Whole Martian Exploration Game

**ARES: RED PLANET EXPEDITION** transforms the scientific MARS-GUARD safety platform into a playable, visually rich, AI-powered Martian exploration game designed to be accessible to everyone—from complete space beginners to seasoned astrophysics enthusiasts.

### The Core Gameplay Loop
```
 LAND  ──►  EXPLORE  ──►  DISCOVER  ──►  SCAN  ──►  ANALYZE  ──►  DECIDE  ──►  OBJECTIVES  ──►  REWARDS
```

1. **Land**: Touch down at Octavia E. Butler datum or Mount Sharp sulfate unit.
2. **Explore**: Drive your 6-wheeled exploration rover across realistic regolith, dunes, and ancient delta scarps.
3. **Discover**: Encounter geological formations (Kodiak Butte mesa, Neretva canyon, clay mudstones, hydrothermal veins).
4. **Scan**: Fire procedural multi-spectral radar and laser altimetry pulses to inspect slope angles, mineral spectra, and subsurface ice.
5. **Analyze**: Plain-English AI interpretations explain what each scan means without technical jargon.
6. **Decide**: Plan safe paths around dangerous >18° rollover inclines and navigate through atmospheric dust storms.
7. **Objectives**: Complete tiered expedition missions (Cadet, Surveyor, Specialist, Pioneer).
8. **Rewards**: Cache physical core samples into your rover hold, earn Exploration XP, level up, and unlock original achievement badges!

---

## 🤖 Meet PIP — Your Autonomous AI Companion

**PIP (Planetary Intelligence Partner)** is an expressive, adorable, floating robotic companion that accompanies you throughout Mars:

- **Expressive OLED Visor**: Renders dynamic digital eye animations including idle blinking, crescent happy eyes, rotating radar eyes during analysis, warning hazard symbols, and celebratory starbursts.
- **Audio Voice Chirps**: Web Audio API procedural synthesizer generates cheerful robotic chimes, curiosity warbles, and alert sirens. Zero external audio file dependencies.
- **Plain-English Translator (ELI5)**: Breaks down scientific concepts (MOLA datum, CRISM smectite clay, atmospheric dust tau) into intuitive, beginner-friendly analogies.
- **Interactive Knowledge Hub**: Players can click PIP anytime or ask questions about Mars history, terrain safety, battery preservation, and mission hints.

---

## 🪐 Living Martian Environment

- **Dynamic Canvas & WebGL Simulation**: 60 FPS animated atmospheric dust particles with realistic wind drift vectors.
- **Dynamic Day / Night Cycle**:
  - *Martian Dawn*: Crimson-purple twilight horizon.
  - *Sol High Noon*: Butterscotch sky with sharp ground shadows and peak solar array charging.
  - *Dust Sunset*: The iconic Martian blue sunset halo with deep orange horizons.
  - *Martian Night*: Interstellar starfields (180+ twinkling stars), rapid orbital passage of moon Phobos, distant Deimos, and rover twin headlight beams illuminating the rocky terrain.
- **Interactive Rover Mobility**: Click anywhere on the terrain to command the rover to drive, leaving track marks in the red soil and kicking up dust particles.
- **Weather Presets**: Toggle between Clear Sol, swirling Dust Devils, and heavy Tau > 2.0 Dust Storm events.

---

## 🗺️ Playable Multi-Layer Map & Terrain Scanner

- **Tactical Waypoint Navigation**: Real Jezero and Gale Crater landmarks (Octavia E. Butler Landing, Kodiak Butte, Western Delta Front, Neretva Vallis, Mount Sharp Sulfate Unit).
- **Interactive Scanning Station**:
  - LiDAR Elevation & Slope Analysis with automated rollover warnings (&gt;18° threshold).
  - CRISM & PIXL Mineralogy breakdown (Smectite Clay, Olivine, Basalt, Hematite, Sulfates).
  - Subsurface Radar Ground-Penetrating Ice Likelihood (% probability).
  - Core Caching Mechanism: Collect geological specimens into the hermetic titanium sample carousel.
- **Martian Field Codex**: Interactive collection journal cataloging all retrieved core specimens and high-resolution planetary photographs.

---

## 🛰️ Authentic Planetary Datasets vs Simulated Gameplay

| Data Domain | Status | Scientific Observation Source | In-Game Application |
| :--- | :--- | :--- | :--- |
| **Optical Imagery** | <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | MRO HiRISE (0.25 m/px) & CTX controlled mosaic | High-res surface context, boulder fields, landing site |
| **Thermal Inertia** | <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | 2001 Mars Odyssey THEMIS IR Band 9 | Diurnal surface temperature (-82°C to -24°C), bedrock vs dust |
| **Mineral Spectral** | <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | MRO CRISM (Compact Reconnaissance Spectrometer) | Smectite clays, carbonates, hydrated sulfates |
| **Topography** | <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | MGS MOLA + Mars Express HRSC blended DEM | 1m vertical elevation datum, slopes, escarpment profiles |
| **Atmospheric Dynamics** | <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | Mars In-Situ Surface Station | Pressure (718 Pa), wind speed, dust optical depth (Tau) |
| **Surface Radiation** | <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | Surface Radiation Assessment Detector | 26.5 μSv/h baseline GCR cosmic ray dose rate |
| **Mount Sharp Traverse**| <span style="color:#06b6d4;font-weight:bold;">REAL OBSERVATION</span> | Gale Crater Science Traverse Archive | Stratigraphic sulfate and clay unit path |
| **Rover Survival Telemetry** | <span style="color:#f59e0b;font-weight:bold;">GAME SIMULATION</span> | Simulated gameplay mechanics | Battery discharge, solar recharge rates, chassis integrity |
| **EVA Life Support** | <span style="color:#f59e0b;font-weight:bold;">GAME SIMULATION</span> | Simulated gameplay mechanics | Oxygen reserve timer and recharge shelters |

*Note: All simulated gameplay systems carry explicit, prominent `GAME SIMULATION` badges in the interface.*

---

## 🏆 Missions & Progression

1. **Mission 01: First Footprint (Cadet)** — Touchdown at Octavia E. Butler datum, perform initial multi-spectral radar sweep, and cache first basaltic regolith core.
2. **Mission 02: Delta Riverbed Mystery (Surveyor)** — Traverse to Kodiak Butte, analyze layered strata for water-altered smectite clay, and preserve battery above 50%.
3. **Mission 03: Steep Scarp Hazards (Specialist)** — Survey Neretva Vallis gorge, detect >18° rollover hazard with scanner, and navigate safe traverse corridors.
4. **Mission 04: Mount Sharp Ascent (Pioneer)** — Access Mount Sharp sulfate unit, scan ancient evaporite lake salt layers, and earn the Ancient Water Seeker badge!

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

## 🛡️ Intellectual Property & Neutral Attribution

This application is an independent, original Martian exploration game created with custom branding, character designs, audio synthesizers, and user interfaces. Planetary scientific observations and elevation datasets are drawn from open planetary science archives (Planetary Data System, USGS Astrogeology, HiRISE, THEMIS, CRISM, and MOLA) and are attributed neutrally and factually without official agency endorsement or affiliation.
