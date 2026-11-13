# MARS-GUARD System Architecture

## Overview
**MARS-GUARD (Martian Adaptive Risk, Safety & Guidance Using AI, Research and Digital-Twin Intelligence)** is an integrated planetary mission intelligence and astronaut safety platform developed for NASA's Space Apps Challenge (*Interplanetary Survival Guide: Martian Map*).

Its central doctrine is: **"Explore intelligently. Learn from experience. Return safely."**

---

## Architectural Principles
1. **Safety-First Non-Bypassable Constraints**: Safety is not reduced to a weighted score. Hard boundaries (slope limits, active hazard exclusion zones, consumable life-support thresholds) strictly invalidate mission corridors.
2. **Experience-Informed Intelligence**: Evaluates current field observations against documented historical spaceflight mishaps (Apollo, Skylab, Space Shuttle, ISS) using Retrieval-Augmented Generation (RAG) with exact traceable citations.
3. **Adaptive Event-Driven Reactivity**: Incoming astronaut observations update local risk fields, re-evaluate active traverse routes, check active scientific experiments, and update the 3D digital twin.
4. **Transparent Data Provenance**: Every parameter is tagged explicitly as **OBSERVED** (calibrated NASA sensor), **DERIVED** (calculated geospatial/physical product), or **SIMULATED** (demonstration physics model).

---

## Component Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Next.js 14 Frontend UI                          │
│   (Overview, Explorer, Planner, Field Console, Risk, History RAG,       │
│    Experiments, Simulation Lab, 3D Digital Twin, Datasets, Reports)    │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │ HTTP / REST API (port 8000)
┌─────────────────────────────────▼──────────────────────────────────────┐
│                         FastAPI Application Core                       │
│  ┌───────────────────────┬──────────────────────┬───────────────────┐  │
│  │ Geospatial & MOLA GIS │ Constrained A* Route │ Multi-Factor Risk │  │
│  ├───────────────────────┼──────────────────────┼───────────────────┤  │
│  │ Historical RAG Engine │ AI Experiment Engine │ Simulation Lab    │  │
│  ├───────────────────────┼──────────────────────┼───────────────────┤  │
│  │ 3D Digital Twin Sync  │ Telemetry Streamer   │ ML Model Suite    │  │
│  └───────────────────────┴──────────────────────┴───────────────────┘  │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────────────┐
│                    Persistence & Knowledge Base                        │
│   - SQLite / PostgreSQL + PostGIS (Missions, Hazards, Observations)    │
│   - Curated NASA Mishap Archive (ISS EVA 23, Apollo 15, Apollo 17,     │
│     STS-37, STS-121, Skylab 2, MSL Curiosity Wheel Wear)              │
│   - 8 Multimodal NASA Data Layer Products (HiRISE, THEMIS, CRISM,      │
│     MOLA, MGS MAG, MEDA, MSL RAD, PIXL/APXS)                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## The Eight Functional Pillars
- **Module 1**: Real-Time Data Entry & Adaptive Mission Intelligence (automated validation, anomaly scoring, hazard instantiation, route recalculation).
- **Module 2**: Interactive Martian Map & Intuitive Navigation (3 map modes: Planning, Field, Control; 8 toggleable NASA layers, landmark queries).
- **Module 3**: Safety-First Route Optimization & Comfort (Cost function $J = \alpha R + \beta C + \gamma T$; 3 candidate routes + Emergency Evacuation Path).
- **Module 4**: Eight-Category Multimodal NASA Data Integration (Optical, Thermal, Spectral, Topographic, Geophysical, Atmospheric, Radiation, Chemical).
- **Module 5**: AI-Based Experiment Intervention Classification (Classes A, B, C, D; deterministic safety rule overrides; mandatory Commander approval).
- **Module 6**: Earth-Based Martian Experiment Simulation Lab (Spacesuit thermodynamics, radiation dosimetry, dust attenuation, rover terramechanics, workload).
- **Module 7**: Historical Astronaut Incident & Experience Intelligence (NASA Mishap Investigation Board reports, NTRS citations, engineering lessons).
- **Module 8**: Astronaut-Updated 3D Digital Twin (Three.js procedural Jezero terrain mesh, rover/astronaut tracking, timeline event replay).
