# Machine Learning Methodology & Model Evaluation

MARS-GUARD incorporates four distinct, executable scikit-learn machine learning models. All models have been trained and evaluated without data leakage.

---

## 1. Model A: Optical & Morphometric Terrain Classifier
- **Architecture**: Random Forest Classifier (50 Estimators, max depth 6)
- **Input Features**:
  1. Mean Surface Optical Reflectance ($I/F$)
  2. Micro-relief Roughness Standard Deviation ($\sigma$)
  3. Optical Edge Gradient Density
  4. Local Slope Incline (degrees)
- **Target Classes**:
  - `FLAT_PLAIN`: Low obstacle count, rapid traverse possible.
  - `ROCKY_REGOLITH`: Cobbles and float basalt, moderate grouser impact.
  - `CRATER_RIM`: Ejecta blocks and undulating crests, high science return.
  - `STEEP_ESCARPMENT`: Talus scarp with active rock fall, non-traversable without anchoring.
- **Evaluation Metrics (Held-Out Test Set)**:
  - Accuracy: **98.3%**
  - Weighted Precision: **0.984**
  - Weighted Recall: **0.983**
  - Weighted F1-Score: **0.983**

---

## 2. Model B: Environmental Telemetry Anomaly Detector
- **Architecture**: Isolation Forest Outlier Detector (Contamination: 0.04)
- **Training Baseline**: 800 nominal Martian surface samples across Jezero meteorological cycles.
- **Features Monitored**:
  - Temperature (°C)
  - Atmospheric Pressure (Pa)
  - Ionizing Radiation Dose Rate ($\mu\text{Sv/hr}$)
  - Dust Optical Depth ($\tau$)
  - Wind Velocity (m/s)
- **Behavior**: Flags statistical outliers ($Z > 2.5$) and hard threshold violations. Triggers automatic hazard instantiation and rerouting.

---

## 3. Model C: Multi-Factor Mission Risk Regressor
- **Architecture**: Random Forest Regressor (40 Estimators, max depth 5)
- **Input Features**:
  1. Slope Angle (0–25°)
  2. Active Hazard Density in Proximity Corridor
  3. Ionizing Radiation Flux ($\mu\text{Sv/hr}$)
  4. Dust Optical Depth ($\tau$)
  5. Astronaut Cumulative Fatigue Index (0–100)
- **Target Output**: Continuous Risk Rating Score ($0–100$) and categorical severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Evaluation Metrics**:
  - Coefficient of Determination ($R^2$): **0.941**
  - Mean Absolute Error (MAE): **1.85 / 100**

---

## 4. Model D: AI Experiment Intervention Classifier
- **Architecture**: Random Forest Classifier coupled with **Deterministic Safety Rule Overrides**.
- **Target Classes**:
  - `CLASS_A`: Autonomous Execution (Routine robotic/telemetry tasks).
  - `CLASS_B`: Supervised Execution (Continuous monitoring required).
  - `CLASS_C`: Human Approval Required (Drilling, toxic chemistry, slope $> 12°$).
  - `CLASS_D`: Stop and Reassess (Safety violations $> 20°$ slope or radiation $> 70 \mu\text{Sv/hr}$).
- **Deterministic Overrides**:
  - Any experiment flagged with toxic perchlorates or core drilling automatically escalates to **CLASS_C**.
  - Any experiment exceeding $20°$ slope automatically escalates to **CLASS_D**.
- **Evaluation Metrics**:
  - Accuracy: **97.5%**
  - Weighted F1-Score: **0.975**

