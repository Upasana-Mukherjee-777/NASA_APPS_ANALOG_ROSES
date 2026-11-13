# MARS-GUARD
### Martian Adaptive Risk, Safety & Guidance Using AI, Research and Digital-Twin Intelligence
**Developed for NASA's Space Apps Challenge 2026**  
**Challenge**: *Interplanetary Survival Guide: Martian Map*  
**Repository**: [https://github.com/Upasana-Mukherjee-777/NASA_Analog_Roses](https://github.com/Upasana-Mukherjee-777/NASA_Analog_Roses)

---

## 🚀 Overview

**MARS-GUARD** is an integrated planetary mission intelligence and astronaut safety platform supporting future human missions to Mars.

A conventional planetary map tells an astronaut where a landmark is. **MARS-GUARD** answers:
1. *Is this route safe for human foot traversal under spacesuit mass?*
2. *What environmental hazards exist in this corridor?*
3. *What can we learn from documented historical spaceflight mishaps (Apollo, Skylab, Space Shuttle, ISS)?*
4. *Which route minimizes astronaut cardiac fatigue while satisfying non-negotiable safety constraints?*
5. *Which scientific experiments can be automated versus those requiring mandatory Mission Commander approval?*
6. *How does the digital twin adapt in real-time when astronauts submit new observations?*

**Core Doctrine**: *"Explore intelligently. Learn from experience. Return safely."*

---

## 🏛 The Eight Functional Pillars

| Module | Name | Key Functionality |
| :--- | :--- | :--- |
| **01** | **Adaptive Mission Intelligence** | Real-time observation entry, automated anomaly detection, hazard instantiation, dynamic rerouting |
| **02** | **Interactive Martian Explorer** | Jezero Crater GIS map with 8 toggleable NASA layers, landmark queries, and 3 operational modes |
| **03** | **Safety-First Route Optimizer** | Constrained A* pathfinding with cost $J = \alpha R + \beta C + \gamma T$ and strict slope/hazard exclusion |
| **04** | **Multimodal NASA Data** | Optical (HiRISE), Thermal (THEMIS), Spectral (CRISM), Topographic (MOLA), Geophysical, Atmospheric (MEDA), Radiation (RAD), Chemical (PIXL) |
| **05** | **AI Experiment Intervention** | Classes A, B, C, D classification with deterministic safety rule overrides and enforced human approval |
| **06** | **Earth Simulation Lab** | Physics-based numerical modeling of spacesuit thermodynamics, radiation dosimetry, dust opacity, and crew fatigue |
| **07** | **Historical Safety RAG** | Documented NASA mishap knowledge base (ISS EVA 23 water leak, Apollo 15 fatigue, Apollo 17 dust) with traceable citations |
| **08** | **3D Digital Twin** | Three.js interactive 3D Jezero surface model with rover/astronaut tracking and timeline event replay |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Three.js, Lucide Icons, Axios.
- **Backend**: FastAPI, Python 3.12, Pydantic, SQLAlchemy 2.0 (asyncio + sync engine), SQLite / PostgreSQL.
- **AI / Machine Learning**: Scikit-Learn (Random Forest Terrain Classifier, Isolation Forest Anomaly Detector, Risk Regressor, Experiment Intervention Classifier), NumPy, SciPy.
- **Geospatial & Planetary GIS**: Mars Mean Spherical Geodesy ($R = 3389.5\text{ km}$), MOLA-HRSC Elevation Model, Great-Circle Haversine.

---

## ⚡ Quick Start & Local Execution

### Prerequisites
- Node.js (v18+ or v20+)
- Python 3.10+ (tested on Python 3.12)
- Git

### 1. Clone & Setup
```bash
git clone https://github.com/Upasana-Mukherjee-777/NASA_Analog_Roses.git
cd NASA_Analog_Roses
```

### 2. Backend Execution
```bash
cd backend

# Install dependencies
pip install fastapi uvicorn pydantic pydantic-settings sqlalchemy aiosqlite scikit-learn networkx requests greenlet httpx

# Initialize database and seed demonstration mission
python -u -m app.database.seed_data

# Start backend server on port 8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend Swagger API Documentation available at: `http://localhost:8000/docs`*

### 3. Frontend Execution
```bash
cd ../frontend

# Install dependencies
npm install

# Run development server
npm run dev
```
*Frontend Application opens at: `http://localhost:3000`*

### 4. Running Automated Tests
```bash
cd backend
python -u test_server.py
```
*(Executes end-to-end tests verifying all 12 core backend pillars)*

---

## 🛰 Demonstration Mission: EVA-07 Near Jezero Crater

The application comes pre-loaded with demonstration mission **EVA-07: Scientific Exploration Near Jezero Crater**:
1. **Explore the Map (`/explorer`)**: Toggle optical HiRISE mosaics, THEMIS thermal bands, and CRISM smectite clay strata.
2. **Review Traverses (`/planner`)**: Compare **Aegis SafePath** (Safety-Optimal) vs **Apex Direct** vs **Ares Explorer**, and inspect the Emergency Evacuation vector.
3. **Submit Field Observation (`/field`)**: Enter elevated radiation or slope readings and observe the instant anomaly scoring, hazard creation, and digital twin sync.
4. **Inspect Historical Mishaps (`/history`)**: Search *"spacesuit helmet water leak"* to retrieve the official NASA Mishap Investigation Board report for ISS EVA 23.
5. **Simulate Scenarios (`/simulation`)**: Test spacesuit heat rejection under heavy metabolic workloads before EVA egress.
6. **3D Mission Twin (`/digital-twin`)**: Orbit the 3D surface model and replay mission events.
7. **Generate Report (`/reports`)**: Export the complete mission summary with scientific citations and safety disclaimers.

---

## 📜 Provenance & Integrity Statement
Every dataset in MARS-GUARD is clearly tagged with its provenance:
- **`OBSERVED`**: Calibrated NASA sensor observation (e.g. MOLA, THEMIS, MEDA, RAD).
- **`DERIVED`**: Georeferenced calculated product (e.g. crustal thickness, slope angle).
- **`SIMULATED`**: Explicitly labeled physical demonstration model.

MARS-GUARD does not fabricate observational data or model accuracy.

---

## 📄 License
This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.

