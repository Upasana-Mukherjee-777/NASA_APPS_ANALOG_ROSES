'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity,
  Sliders,
  Play,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  Flame,
  Radio,
  Clock
} from 'lucide-react'
import { runSimulation, compareScenarios } from '@/services/api'

export default function EarthSimulationLabPage() {
  const [scenarioType, setScenarioType] = useState('THERMAL_BALANCE')

  // Thermal Params
  const [ambientTemp, setAmbientTemp] = useState(-45.0)
  const [metabolicWatts, setMetabolicWatts] = useState(320.0)
  const [coolingEff, setCoolingEff] = useState(0.95)
  const [durationMin, setDurationMin] = useState(180)

  // Radiation Params
  const [speActive, setSpeActive] = useState(false)
  const [shielding, setShielding] = useState(5.0)
  const [radHours, setRadHours] = useState(6.0)

  // Dust Params
  const [dustTau, setDustTau] = useState(0.50)
  const [stormGrowth, setStormGrowth] = useState(0.15)
  const [dustDays, setDustDays] = useState(7)

  // Rover Mobility Params
  const [roverSlope, setRoverSlope] = useState(12.0)
  const [sandCohesion, setSandCohesion] = useState(0.8)

  const [loading, setLoading] = useState(false)
  const [simulationResult, setSimulationResult] = useState<any>(null)
  const [compareResult, setCompareResult] = useState<any>(null)
  const [showCompare, setShowCompare] = useState(false)

  useEffect(() => {
    handleRunSimulation()
  }, [scenarioType])

  const handleRunSimulation = async () => {
    setLoading(true)
    let params: any = {}
    if (scenarioType === 'THERMAL_BALANCE') {
      params = { ambient_temp_c: ambientTemp, metabolic_watts: metabolicWatts, cooling_loop_efficiency: coolingEff, duration_min: durationMin }
    } else if (scenarioType === 'RADIATION_BUDGET') {
      params = { duration_hours: radHours, solar_event_active: speActive, suit_shielding_g_cm2: shielding }
    } else if (scenarioType === 'DUST_DEGRADATION') {
      params = { dust_tau: dustTau, duration_days: dustDays, storm_growth_rate: stormGrowth }
    } else if (scenarioType === 'ROVER_MOBILITY') {
      params = { slope_deg: roverSlope, sand_cohesion_kpa: sandCohesion }
    } else if (scenarioType === 'WORKLOAD_FATIGUE') {
      params = { speed_kmh: 2.4, slope_deg: 6.0, duration_hours: 4.0, suit_mass_kg: 125.0 }
    }

    try {
      const res = await runSimulation(scenarioType, params)
      setSimulationResult(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunCompare = async () => {
    setShowCompare(true)
    let pA: any = {}, pB: any = {}
    if (scenarioType === 'THERMAL_BALANCE') {
      pA = { ambient_temp_c: -45.0, metabolic_watts: 250.0, cooling_loop_efficiency: 0.95, duration_min: 180 }
      pB = { ambient_temp_c: -45.0, metabolic_watts: 450.0, cooling_loop_efficiency: 0.80, duration_min: 180 }
    } else if (scenarioType === 'RADIATION_BUDGET') {
      pA = { duration_hours: 6.0, solar_event_active: false, suit_shielding_g_cm2: 5.0 }
      pB = { duration_hours: 6.0, solar_event_active: true, suit_shielding_g_cm2: 5.0 }
    } else {
      pA = { slope_deg: 8.0, sand_cohesion_kpa: 1.2 }
      pB = { slope_deg: 22.0, sand_cohesion_kpa: 0.6 }
    }

    try {
      const cmp = await compareScenarios(scenarioType, pA, pB)
      setCompareResult(cmp)
    } catch (err) {
      console.error(err)
    }
  }

  const downloadReport = () => {
    if (!simulationResult) return
    const blob = new Blob([JSON.stringify(simulationResult, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulation_report_${scenarioType.toLowerCase()}.json`
    a.click()
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 6: VIRTUAL MISSION LAB
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Numerical Physics Simulation</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Earth-Based Martian Experiment Simulation Lab
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test proposed mission procedures and physical scenarios under configurable Martian variables prior to astronaut execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunCompare}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            Compare Scenarios
          </button>
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
          >
            <Download className="h-4 w-4" />
            <span>Export Simulation JSON</span>
          </button>
        </div>
      </div>

      {/* Scenario Type Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
        {[
          { id: 'THERMAL_BALANCE', label: 'Spacesuit Thermodynamics', icon: Flame },
          { id: 'RADIATION_BUDGET', label: 'Radiation Dosimetry', icon: Radio },
          { id: 'DUST_DEGRADATION', label: 'Dust Storm Transmission', icon: Layers },
          { id: 'ROVER_MOBILITY', label: 'Wheel Terramechanics', icon: Activity },
          { id: 'WORKLOAD_FATIGUE', label: 'Metabolic Workload', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => { setScenarioType(tab.id); setShowCompare(false); }}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                scenarioType === tab.id
                  ? 'border-orange-500 bg-orange-950/30 text-orange-400 font-bold'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Grid: Parameters vs Computation Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (1 col): Parameters Sliders */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-orange-400" />
              <span>Configurable Parameters</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">PHYSICS INPUTS</span>
          </div>

          <div className="space-y-4 text-xs">
            {scenarioType === 'THERMAL_BALANCE' && (
              <>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Ambient Martian Air Temp (°C)</span>
                    <span className="font-mono text-orange-400">{ambientTemp}°C</span>
                  </div>
                  <input
                    type="range" min="-85" max="0" step="1"
                    value={ambientTemp} onChange={(e) => setAmbientTemp(parseFloat(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Astronaut Metabolic Heat Rate</span>
                    <span className="font-mono text-orange-400">{metabolicWatts} W</span>
                  </div>
                  <input
                    type="range" min="150" max="500" step="10"
                    value={metabolicWatts} onChange={(e) => setMetabolicWatts(parseFloat(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <span className="text-[10px] text-zinc-500">200W resting walk to 450W heavy drill.</span>
                </div>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Cooling Loop Efficiency</span>
                    <span className="font-mono text-cyan-400">{(coolingEff * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range" min="0.6" max="1.0" step="0.05"
                    value={coolingEff} onChange={(e) => setCoolingEff(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </>
            )}

            {scenarioType === 'RADIATION_BUDGET' && (
              <>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Mission Duration (Hours)</span>
                    <span className="font-mono text-purple-400">{radHours} hrs</span>
                  </div>
                  <input
                    type="range" min="1.0" max="8.0" step="0.5"
                    value={radHours} onChange={(e) => setRadHours(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Suit Shielding Areal Density</span>
                    <span className="font-mono text-zinc-200">{shielding} g/cm²</span>
                  </div>
                  <input
                    type="range" min="2.0" max="10.0" step="0.5"
                    value={shielding} onChange={(e) => setShielding(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={speActive}
                      onChange={(e) => setSpeActive(e.target.checked)}
                      className="rounded border-zinc-700 accent-purple-500"
                    />
                    <span className="font-bold text-red-400">Simulate Solar Particle Event (SPE)</span>
                  </label>
                </div>
              </>
            )}

            {scenarioType === 'ROVER_MOBILITY' && (
              <>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Dune/Slope Incline Angle</span>
                    <span className="font-mono text-zinc-200">{roverSlope}°</span>
                  </div>
                  <input
                    type="range" min="0" max="25" step="1"
                    value={roverSlope} onChange={(e) => setRoverSlope(parseFloat(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-zinc-300 mb-1">
                    <span>Regolith Sand Cohesion</span>
                    <span className="font-mono text-zinc-200">{sandCohesion} kPa</span>
                  </div>
                  <input
                    type="range" min="0.3" max="2.0" step="0.1"
                    value={sandCohesion} onChange={(e) => setSandCohesion(parseFloat(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleRunSimulation}
              disabled={loading}
              className="w-full rounded-xl bg-orange-600 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
            >
              {loading ? "Calculating Numerical Model..." : "Run Physics Simulation"}
            </button>
          </div>
        </div>

        {/* Right (2 cols): Numerical Charts & Outcomes */}
        <div className="lg:col-span-2 space-y-6">
          {simulationResult ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase text-zinc-400">{simulationResult.model}</span>
                  <h3 className="text-lg font-bold text-white">{simulationResult.scenario}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
                  simulationResult.summary.passed_safety_thresholds
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950 text-red-300 border border-red-800'
                }`}>
                  {simulationResult.summary.passed_safety_thresholds ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>PASSED SAFETY THRESHOLDS</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span>THRESHOLD VIOLATION</span>
                    </>
                  )}
                </div>
              </div>

              {/* Warnings List */}
              {simulationResult.summary.warnings && simulationResult.summary.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 space-y-1 text-xs">
                  <h4 className="font-bold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Environmental Safety Advisory:</span>
                  </h4>
                  <ul className="text-zinc-300 list-disc list-inside space-y-0.5">
                    {simulationResult.summary.warnings.map((w: string, idx: number) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Time-Series Data Visualization (Tabular & Visual Bars) */}
              <div className="space-y-3 font-mono text-xs">
                <span className="text-zinc-400 text-[11px] font-sans font-semibold">Simulation Time-Series Output:</span>

                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-800 text-zinc-400">
                      <tr>
                        {Object.keys(simulationResult.time_series).map((k) => (
                          <th key={k} className="p-2 font-mono uppercase text-[10px]">{k.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 text-zinc-300">
                      {simulationResult.time_series[Object.keys(simulationResult.time_series)[0]].slice(0, 10).map((_: any, rowIdx: number) => (
                        <tr key={rowIdx}>
                          {Object.keys(simulationResult.time_series).map((k) => (
                            <td key={k} className="p-2">{simulationResult.time_series[k][rowIdx]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Physics Assumptions */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1 text-xs font-mono">
                <span className="text-zinc-400 text-[10px] uppercase font-bold">Physics Model Assumptions & Limitations:</span>
                <ul className="text-zinc-400 list-disc list-inside space-y-0.5 text-[11px] font-sans">
                  {simulationResult.assumptions?.map((a: string, idx: number) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-12 text-center text-zinc-500 font-mono text-xs">
              Configure parameters and run physics simulation.
            </div>
          )}

          {/* Side-by-Side Comparison Box */}
          {showCompare && compareResult && (
            <div className="rounded-2xl border border-cyan-800/60 bg-cyan-950/10 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <span>Side-by-Side Scenario Comparison</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                  <div className="font-bold text-zinc-200">Scenario A (Baseline)</div>
                  <div className="text-[11px] text-zinc-400">
                    Status: {compareResult.comparison_summary.scenario_a_passed ? "PASSED ✓" : "VIOLATION ✕"}
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                  <div className="font-bold text-orange-400">Scenario B (Stressed)</div>
                  <div className="text-[11px] text-zinc-400">
                    Status: {compareResult.comparison_summary.scenario_b_passed ? "PASSED ✓" : "VIOLATION ✕"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

