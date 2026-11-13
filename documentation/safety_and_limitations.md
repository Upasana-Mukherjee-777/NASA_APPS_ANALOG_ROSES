# Safety Protocols, Uncertainty & Research Limitations

## 1. Prototype Scope Disclaimer
MARS-GUARD is an advanced software engineering and planetary GIS research platform developed for the NASA Space Apps Challenge. It is **not** a flight-certified life-support control system. In operational spaceflight scenarios, human oversight by the Mission Commander and NASA Mission Control is mandatory.

---

## 2. Hard Non-Negotiable Safety Constraints
Route optimization is guided by non-negotiable hard safety constraints:
1. **Slope Angle Threshold**: Slopes $> 18^\circ$ are forbidden for unassisted foot traversal to prevent slips and cardiovascular strain.
2. **Hazard Exclusion Zones**: Active hazards require a minimum standoff distance of $15\text{m} + \text{affected radius}$.
3. **Consumable Life-Support Margin**: Estimated duration + emergency return buffer must not exceed 85% of consumable oxygen and battery capacity.
4. **Radiation Budget**: Cumulative radiation exposure for a single surface sortie must remain $< 150 \mu\text{Sv}$.

---

## 3. Mandatory Human Authorization
Automated systems cannot override human authority on high-risk actions:
- Scientific experiments flagged as **CLASS C** (such as core drilling or chemical handling) strictly require explicit sign-off by the Mission Commander.
- Experiments classified as **CLASS D** (Stop and Reassess) are automatically prohibited from initiating until environmental conditions are reassessed.

---

## 4. Uncertainty Handling
- Missing telemetry is never treated as zero risk; it is marked explicitly as `UNKNOWN`.
- Estimated or model-derived values are never represented as physical sensor measurements.
- Ground-truth historical mishap cases (ISS EVA 23, Apollo 15, Apollo 17, STS-37) are cited with exact NASA document IDs, page references, and transferability limitations.
