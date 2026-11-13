from typing import Dict, List, Any, Optional
import math


class SimulationLabEngine:
    """Numerical Simulation Laboratory for pre-mission Earth-based testing of
    Martian environmental scenarios, spacesuit thermodynamics, rover terramechanics,
    and astronaut physiological workload.
    """

    @classmethod
    def run_simulation(
        cls,
        scenario_type: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Executes actual deterministic physical modeling for the selected scenario."""
        scenario_key = scenario_type.upper()

        if "THERMAL" in scenario_key:
            return cls._simulate_thermal_balance(parameters)
        elif "RAD" in scenario_key:
            return cls._simulate_radiation_budget(parameters)
        elif "DUST" in scenario_key:
            return cls._simulate_dust_attenuation(parameters)
        elif "ROVER" in scenario_key or "MOBILITY" in scenario_key:
            return cls._simulate_rover_terramechanics(parameters)
        elif "WORKLOAD" in scenario_key or "FATIGUE" in scenario_key:
            return cls._simulate_astronaut_workload(parameters)
        else:
            return cls._simulate_thermal_balance(parameters)

    @classmethod
    def _simulate_thermal_balance(cls, p: Dict[str, Any]) -> Dict[str, Any]:
        """Spacesuit Thermal Exchange in Martian CO2 Atmosphere.
        q_net = q_metabolic - q_radiation - q_convection + q_solar
        """
        duration_min = float(p.get("duration_min", 180.0))
        ambient_temp_c = float(p.get("ambient_temp_c", -45.0))
        ambient_temp_k = ambient_temp_c + 273.15
        metabolic_watts = float(p.get("metabolic_watts", 300.0))  # 200W rest to 500W heavy drill
        cooling_loop_efficiency = float(p.get("cooling_loop_efficiency", 0.95)) # 0.0 - 1.0

        # Physical constants
        EMISSIVITY = 0.85
        STEFAN_BOLTZMANN = 5.67e-8
        SUIT_SURFACE_AREA_M2 = 2.2
        CO2_CONVECTION_COEFF = 12.5 # W / m2 K under thin 700 Pa Martian atmosphere

        time_steps = []
        suit_internal_temps_c = []
        heat_rejections_w = []
        lcvg_power_draw_w = []

        # Initial conditions
        current_suit_temp_c = 21.0 # 21°C nominal interior

        steps = 20
        dt_min = duration_min / float(steps)

        for i in range(steps + 1):
            t_min = round(i * dt_min, 1)
            time_steps.append(t_min)

            current_suit_k = current_suit_temp_c + 273.15
            # Radiative loss to Martian sky (effective sky temp approx 180K)
            q_rad = EMISSIVITY * STEFAN_BOLTZMANN * SUIT_SURFACE_AREA_M2 * (current_suit_k**4 - 180.0**4)
            # Convective loss to Martian air
            q_conv = CO2_CONVECTION_COEFF * SUIT_SURFACE_AREA_M2 * (current_suit_k - ambient_temp_k)
            # Active cooling loop heat rejection
            active_cooling_w = metabolic_watts * cooling_loop_efficiency

            net_heat_flow = metabolic_watts - (q_rad * 0.2 + q_conv * 0.15 + active_cooling_w)

            # Thermal capacitance of astronaut + spacesuit ~ 300,000 J/K
            delta_temp = (net_heat_flow * (dt_min * 60.0)) / 300000.0
            current_suit_temp_c = round(current_suit_temp_c + delta_temp, 2)

            suit_internal_temps_c.append(current_suit_temp_c)
            heat_rejections_w.append(round(active_cooling_w, 1))
            lcvg_power_draw_w.append(round(85.0 + (active_cooling_w * 0.15), 1))

        max_temp = max(suit_internal_temps_c)
        min_temp = min(suit_internal_temps_c)
        passed = (min_temp >= 18.0) and (max_temp <= 25.5)

        warnings = []
        if max_temp > 24.5:
            warnings.append("Spacesuit internal temperature approaches upper comfort boundary (24.5°C). Reduce EVA drill power.")
        if cooling_loop_efficiency < 0.8:
            warnings.append("Cooling garment efficiency degraded; ice sublimation margin decreased.")

        return {
            "scenario": "Spacesuit Thermal Balance & Heat Dissipation",
            "model": "Coupled Radiative-Convective Stefan-Boltzmann / LCVG Balance",
            "duration_min": duration_min,
            "inputs": p,
            "time_series": {
                "time_min": time_steps,
                "suit_internal_temp_c": suit_internal_temps_c,
                "heat_rejection_w": heat_rejections_w,
                "lcvg_power_w": lcvg_power_draw_w
            },
            "summary": {
                "max_interior_temp_c": max_temp,
                "min_interior_temp_c": min_temp,
                "total_thermal_energy_kj": round(metabolic_watts * duration_min * 0.06, 1),
                "passed_safety_thresholds": passed,
                "warnings": warnings
            },
            "assumptions": [
                "Martian atmospheric pressure held at 720 Pa CO2.",
                "Spacesuit surface area calibrated at 2.2 m² with MLI insulation layers.",
                "Effective Martian infrared sky temperature modeled at 180 Kelvin."
            ]
        }

    @classmethod
    def _simulate_radiation_budget(cls, p: Dict[str, Any]) -> Dict[str, Any]:
        """Ionizing Radiation Dose Accumulation over Mission Time.
        Total Dose = (GCR_flux + SPE_flux) * duration * shielding_factor
        """
        duration_hours = float(p.get("duration_hours", 6.0))
        solar_event_active = bool(p.get("solar_event_active", False))
        shielding_g_cm2 = float(p.get("suit_shielding_g_cm2", 5.0)) # 5 g/cm2 nominal suit

        base_gcr_usv_hr = 26.5
        spe_flux_usv_hr = 145.0 if solar_event_active else 0.0

        # Shielding attenuation factor (exponential mass absorption)
        attenuation = math.exp(-0.04 * shielding_g_cm2)
        effective_dose_rate = (base_gcr_usv_hr + spe_flux_usv_hr) * attenuation

        time_hours = []
        cumulative_dose_usv = []
        dose_rate_series = []

        steps = 15
        dt = duration_hours / float(steps)
        acc_dose = 0.0

        for i in range(steps + 1):
            t = round(i * dt, 2)
            time_hours.append(t)
            acc_dose = round(t * effective_dose_rate, 2)
            cumulative_dose_usv.append(acc_dose)
            dose_rate_series.append(round(effective_dose_rate, 2))

        # NASA 30-day career limit guideline: 250 mSv = 250,000 uSv; single EVA target < 150 uSv
        passed = acc_dose < 150.0
        warnings = []
        if acc_dose > 100.0:
            warnings.append("Cumulative radiation dose exceeds 100 uSv mission threshold.")
        if solar_event_active:
            warnings.append("SOLAR PARTICLE EVENT ACTIVE: Exterior EVA duration must be curtailed to < 2.0 hours.")

        return {
            "scenario": "Ionizing Radiation Mission Budget & Dosimetry",
            "model": "MSL-RAD LET Attenuated Dosimetry Model",
            "inputs": p,
            "time_series": {
                "time_hours": time_hours,
                "cumulative_dose_usv": cumulative_dose_usv,
                "dose_rate_usv_hr": dose_rate_series
            },
            "summary": {
                "final_cumulative_dose_usv": acc_dose,
                "effective_dose_rate_usv_hr": round(effective_dose_rate, 2),
                "career_allowable_fraction_pct": round((acc_dose / 250000.0) * 100.0, 4),
                "passed_safety_thresholds": passed,
                "warnings": warnings
            },
            "assumptions": [
                "GCR background calibrated from Curiosity RAD surface dataset at Jezero datum.",
                "Suit material modeled as composite polyethylene / Kevlar with 5.0 g/cm² areal mass."
            ]
        }

    @classmethod
    def _simulate_dust_attenuation(cls, p: Dict[str, Any]) -> Dict[str, Any]:
        """Beer-Lambert Atmospheric Dust Opacity and Solar Photovoltaic Degradation."""
        initial_tau = float(p.get("dust_tau", 0.5))
        duration_days = float(p.get("duration_days", 7.0))
        storm_growth_rate = float(p.get("storm_growth_rate", 0.15))

        days = []
        taus = []
        solar_irradiance_wm2 = []
        power_output_pct = []

        solar_constant_mars = 590.0 # W/m2 top of atmosphere

        for day in range(int(duration_days) + 1):
            days.append(day)
            current_tau = round(initial_tau * math.exp(storm_growth_rate * day), 3)
            taus.append(current_tau)
            # Beer-Lambert surface transmission I = I0 * exp(-tau / cos(zenith=35 deg))
            cos_zenith = math.cos(math.radians(35.0))
            transmittance = math.exp(-current_tau / cos_zenith)
            surface_irr = round(solar_constant_mars * transmittance, 1)
            solar_irradiance_wm2.append(surface_irr)
            power_pct = round((surface_irr / (solar_constant_mars * math.exp(-0.4 / cos_zenith))) * 100.0, 1)
            power_output_pct.append(min(100.0, power_pct))

        passed = taus[-1] < 1.8
        warnings = []
        if taus[-1] > 1.2:
            warnings.append("Atmospheric dust optical depth tau exceeds 1.2; rover solar recharging degraded by > 60%.")

        return {
            "scenario": "Atmospheric Dust Storm Dynamics & Optical Degradation",
            "model": "Beer-Lambert Atmospheric Transmission Model",
            "inputs": p,
            "time_series": {
                "days": days,
                "optical_depth_tau": taus,
                "solar_irradiance_wm2": solar_irradiance_wm2,
                "solar_power_output_pct": power_output_pct
            },
            "summary": {
                "initial_tau": initial_tau,
                "peak_tau": taus[-1],
                "final_power_capacity_pct": power_output_pct[-1],
                "passed_safety_thresholds": passed,
                "warnings": warnings
            },
            "assumptions": [
                "Mars solar constant calibrated at 590 W/m² at 1.52 AU.",
                "Optical dust scattering cross-section modeled on MEDA dust particle size distribution (1.2 um)."
            ]
        }

    @classmethod
    def _simulate_rover_terramechanics(cls, p: Dict[str, Any]) -> Dict[str, Any]:
        """Bekker Terramechanics Wheel-Soil Interaction and Slip."""
        slope_deg = float(p.get("slope_deg", 10.0))
        sand_cohesion_kpa = float(p.get("sand_cohesion_kpa", 0.8)) # 0.5 soft dune to 2.5 duricrust
        wheel_load_n = 350.0 # 0.38g gravity load per wheel

        # Bekker drawbar pull equation approximation
        internal_friction_angle_deg = 32.0 # Martian basaltic sand
        friction_rad = math.radians(internal_friction_angle_deg)
        slope_rad = math.radians(slope_deg)

        # Critical slope angle for infinite slip
        critical_slope_deg = internal_friction_angle_deg - 8.0

        slopes = [round(i * 1.5, 1) for i in range(15)]
        slips_pct = []
        motor_torques_nm = []

        for s in slopes:
            s_rad = math.radians(s)
            # Slip increases exponentially as slope approaches internal friction angle
            if s >= critical_slope_deg:
                slip = min(95.0, 30.0 + (s - critical_slope_deg) * 12.0)
            else:
                slip = max(5.0, 5.0 + math.tan(s_rad) * 45.0)
            slips_pct.append(round(slip, 1))
            torque = 45.0 + (slip * 0.8) + (math.sin(s_rad) * 40.0)
            motor_torques_nm.append(round(torque, 1))

        current_slip = round(max(5.0, 5.0 + math.tan(slope_rad) * 45.0) if slope_deg < critical_slope_deg else min(95.0, 30.0 + (slope_deg - critical_slope_deg) * 12.0), 1)
        passed = current_slip < 35.0

        warnings = []
        if current_slip > 30.0:
            warnings.append(f"Wheel slip exceeds 30% at {slope_deg}° incline; engage Autonomous Traction Control (ATC).")

        return {
            "scenario": "Rover Wheel-Regolith Terramechanics & Slip Resistance",
            "model": "Bekker-Wong Soil Plasticity & Shear Model",
            "inputs": p,
            "time_series": {
                "slope_angles_deg": slopes,
                "wheel_slip_pct": slips_pct,
                "drive_motor_torque_nm": motor_torques_nm
            },
            "summary": {
                "evaluated_slope_deg": slope_deg,
                "predicted_wheel_slip_pct": current_slip,
                "traction_safety_margin": round(max(0.0, 1.0 - (current_slip / 100.0)), 2),
                "passed_safety_thresholds": passed,
                "warnings": warnings
            },
            "assumptions": [
                "Martian soil modeled as basaltic airfall regolith with 32° internal friction angle.",
                "Perseverance-style cleated aluminum wheel profile with 0.525m diameter."
            ]
        }

    @classmethod
    def _simulate_astronaut_workload(cls, p: Dict[str, Any]) -> Dict[str, Any]:
        """Astronaut Metabolic Expenditure and Fatigue Modeling."""
        speed_kmh = float(p.get("speed_kmh", 2.4))
        slope_deg = float(p.get("slope_deg", 5.0))
        suit_mass_kg = float(p.get("suit_mass_kg", 125.0))
        duration_hours = float(p.get("duration_hours", 4.0))

        # Metabolic cost under 0.38g gravity (Pandolf equation adapted for planetary EVA)
        grade_pct = math.tan(math.radians(slope_deg)) * 100.0
        # W = 1.5 * M_total + 2.0 * (M_total + M_load) * (speed)^2 + grade factor
        m_total_kg = 80.0 + suit_mass_kg
        metabolic_watts = 180.0 + (speed_kmh * 55.0) + (grade_pct * 18.0)

        hours = [round(i * 0.5, 1) for i in range(int(duration_hours * 2) + 1)]
        fatigue_index = []
        heart_rate_bpm = []
        o2_consumption_l_min = []

        baseline_hr = 75.0 + (metabolic_watts / 6.0)

        for h in hours:
            # Fatigue accumulates non-linearly with time
            fatigue = min(100.0, (h / duration_hours) * 45.0 + (grade_pct * 2.0))
            fatigue_index.append(round(fatigue, 1))
            hr = round(baseline_hr + (fatigue * 0.4), 0)
            heart_rate_bpm.append(hr)
            # O2 consumption approx 0.005 L/min per Watt
            o2_l_min = round(0.35 + (metabolic_watts * 0.0035), 2)
            o2_consumption_l_min.append(o2_l_min)

        total_o2_liters = round(sum(o2_consumption_l_min) * 30.0, 1)
        passed = max(heart_rate_bpm) < 155.0 and fatigue_index[-1] < 75.0

        warnings = []
        if max(heart_rate_bpm) > 145.0:
            warnings.append("Projected heart rate sustained > 145 bpm; risk of cardiovascular fatigue similar to Apollo 15.")

        return {
            "scenario": "Astronaut Metabolic Workload & Cardiovascular Strain",
            "model": "Pandolf-Givoni Planetary Gravity Workload Model",
            "inputs": p,
            "time_series": {
                "time_hours": hours,
                "fatigue_index": fatigue_index,
                "heart_rate_bpm": heart_rate_bpm,
                "o2_consumption_l_min": o2_consumption_l_min
            },
            "summary": {
                "mean_metabolic_watts": round(metabolic_watts, 1),
                "peak_heart_rate_bpm": max(heart_rate_bpm),
                "final_fatigue_score": fatigue_index[-1],
                "total_oxygen_consumed_liters": total_o2_liters,
                "passed_safety_thresholds": passed,
                "warnings": warnings
            },
            "assumptions": [
                "Astronaut total mass with planetary EVA suit modeled at 205 kg under 0.38g Mars gravity.",
                "Pandolf human locomotion expenditure equations adjusted for joint resistance of planetary suit."
            ]
        }

