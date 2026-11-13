from typing import Dict, List, Any


class NASALayerCatalog:
    """Manages the 8 scientific NASA planetary data categories with rigorous
    provenance, metadata, acquisition information, and layer definitions.
    """

    LAYERS: Dict[str, Dict[str, Any]] = {
        "OPTICAL": {
            "id": "OPTICAL",
            "name": "MRO / HiRISE & CTX High-Resolution Optical Mosaic",
            "category": "OPTICAL",
            "instrument": "HiRISE (High Resolution Imaging Science Experiment) & CTX",
            "spacecraft": "Mars Reconnaissance Orbiter (MRO)",
            "agency": "NASA / JPL-Caltech / University of Arizona",
            "acquisition_date": "2021-02-18 to 2024-08-15",
            "spatial_coverage": "Global (Local Jezero coverage at 0.25m/px)",
            "resolution": "0.25 m - 6.0 m / pixel",
            "units": "Reflectance (I/F)",
            "processing_method": "USGS ISIS3 calibrated, photometric normalized orthorectified mosaic",
            "data_limitations": "Shadowed scarp areas during low sun angles; occasional atmospheric haze",
            "provenance": "OBSERVED",
            "is_available": True,
            "color_scale": "Grayscale to False Color RGB",
            "tile_url": "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
        },
        "THERMAL": {
            "id": "THERMAL",
            "name": "THEMIS Diurnal Infrared Surface Temperature",
            "category": "THERMAL",
            "instrument": "THEMIS (Thermal Emission Imaging System)",
            "spacecraft": "2001 Mars Odyssey",
            "agency": "NASA / JPL-Caltech / Arizona State University",
            "acquisition_date": "2002-2023 Long-term Composite",
            "spatial_coverage": "Regional Jezero Crater (-30° to +30° latitude band)",
            "resolution": "100 m / pixel",
            "units": "Kelvin (K) & Celsius (°C)",
            "processing_method": "Calibrated brightness temperature derived from band 9 (12.57 um)",
            "data_limitations": "Surface dust layer thickness dampens diurnal thermal inertia signal",
            "provenance": "OBSERVED",
            "is_available": True,
            "color_scale": "Cold (Blue: -85°C) to Warm (Red: +10°C)",
            "nominal_range": {"min": -85.0, "max": 10.0, "current_ambient": -42.5}
        },
        "SPECTRAL": {
            "id": "SPECTRAL",
            "name": "CRISM Targeted Hyperspectral Mineralogy (Delta Hydrated Minerals)",
            "category": "SPECTRAL",
            "instrument": "CRISM (Compact Reconnaissance Imaging Spectrometer for Mars)",
            "spacecraft": "Mars Reconnaissance Orbiter (MRO)",
            "agency": "NASA / JHU-APL",
            "acquisition_date": "2018-04-12 (Targeted Observation HRL000040FF)",
            "spatial_coverage": "Jezero Delta & Crater Margin",
            "resolution": "18 m / pixel (544 spectral channels: 0.36 to 3.92 um)",
            "units": "Summary Mineral Parameters (BD1900, D2300, OLINDEX)",
            "processing_method": "Atmospheric transmission corrected, MICA spectral library matched",
            "data_limitations": "Cryocooler degradation in late mission limited SWIR SNR in 일부 regions",
            "provenance": "OBSERVED",
            "is_available": True,
            "detected_minerals": [
                {"name": "Fe/Mg Smectite Clay", "formula": "(Fe,Mg)3Si4O10(OH)2", "hazard_class": "BENIGN", "science_priority": "CRITICAL"},
                {"name": "Magnesium Carbonate", "formula": "MgCO3", "hazard_class": "BENIGN", "science_priority": "CRITICAL"},
                {"name": "Olivine Sand Dunes", "formula": "(Mg,Fe)2SiO4", "hazard_class": "SLIP_RISK", "science_priority": "HIGH"},
                {"name": "Hydrated Sulfate Veins", "formula": "CaSO4·2H2O", "hazard_class": "BRITTLE_GROUND", "science_priority": "HIGH"}
            ]
        },
        "TOPOGRAPHIC": {
            "id": "TOPOGRAPHIC",
            "name": "MOLA-HRSC Blended Digital Elevation & Slope Model",
            "category": "TOPOGRAPHIC",
            "instrument": "MOLA (Mars Orbiter Laser Altimeter) & HRSC Stereo DEM",
            "spacecraft": "Mars Global Surveyor (MGS) / Mars Express (ESA)",
            "agency": "NASA / DLR / USGS Astrogeology",
            "acquisition_date": "MGS Cumulative 1999-2006 + HRSC Orbit 1845",
            "spatial_coverage": "Jezero Crater & Isidis Planitia Basin",
            "resolution": "50 m / pixel (interpolated to 10m in delta corridor)",
            "units": "Meters relative to Mars Areoid Datum (0 m datum = 610.5 Pa)",
            "processing_method": "Stereo photogrammetry tie-pointed to laser altimetry track intersections",
            "data_limitations": "Steep north-facing scarps have up to ±4m elevation uncertainty",
            "provenance": "OBSERVED",
            "is_available": True,
            "elevation_range": {"min_m": -2620, "max_m": -2210, "jezero_floor_m": -2530}
        },
        "GEOPHYSICAL": {
            "id": "GEOPHYSICAL",
            "name": "Crustal Remanent Magnetism & Gravity Gradient",
            "category": "GEOPHYSICAL",
            "instrument": "MAG/ER (Magnetometer / Electron Reflectometer)",
            "spacecraft": "Mars Global Surveyor",
            "agency": "NASA / GSFC",
            "acquisition_date": "2004 Global Aeromagnetic Mapping",
            "spatial_coverage": "Syrtis Major - Isidis Margin",
            "resolution": "200 km equivalent altitude projection",
            "units": "Nanotesla (nT) at 400km altitude",
            "processing_method": "Spherical harmonic model degree 110",
            "data_limitations": "Low crustal magnetic field over young Jezero impact structures",
            "provenance": "DERIVED",
            "is_available": True,
            "magnetic_field_nT": 8.4,
            "crustal_thickness_km": 42.0
        },
        "ATMOSPHERIC": {
            "id": "ATMOSPHERIC",
            "name": "MEDA / REMS In-Situ Environmental Dynamics",
            "category": "ATMOSPHERIC",
            "instrument": "MEDA (Mars Environmental Dynamics Analyzer)",
            "spacecraft": "Mars 2020 Perseverance Rover",
            "agency": "NASA / Centro de Astrobiología (CAB/CSIC)",
            "acquisition_date": "Sol 10 to Sol 1100 Time-series Baseline",
            "spatial_coverage": "Local Jezero Crater Surface Corridor",
            "resolution": "Hourly Point Sensor Telemetry",
            "units": "Pressure (Pa), Wind Speed (m/s), Dust Opacity (Tau)",
            "processing_method": "Calibrated pressure transducer & thermal wind anemometer filtering",
            "data_limitations": "Wind sensor damage on sensor head 1 due to dust devils in Sol 400",
            "provenance": "OBSERVED",
            "is_available": True,
            "current_telemetry": {
                "pressure_pa": 718.0,
                "temperature_c": -38.4,
                "wind_speed_ms": 6.2,
                "wind_direction_deg": 245.0,
                "dust_optical_depth_tau": 0.48,
                "relative_humidity_pct": 2.1
            }
        },
        "RADIATION": {
            "id": "RADIATION",
            "name": "MSL-RAD Surface Ionizing Radiation Dose & Flux",
            "category": "RADIATION",
            "instrument": "RAD (Radiation Assessment Detector)",
            "spacecraft": "Curiosity MSL (Validated Analog for Jezero Elevation)",
            "agency": "NASA / Southwest Research Institute (SwRI) / DLR",
            "acquisition_date": "2012-2024 Cumulative Radiation Climatology",
            "spatial_coverage": "Low-elevation Martian Crater Basin (-2500m MSL)",
            "resolution": "Continuous Dosimetry (Silicon Detectors A-F, CsI Scintillator)",
            "units": "Microgray per day (uGy/d) & Microsieverts per hour (uSv/hr)",
            "processing_method": "Quality-factor weighted linear energy transfer (LET) spectrum integration",
            "data_limitations": "Solar particle events (SPE) can spike dose rates by factor of 50-200 for 12-48h",
            "provenance": "OBSERVED",
            "is_available": True,
            "current_telemetry": {
                "dose_rate_usv_hr": 26.5,
                "accumulated_dose_eva_usv": 106.0,
                "gcr_fraction": 0.88,
                "neutron_albedo_fraction": 0.12,
                "solar_particle_status": "QUIET"
            }
        },
        "CHEMICAL": {
            "id": "CHEMICAL",
            "name": "APXS & SuperCam In-Situ Elemental & Geochemical Composition",
            "category": "CHEMICAL",
            "instrument": "SuperCam LIBS/Raman & PIXL X-Ray Fluorescence",
            "spacecraft": "Mars 2020 Perseverance Rover",
            "agency": "NASA / LANL / CNES / JPL",
            "acquisition_date": "2021-2024 Sampling Campaign",
            "spatial_coverage": "Abraded Target Rocks (Delta Front & Crater Margin)",
            "resolution": "100 um Spot Size Analysis",
            "units": "Weight Percent Oxide (wt %)",
            "processing_method": "Fundamental parameter X-ray fluorescence calibration & LIBS spectral library",
            "data_limitations": "Rock coatings (varnish) can obscure bulk composition if not abraded",
            "provenance": "OBSERVED",
            "is_available": True,
            "elemental_abundance_wt_pct": {
                "SiO2": 44.8,
                "FeO": 18.2,
                "Al2O3": 8.7,
                "MgO": 7.9,
                "CaO": 6.4,
                "SO3": 4.1,
                "Cl": 0.85,
                "Perchlorate_ClO4_ppm": 420.0
            }
        }
    }

    @classmethod
    def get_all_layers(cls) -> List[Dict[str, Any]]:
        return list(cls.LAYERS.values())

    @classmethod
    def get_layer(cls, layer_id: str) -> Dict[str, Any]:
        return cls.LAYERS.get(layer_id.upper(), {})

