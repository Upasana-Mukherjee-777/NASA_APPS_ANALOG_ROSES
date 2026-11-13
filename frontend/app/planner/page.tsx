'use client'

import React, { useState, useEffect } from 'react'
import {
  Route,
  Compass,
  ShieldAlert,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Save,
  Flame,
  ArrowRight
} from 'lucide-react'
import { getMissions, planRoutes, selectRouteCandidate, getMissionRoutes } from '@/services/api'

export default function MissionPlannerPage() {
  const [missionId, setMissionId] = useState<string>('')
  const [alpha, setAlpha] = useState(0.50) // Risk weight
  const [beta, setBeta] = useState(0.30)  // Comfort weight
  const [gamma, setGamma] = useState(0.20) // Time weight
  const [maxSlope, setMaxSlope] = useState(18.0)
  const [maxDuration, setMaxDuration] = useState(6.0)
  const [maxRadiation, setMaxRadiation] = useState(160.0)

  const [loading, setLoading] = useState(false)
  const [planResult, setPlanResult] = useState<any>(null)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const missions = await getMissions()
        if (missions && missions.length > 0) {
          const m = missions[0]
          setMissionId(m.id)
          // Run initial plan
          handleGeneratePlan(m.id)
        }
      } catch (err) {
        console.error(err)
      }
    }
    init()
  }, [])

  const handleGeneratePlan = async (mId?: string) => {
    const targetMissionId = mId || missionId
    if (!targetMissionId) return
    setLoading(true)
    setActionSuccess(null)
    try {
      const resp = await planRoutes({
        mission_id: targetMissionId,
        start_lat: 18.3800,
        start_lon: 77.5800,
        dest_lat: 18.4200,
        dest_lon: 77.5200,
        alpha,
        beta,
        gamma,
        max_slope_deg: maxSlope,
        max_eva_hours: maxDuration,
        max_radiation_usv: maxRadiation
      })
      setPlanResult(resp.plan)
      setSelectedCandidateId(resp.selected_candidate_id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRoute = async (candidateId: string) => {
    try {
      await selectRouteCandidate(candidateId)
      setSelectedCandidateId(candidateId)
      setActionSuccess("Active route candidate updated and synchronized with Mission EVA-07!")
      setTimeout(() => setActionSuccess(null), 4000)
    } catch (err) {
      console.error(err)
    }
  }

  const candidates = planResult?.candidates || []
  const evac = planResult?.emergency_evacuation_path

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 3: ROUTE OPTIMIZATION
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Multi-Objective Cost J = αR + βC + γT</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Safety-First Martian Route Planner
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Evaluates terrain slopes, active hazards, metabolic fatigue, and hard safety constraints to recommend optimal corridors.
          </p>
        </div>

        <button
          onClick={() => handleGeneratePlan()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
        >
          <Sliders className="h-4 w-4" />
          <span>{loading ? "Optimizing..." : "Recalculate Routes"}</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-xl border border-emerald-700 bg-emerald-950/40 p-4 text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Constraints & Optimization Weights Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
        {/* Cost Function Weights */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-orange-400" />
              <span>Multi-Objective Cost Weights (Total = 1.0)</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              α:{alpha.toFixed(2)} | β:{beta.toFixed(2)} | γ:{gamma.toFixed(2)}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Alpha (α) — Predicted Route Risk Weight</span>
                <span className="font-mono text-orange-400 font-bold">{alpha.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Beta (β) — Workload & Fatigue Discomfort Weight</span>
                <span className="font-mono text-cyan-400 font-bold">{beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Gamma (γ) — Mission Time & Efficiency Weight</span>
                <span className="font-mono text-purple-400 font-bold">{gamma.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.5"
                step="0.05"
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Hard Non-Negotiable Safety Constraints */}
        <div className="space-y-4 md:border-l md:border-zinc-800 md:pl-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span>Hard Non-Negotiable Safety Constraints</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
              STRICT EXCLUSION
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Maximum Permissible Foot Slope</span>
                <span className="font-mono text-zinc-200 font-bold">{maxSlope}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="25"
                step="1"
                value={maxSlope}
                onChange={(e) => setMaxSlope(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
              <span className="text-[10px] text-zinc-500">Apollo 15 lesson: slopes &gt; 18° induce cardiac arrhythmia.</span>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Maximum Allowable EVA Duration</span>
                <span className="font-mono text-zinc-200 font-bold">{maxDuration} hrs</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="8.0"
                step="0.5"
                value={maxDuration}
                onChange={(e) => setMaxDuration(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
              <span className="text-[10px] text-zinc-500">Includes mandatory 25% life-support consumable reserve.</span>
            </div>

            <div>
              <div className="flex justify-between text-zinc-300 mb-1">
                <span>Max Accumulated Radiation Budget</span>
                <span className="font-mono text-zinc-200 font-bold">{maxRadiation} μSv</span>
              </div>
              <input
                type="range"
                min="80"
                max="250"
                step="10"
                value={maxRadiation}
                onChange={(e) => setMaxRadiation(parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Routes Comparison Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Generated Route Candidates</h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {candidates.map((cand: any) => {
            const isRec = cand.is_selected || cand.id === selectedCandidateId
            return (
              <div
                key={cand.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition ${
                  isRec
                    ? 'border-emerald-600 bg-emerald-950/20 shadow-lg glow-cyan'
                    : (cand.hard_constraints_met ? 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700' : 'border-red-900/60 bg-red-950/10 opacity-75')
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        cand.hard_constraints_met
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {cand.hard_constraints_met ? "HARD CONSTRAINTS MET" : "REJECTED BY SAFETY"}
                      </span>
                      <h4 className="text-base font-bold text-white mt-2">{cand.name}</h4>
                    </div>
                    {isRec && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-mono font-bold text-emerald-400 border border-emerald-500/40">
                        PRIMARY
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{cand.description}</p>

                  {/* Quantitative Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
                    <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">TRAVERSE DISTANCE</div>
                      <div className="text-sm font-bold text-zinc-200">{cand.total_distance_km} km</div>
                    </div>
                    <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">ESTIMATED DURATION</div>
                      <div className="text-sm font-bold text-zinc-200">{cand.estimated_duration_hours} hrs</div>
                    </div>
                    <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">RISK RATING (0-100)</div>
                      <div className={`text-sm font-bold ${cand.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {cand.risk_score}
                      </div>
                    </div>
                    <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">COMFORT SCORE</div>
                      <div className="text-sm font-bold text-cyan-400">{cand.comfort_score} / 100</div>
                    </div>
                    <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">MAX SLOPE</div>
                      <div className={`text-sm font-bold ${cand.max_observed_slope_deg > maxSlope ? 'text-red-400' : 'text-zinc-200'}`}>
                        {cand.max_observed_slope_deg}°
                      </div>
                    </div>
                    <div className="rounded-lg bg-zinc-950/80 p-2.5 border border-zinc-800">
                      <div className="text-[10px] text-zinc-500">METABOLIC COST</div>
                      <div className="text-sm font-bold text-zinc-200">{cand.energy_cost_kcal} kcal</div>
                    </div>
                  </div>

                  {/* Explainability Rationale */}
                  <div className="pt-2 text-xs">
                    {cand.selection_rationale && (
                      <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-3 text-emerald-300/90 space-y-1">
                        <strong className="font-semibold block">Selection Rationale:</strong>
                        <p>{cand.selection_rationale}</p>
                      </div>
                    )}
                    {cand.rejection_reason && (
                      <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3 text-red-300/90 space-y-1">
                        <strong className="font-semibold block">Constraint Evaluation:</strong>
                        <p>{cand.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Button */}
                <div className="pt-6">
                  <button
                    onClick={() => handleSelectRoute(cand.id)}
                    disabled={!cand.hard_constraints_met || isRec}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                      isRec
                        ? 'bg-emerald-700/50 text-emerald-200 border border-emerald-600 cursor-default'
                        : (cand.hard_constraints_met
                          ? 'bg-zinc-800 text-white hover:bg-orange-600 border border-zinc-700'
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed')
                    }`}
                  >
                    {isRec ? "✓ Active Selected Route" : (cand.hard_constraints_met ? "Select This Route" : "Violates Safety Constraints")}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Emergency Egress Vector */}
      {evac && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <h4 className="text-base font-bold text-red-200">{evac.name}</h4>
            </div>
            <p className="text-xs text-zinc-300">{evac.description}</p>
            <div className="text-xs font-mono text-red-300 pt-1">
              Direct Distance: {evac.distance_km} km • Estimated Maximum Egress Duration: {evac.duration_hours} hrs
            </div>
          </div>
          <button
            onClick={() => alert("Emergency Evacuation Path engaged. Mission Control notified.")}
            className="flex-shrink-0 rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition"
          >
            Deploy Egress Guidance
          </button>
        </div>
      )}
    </div>
  )
}

