# Simulation Methodology & Physics Approximations

MARS-GUARD includes a pre-mission numerical simulation laboratory that allows Earth-based researchers and planners to stress-test procedures before astronauts perform them on the surface of Mars.

---

## 1. Spacesuit Thermodynamics & Heat Exchange
Models the internal thermal balance of an astronaut inside a planetary exploration suit in a 700 Pa CO2 atmosphere:

$$\dot{Q}_{\text{net}} = \dot{Q}_{\text{metabolic}} - \dot{Q}_{\text{radiation}} - \dot{Q}_{\text{convection}} - \dot{Q}_{\text{lcvg}}$$

Where:
- $\dot{Q}_{\text{radiation}} = \varepsilon \sigma A (T_{\text{suit}}^4 - T_{\text{sky}}^4)$
  - $\varepsilon = 0.85$ (Multi-layer insulation)
  - $\sigma = 5.67 \times 10^{-8} \text{ W/m}^2\text{K}^4$
  - $A = 2.2 \text{ m}^2$
  - $T_{\text{sky}} = 180 \text{ K}$ (Effective infrared sky temperature)
- $\dot{Q}_{\text{convection}} = h_{\text{CO2}} A (T_{\text{suit}} - T_{\text{ambient}})$
  - $h_{\text{CO2}} \approx 12.5 \text{ W/m}^2\text{K}$ under 700 Pa CO2
- $\dot{Q}_{\text{lcvg}} = \text{Cooling garment heat absorption}$

---

## 2. Ionizing Radiation Dosimetry & SPE Propagation
Calculates accumulated ionizing radiation dose accounting for spacesuit areal mass shielding:

$$D_{\text{total}} = \int_0^T (\dot{D}_{\text{GCR}} + \dot{D}_{\text{SPE}}(t)) \cdot e^{-\mu \cdot x} \, dt$$

Where:
- $\dot{D}_{\text{GCR}} = 26.5 \mu\text{Sv/hr}$ (MSL-RAD baseline at -2500m MOLA datum)
- $\dot{D}_{\text{SPE}} = 145 \mu\text{Sv/hr}$ during active Solar Particle Events
- $x = 5.0 \text{ g/cm}^2$ (Areal density of planetary spacesuit)
- $\mu = 0.04 \text{ cm}^2/\text{g}$ (Exponential mass attenuation coefficient)

---

## 3. Atmospheric Dust Storm Transmission
Calculates optical attenuation and photovoltaic output loss using the Beer-Lambert law:

$$I(t) = I_0 \cdot \exp\left(-\frac{\tau(t)}{\cos \theta_z}\right)$$

Where:
- $I_0 = 590 \text{ W/m}^2$ (Solar irradiance at top of Martian atmosphere at 1.52 AU)
- $\tau(t) = \tau_0 \cdot e^{k t}$ (Dust optical depth accumulation)
- $\theta_z = 35^\circ$ (Solar zenith angle)

---

## 4. Rover Wheel-Soil Terramechanics (Bekker-Wong Approximation)
Models wheel slip on unconsolidated basaltic sand dunes:

$$\text{Slip } S = \begin{cases} 
5.0 + 45.0 \cdot \tan(\theta) & \text{if } \theta < \theta_{\text{crit}} \\
30.0 + 12.0 \cdot (\theta - \theta_{\text{crit}}) & \text{if } \theta \ge \theta_{\text{crit}}
\end{cases}$$

Where $\theta_{\text{crit}} = \phi - 8.0^\circ$ and $\phi = 32^\circ$ (Internal angle of friction for dry Martian basaltic sand).

---

## 5. Astronaut Metabolic Workload & Cardiovascular Strain
Adapts the Pandolf-Givoni metabolic expenditure equation for planetary exploration under 0.38g gravity:

$$\dot{W} = 1.5 M_{\text{total}} + 2.0 (M_{\text{total}} + M_{\text{load}}) \cdot v^2 + 18.0 \cdot \tan(\theta) \cdot 100$$

Fatigue index accumulates non-linearly with total time on foot and vertical elevation gain. Sustained heart rates $> 145 \text{ bpm}$ trigger safety warnings modeled after Apollo 15 biomedical lessons.

