# NASA & Planetary Data Sources Attribution

MARS-GUARD integrates eight distinct planetary scientific data categories covering the Jezero Crater corridor (-2530m MOLA elevation datum). All data products maintain rigorous provenance labelling.

---

## 1. Optical Satellite & Rover Imagery
- **Dataset**: MRO HiRISE & CTX High-Resolution Controlled Mosaic
- **Instrument**: HiRISE (High Resolution Imaging Science Experiment, 0.25 m/px) & CTX (Context Camera, 6.0 m/px)
- **Spacecraft / Agency**: Mars Reconnaissance Orbiter (MRO) — NASA / JPL-Caltech / University of Arizona
- **Acquisition Range**: 2021-02-18 to 2024-08-15
- **Provenance**: `OBSERVED`
- **Application**: Landing site context, boulder field identification, rock crawl risk assessment.

## 2. Thermal Data
- **Dataset**: THEMIS Diurnal Infrared Surface Temperature Mosaic
- **Instrument**: THEMIS (Thermal Emission Imaging System) Band 9 (12.57 um)
- **Spacecraft / Agency**: 2001 Mars Odyssey — NASA / JPL / Arizona State University
- **Resolution**: 100 m/pixel
- **Provenance**: `OBSERVED`
- **Application**: Diurnal surface temperature range (-85°C to -25°C nominal), thermal inertia, night-time frost detection.

## 3. Spectral & Mineralogical Data
- **Dataset**: CRISM Targeted Hyperspectral Mineralogy (Delta Hydrated Minerals)
- **Instrument**: CRISM (Compact Reconnaissance Imaging Spectrometer for Mars)
- **Spacecraft / Agency**: MRO — NASA / JHU-APL
- **Target Observation**: HRL000040FF (Jezero Delta Front)
- **Key Detections**: Fe/Mg Smectite Clays, Magnesium Carbonate, Olivine Sand Dune fields, Hydrated Calcium Sulfates.
- **Provenance**: `OBSERVED`
- **Application**: Scientific sampling target prioritization and slip risk avoidance on unconsolidated olivine dunes.

## 4. Topographic Data
- **Dataset**: MOLA-HRSC Blended Digital Elevation Model (DEM)
- **Instrument**: MOLA (Mars Orbiter Laser Altimeter) & HRSC Stereo Altimetry
- **Spacecraft / Agency**: Mars Global Surveyor (NASA/GSFC) & Mars Express (ESA/DLR)
- **Resolution**: 50 m/pixel (interpolated to 10m in delta corridor)
- **Datum**: Mars Areoid (0m elevation datum = 610.5 Pa CO2 triple point)
- **Provenance**: `OBSERVED`
- **Application**: Slope angle calculations, elevation profiles, crater rim identification.

## 5. Geophysical Data
- **Dataset**: Mars Global Crustal Remanent Magnetism & Gravity Gradient
- **Instrument**: MAG/ER (Magnetometer / Electron Reflectometer)
- **Spacecraft / Agency**: Mars Global Surveyor — NASA / GSFC
- **Provenance**: `DERIVED`
- **Application**: Regional tectonic stability, crustal thickness (42 km) and remnant magnetic anomaly modeling (8.4 nT).

## 6. Atmospheric & Meteorological Data
- **Dataset**: MEDA In-Situ Surface Environmental Dynamics
- **Instrument**: MEDA (Mars Environmental Dynamics Analyzer)
- **Spacecraft / Agency**: Mars 2020 Perseverance Rover — NASA / Centro de Astrobiología (CAB/CSIC)
- **Parameters**: Pressure (650-850 Pa), Wind Speed (0-25 m/s), Atmospheric Dust Optical Depth (Tau 0.3 - 1.8).
- **Provenance**: `OBSERVED`
- **Application**: Barometric pressure leak verification and local dust storm warnings.

## 7. Radiation Data
- **Dataset**: MSL-RAD Surface Ionizing Radiation Dose & Particle Flux
- **Instrument**: RAD (Radiation Assessment Detector)
- **Spacecraft / Agency**: Curiosity MSL — NASA / Southwest Research Institute (SwRI) / DLR
- **Baseline Flux**: 26.5 uSv/hr (GCR background + secondary neutron albedo)
- **Provenance**: `OBSERVED`
- **Application**: Cumulative EVA radiation exposure budgeting and Solar Particle Event (SPE) warnings.

## 8. Chemical & Elemental Composition Data
- **Dataset**: PIXL & SuperCam In-Situ Elemental & Geochemical Composition
- **Instrument**: PIXL (Planetary Instrument for X-Ray Lithochemistry) & SuperCam LIBS/Raman
- **Spacecraft / Agency**: Mars 2020 Perseverance — NASA / LANL / CNES / JPL
- **Provenance**: `OBSERVED`
- **Application**: Regolith elemental abundance (SiO2, FeO, Al2O3, MgO) and toxic perchlorate (ClO4-) detection.
