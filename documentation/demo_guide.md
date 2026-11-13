# MARS-GUARD Demonstration Mission Walkthrough

## Mission Profile: EVA-07 Near Jezero Crater
- **Title**: EVA-07: Scientific Exploration and Safety Assessment Near Jezero Crater
- **Crew**: Commander Sarah Chen, Dr. Mark Thorne (EVA Specialist)
- **Objective**: Investigate ancient lake delta smectite mudstones, collect core samples, and evaluate traversing safety along delta scarps.

---

## The Six Demonstrable Workflows

### Workflow 1: Plan a Marswalk
1. Open **Mission Planner** (`/planner`).
2. Adjust multi-objective cost weights ($\alpha, \beta, \gamma$) or modify the slope limit slider ($18^\circ$).
3. Click **Recalculate Routes**.
4. Observe the 3 generated candidates:
   - **Aegis SafePath** (Safety-Optimal): Skirts south of steep scarps, low cardiovascular load.
   - **Apex Direct** (Time-Critical): Shortest line, but crosses steeper terrain.
   - **Ares Explorer** (Science-Maximized): Detours past delta strata.
5. Review the explainable selection rationale and click **Select This Route**.

### Workflow 2: Submit a New Astronaut Observation (Adaptive Pipeline)
1. Open **Astronaut Field Console** (`/field`).
2. Select Category `RADIATION` or `DUST`.
3. Enter an elevated measurement (e.g., Radiation `48.5 uSv/hr`).
4. Click **Submit Observation & Trigger Adaptive Intelligence**.
5. Observe the live feedback:
   - Statistical anomaly detector flags elevated Z-score.
   - New active hazard is instantiated in the database.
   - Digital twin state increments to the next version.

### Workflow 3: Historical Safety Intelligence & RAG
1. Open **Historical Safety RAG** (`/history`).
2. Enter a mission condition query: *"spacesuit helmet water leak cooling loop"*.
3. Click **Semantic Match**.
4. Inspect the retrieved investigation report: **ISS Expedition 36 EVA 23 (Luca Parmitano)**.
5. Review root cause, consequences, preventive lesson, and exact NASA MIB citation.

### Workflow 4: Experiment Classification & Human Commander Approval
1. Open **Experiment Management** (`/experiments`).
2. Click **New Experiment** and choose *Geological Sampling (Drilling)* on an $8^\circ$ slope.
3. Observe live AI projection: classified as **CLASS C (Human Approval Required)** due to percussion vibration and fine dust risks.
4. Click **Register Experiment**.
5. Note that attempting to start it prompts for authorization.
6. Click **Grant Commander Approval**, enter Commander Sarah Chen's name, and confirm authorization.

### Workflow 5: Pre-Mission Earth Simulation
1. Open **Earth Simulation Lab** (`/simulation`).
2. Select **Spacesuit Thermodynamics** or **Radiation Dosimetry**.
3. Adjust metabolic rate (e.g., $450\text{W}$ heavy coring) or activate Solar Particle Event.
4. Click **Run Physics Simulation**.
5. Review the time-series curves, safety margin thresholds, and physics assumptions.
6. Click **Compare Scenarios** for side-by-side comparison.

### Workflow 6: 3D Digital Twin & Timeline Replay
1. Open **3D Digital Twin** (`/digital-twin`).
2. Interact with the 3D surface model (orbital pan across Jezero basin).
3. View Perseverance rover model, astronaut position cylinders, and active hazard cones.
4. Click **Replay Sortie Timeline** to step through mission events.
