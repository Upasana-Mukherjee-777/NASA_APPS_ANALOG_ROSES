'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Plus,
  Play,
  RotateCcw,
  Check,
  Clock,
  Sliders,
  Compass,
  Zap,
  Sparkles,
  Layers,
  FileText,
  ThumbsDown,
  Eye,
  TrendingUp,
  BarChart2
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { getMissions, getExperiments, createExperiment, approveExperiment, updateExperimentStatus, classifyExperiment } from '@/services/api'

// 7 Required Scientific Experiment Templates
const EXPERIMENT_TEMPLATES = [
  {
    id: 'TEMPLATE_1',
    name: 'Geological Sampling (Delta Core Drilling)',
    class: 'GEOLOGICAL_SAMPLING',
    description: 'Rotary-percussive bedrock drilling of smectite clay-bearing delta mudstones for Mars Sample Return caching.',
    slope: 12.0,
    duration: 60,
    involvesDrilling: true,
    involvesToxic: false,
    equipment: ['Rotary Percussive Drill', 'Sample Hermetic Tube Cache', 'SHERLOC Spectrometer'],
    powerWatts: 420,
    o2ReserveReqPct: 35
  },
  {
    id: 'TEMPLATE_2',
    name: 'Regolith Analysis (Grain Size & Cohesion)',
    class: 'REGOLITH_ANALYSIS',
    description: 'Mechanical penetrometer and robotic arm scoop analysis of Jezero basin sand cohesion and shear strength.',
    slope: 5.0,
    duration: 35,
    involvesDrilling: false,
    involvesToxic: false,
    equipment: ['Robotic Arm Scoop', 'Contact Sensor Penetrometer', 'Mastcam-Z Macro'],
    powerWatts: 180,
    o2ReserveReqPct: 20
  },
  {
    id: 'TEMPLATE_3',
    name: 'Dust Behaviour Experiment (Atmospheric Settling)',
    class: 'DUST_BEHAVIOUR',
    description: 'Quantifying diurnal particulate electrostatic deposition rate on solar array test coupons during afternoon winds.',
    slope: 3.5,
    duration: 45,
    involvesDrilling: false,
    involvesToxic: false,
    equipment: ['Optical Depth Sensor', 'Electrometer Dust Collector', 'MEDA Wind Sensor'],
    powerWatts: 95,
    o2ReserveReqPct: 15
  },
  {
    id: 'TEMPLATE_4',
    name: 'Thermal Material Testing (Sublimator Response)',
    class: 'THERMAL_TESTING',
    description: 'High-temperature gradient evaluation of spacesuit outer micrometeorite garment in sub-zero crater shadows.',
    slope: 8.0,
    duration: 50,
    involvesDrilling: false,
    involvesToxic: false,
    equipment: ['Infrared Thermocouple Array', 'LCVG Heat Flux Sensor'],
    powerWatts: 140,
    o2ReserveReqPct: 25
  },
  {
    id: 'TEMPLATE_5',
    name: 'Radiation Exposure Experiment (RAD Dosimetry)',
    class: 'RADIATION_DOSIMETRY',
    description: 'Calibrating silicon semiconductor dosimeter with tissue-equivalent plastic proportional counter beneath delta cliff.',
    slope: 6.0,
    duration: 30,
    involvesDrilling: false,
    involvesToxic: false,
    equipment: ['RAD Telescope', 'CR-39 Passive Track Detectors'],
    powerWatts: 60,
    o2ReserveReqPct: 15
  },
  {
    id: 'TEMPLATE_6',
    name: 'Rover Mobility Experiment (Sand Ripple Traversal)',
    class: 'ROVER_MOBILITY',
    description: 'Autonomous wheel slip compensation and torque vectoring across Séítah high-sinkage basaltic dunes.',
    slope: 16.5,
    duration: 40,
    involvesDrilling: false,
    involvesToxic: false,
    equipment: ['Wheel Odometry IMU', 'LiDAR Terrain Scanner', 'Traction Computer'],
    powerWatts: 380,
    o2ReserveReqPct: 30
  },
  {
    id: 'TEMPLATE_7',
    name: 'Water-Ice Prospecting Scenario (RIMFAX Radar)',
    class: 'WATER_ICE_PROSPECTING',
    description: 'Ground-penetrating radar sounding down to 10m depth to map subsurface dielectric permittivity and putative hydrous layers.',
    slope: 7.5,
    duration: 75,
    involvesDrilling: false,
    involvesToxic: false,
    equipment: ['RIMFAX Ground Penetrating Radar', 'GPS Odometry', 'Deep Sounding Antenna'],
    powerWatts: 260,
    o2ReserveReqPct: 35
  }
]

export default function MartianExperimentLabPage() {
  const [missionId, setMissionId] = useState('')
  const [experiments, setExperiments] = useState<any[]>([])

  // Active Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState('TEMPLATE_1')

  // Configurable Parameters for Experiment
  const [expName, setExpName] = useState('Delta Mudstones Core Drilling')
  const [expClass, setExpClass] = useState('GEOLOGICAL_SAMPLING')
  const [expLat, setExpLat] = useState(18.4210)
  const [expLon, setExpLon] = useState(77.5190)
  const [expDuration, setExpDuration] = useState(60)
  const [expSlope, setExpSlope] = useState(12.0)
  const [involvesDrilling, setInvolvesDrilling] = useState(true)
  const [involvesToxic, setInvolvesToxic] = useState(false)
  const [ambientTemp, setAmbientTemp] = useState(-42.0)
  const [radiationUsv, setRadiationUsv] = useState(26.5)

  // Live AI Intervention Classifier Result
  const [classificationResult, setClassificationResult] = useState<any>(null)
  const [classifying, setClassifying] = useState(false)

  // Experiment Execution Simulation State
  const [activeRunningExp, setActiveRunningExp] = useState<any>(null)
  const [simProgress, setSimProgress] = useState(0)
  const [simTelemetryPoints, setSimTelemetryPoints] = useState<any[]>([])
  const simTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Human Approval Modal State
  const [approvingExp, setApprovingExp] = useState<any>(null)
  const [approverName, setApproverName] = useState('Commander Sarah Chen')
  const [approvalNotes, setApprovalNotes] = useState('Pre-drill safety checklist verified; telemetry link nominal.')
  const [statusNotice, setStatusNotice] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const ms = await getMissions()
      if (ms && ms.length > 0) {
        setMissionId(ms[0].id)
        const exps = await getExperiments(ms[0].id)
        setExperiments(exps || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Live classify when parameters change
  useEffect(() => {
    handleRunClassifier()
  }, [expClass, expSlope, involvesDrilling, involvesToxic, ambientTemp, radiationUsv])

  const handleApplyTemplate = (template: typeof EXPERIMENT_TEMPLATES[0]) => {
    setSelectedTemplateId(template.id)
    setExpName(template.name)
    setExpClass(template.class)
    setExpDuration(template.duration)
    setExpSlope(template.slope)
    setInvolvesDrilling(template.involvesDrilling)
    setInvolvesToxic(template.involvesToxic)
  }

  const handleRunClassifier = async () => {
    setClassifying(true)
    try {
      const res = await classifyExperiment({
        experiment_class: expClass,
        name: expName,
        slope_deg: expSlope,
        temp_c: ambientTemp,
        radiation_usv_hr: radiationUsv,
        involves_toxic_chemistry: involvesToxic,
        involves_drilling: involvesDrilling,
        equipment_condition_score: 95.0,
        astronaut_workload_score: 35.0
      })
      setClassificationResult(res)
    } catch (err) {
      // Local fallback classifier logic
      let iClass = "CLASS_A"
      let requiresHuman = false
      let explanation = "Autonomous execution approved: standard passive monitoring parameters."

      if (expSlope > 18.0) {
        iClass = "CLASS_D"
        requiresHuman = false
        explanation = "STOP AND REASSESS: Slope exceeds 18° limit. Operation prohibited."
      } else if (involvesDrilling || expSlope > 10.0) {
        iClass = "CLASS_C"
        requiresHuman = true
        explanation = "HUMAN APPROVAL REQUIRED: Rotary mechanical drilling on slope introduces slippage risk."
      } else if (expDuration > 60) {
        iClass = "CLASS_B"
        requiresHuman = false
        explanation = "SUPERVISED EXECUTION: Extended timeline requires telemetry watch."
      }

      setClassificationResult({
        intervention_class: iClass,
        requires_human_approval: requiresHuman,
        risk_score: involvesDrilling ? 0.48 : 0.22,
        explanation,
        contributing_factors: [
          `Slope: ${expSlope}°`,
          involvesDrilling ? 'Rotary drilling engaged' : 'Non-invasive contact',
          `Temperature: ${ambientTemp}°C`
        ],
        recommended_precautions: [
          'Verify rover brake locking pins',
          'Maintain 2-way comms telemetry'
        ],
        model_uncertainty: 0.06
      })
    } finally {
      setClassifying(false)
    }
  }

  // Create new experiment in database
  const handleCreateExperiment = async () => {
    if (!missionId) return
    try {
      const resp = await createExperiment({
        mission_id: missionId,
        name: expName,
        description: `Configured via Martian Experiment Lab. Class: ${expClass}.`,
        experiment_class: expClass,
        lat: expLat,
        lon: expLon,
        planned_duration_minutes: expDuration,
        slope_deg: expSlope,
        temp_c: ambientTemp,
        radiation_usv_hr: radiationUsv,
        involves_drilling: involvesDrilling,
        involves_toxic_chemistry: involvesToxic,
        equipment_required: EXPERIMENT_TEMPLATES.find(t => t.id === selectedTemplateId)?.equipment || []
      })
      setStatusNotice(`Experiment '${expName}' registered with status: ${resp.experiment?.intervention_class}`)
      setTimeout(() => setStatusNotice(null), 4000)
      load()
    } catch (e) {
      console.error(e)
    }
  }

  // Human approval workflow
  const handleConfirmApproval = async () => {
    if (!approvingExp) return
    try {
      await approveExperiment(approvingExp.id, approverName, approvalNotes)
      setStatusNotice(`Human approval granted by ${approverName} for '${approvingExp.name}'!`)
      setApprovingExp(null)
      load()
    } catch (e) {
      console.error(e)
    }
  }

  // Reject experiment
  const handleReject = async (expId: string) => {
    try {
      await updateExperimentStatus(expId, 'CANCELLED')
      setStatusNotice('Experiment cancelled by flight safety officer.')
      load()
    } catch (e) {}
  }

  // Simulate experiment execution
  const handleExecuteSimulation = (exp: any) => {
    setActiveRunningExp(exp)
    setSimProgress(0)
    setSimTelemetryPoints([])

    if (simTimerRef.current) clearInterval(simTimerRef.current)
    let p = 0
    const points: any[] = []

    simTimerRef.current = setInterval(() => {
      p += 5
      setSimProgress(p)
      points.push({
        time: `${p}%`,
        drillTorqueNm: Math.round(28 + Math.sin(p * 0.2) * 8 + Math.random() * 4),
        coreRecoveryPct: Math.min(100, Math.round(p * 0.98)),
        tempRiseC: parseFloat((p * 0.12).toFixed(1))
      })
      setSimTelemetryPoints([...points])

      if (p >= 100) {
        if (simTimerRef.current) clearInterval(simTimerRef.current)
        updateExperimentStatus(exp.id, 'COMPLETED').catch(() => {})
        setStatusNotice(`Experiment '${exp.name}' simulation completed successfully! Sample core secured.`)
        load()
      }
    }, 400)
  }

  const intervention = classificationResult?.intervention_class || 'CLASS_A'

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 5: AI EXPERIMENT INTERVENTION & SIMULATION LAB
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Human-in-the-Loop Workflow</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Martian Experiment Lab
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure scientific exploration protocols, execute the 4-tier AI intervention classifier (Class A-D), run live simulations, and authorize human approvals.
          </p>
        </div>

        {statusNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-950/80 border border-emerald-800 px-4 py-2 text-xs text-emerald-300 font-bold animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{statusNotice}</span>
          </div>
        )}
      </div>

      {/* 7 Scientific Experiment Templates Selector */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-orange-400" />
            7 Scientific Experiment Templates
          </span>
          <span className="text-[10px] text-zinc-400">SELECT TEMPLATE TO PRE-POPULATE</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {EXPERIMENT_TEMPLATES.map((tmpl, idx) => {
            const isSelected = tmpl.id === selectedTemplateId
            return (
              <button
                key={tmpl.id}
                onClick={() => handleApplyTemplate(tmpl)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-orange-500 bg-orange-950/30 text-white shadow ring-1 ring-orange-500/50'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <span className="text-[10px] font-bold text-orange-400 block mb-1">0{idx + 1}</span>
                <div className="text-xs font-bold line-clamp-2 leading-tight">{tmpl.name}</div>
                <span className="text-[9px] text-zinc-500 block mt-1">{tmpl.duration} min • {tmpl.slope}°</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Configuration Form & Live AI Classifier (Left 7 cols) + Experiment Registry & Simulation (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Configure & Live Classifier */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-sm font-bold text-white">Configure Scientific Parameters</span>
              <span className="text-xs text-orange-400">{expClass}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Experiment Title:</label>
                <input
                  type="text"
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Duration (Minutes):</label>
                <input
                  type="number"
                  value={expDuration}
                  onChange={(e) => setExpDuration(parseInt(e.target.value) || 30)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-[11px]">Terrain Slope (°):</span>
                  <span className={`font-bold ${expSlope > 18 ? 'text-red-400' : 'text-orange-400'}`}>{expSlope}°</span>
                </div>
                <input
                  type="range" min="0" max="25" step="0.5"
                  value={expSlope}
                  onChange={(e) => setExpSlope(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-[11px]">Radiation Flux (μSv/h):</span>
                  <span className="text-red-400 font-bold">{radiationUsv} μSv/h</span>
                </div>
                <input
                  type="range" min="10" max="150" step="5"
                  value={radiationUsv}
                  onChange={(e) => setRadiationUsv(parseFloat(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer h-1.5 bg-zinc-800 rounded"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesDrilling}
                  onChange={(e) => setInvolvesDrilling(e.target.checked)}
                  className="rounded border-zinc-700 accent-orange-500"
                />
                <span className="text-zinc-300">Involves Rotary Percussive Drilling</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesToxic}
                  onChange={(e) => setInvolvesToxic(e.target.checked)}
                  className="rounded border-zinc-700 accent-orange-500"
                />
                <span className="text-zinc-300">Involves Reagent / Toxic Chemistry</span>
              </label>
            </div>

            {/* AI INTERVENTION CLASSIFIER RESULT BOX (Section 6 Requirement) */}
            {classificationResult && (
              <div className={`rounded-xl border p-4 space-y-3 mt-4 ${
                intervention === 'CLASS_D' ? 'border-red-700 bg-red-950/40 text-red-300' :
                intervention === 'CLASS_C' ? 'border-amber-700 bg-amber-950/40 text-amber-300' :
                intervention === 'CLASS_B' ? 'border-cyan-700 bg-cyan-950/40 text-cyan-300' :
                'border-emerald-700 bg-emerald-950/40 text-emerald-300'
              }`}>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      AI Intervention Classification Result
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-xs font-black bg-black/40 border border-white/20">
                    {intervention}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">
                    {intervention === 'CLASS_A' ? 'A. Autonomous Execution' :
                     intervention === 'CLASS_B' ? 'B. Supervised Execution' :
                     intervention === 'CLASS_C' ? 'C. Human Approval Required' :
                     'D. Stop and Reassess'}
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-300">
                    {classificationResult.explanation}
                  </p>
                </div>

                {/* Influencing factors & Precautions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block font-bold mb-1">INFLUENCING PARAMETERS:</span>
                    {classificationResult.contributing_factors?.map((f: string, i: number) => (
                      <div key={i} className="text-zinc-300">• {f}</div>
                    ))}
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-bold mb-1">RECOMMENDED PRECAUTIONS:</span>
                    {classificationResult.recommended_precautions?.map((p: string, i: number) => (
                      <div key={i} className="text-zinc-300">• {p}</div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-zinc-400">
                  <span>MODEL UNCERTAINTY: ±{(classificationResult.model_uncertainty * 100).toFixed(1)}%</span>
                  <span>HUMAN APPROVAL REQUIRED: {classificationResult.requires_human_approval ? 'YES (MANDATORY)' : 'NO'}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateExperiment}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow-lg mt-2"
            >
              + Register Experiment to Mission Registry
            </button>
          </div>
        </div>

        {/* Right 5 Columns: Experiment Registry & Simulation Execution */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Simulation Runner Box */}
          {activeRunningExp && (
            <div className="rounded-2xl border border-cyan-500/50 bg-cyan-950/30 p-4 space-y-3 font-mono shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 animate-spin" />
                  SIMULATING EXPERIMENT EXECUTION
                </span>
                <span className="text-xs font-bold text-cyan-400">{simProgress}%</span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white">{activeRunningExp.name}</div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${simProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Live Drill Telemetry Chart */}
              <div className="h-28 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simTelemetryPoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={8} />
                    <YAxis stroke="#71717a" fontSize={8} />
                    <Line type="monotone" dataKey="drillTorqueNm" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Torque (Nm)" />
                    <Line type="monotone" dataKey="coreRecoveryPct" stroke="#10b981" strokeWidth={1.5} dot={false} name="Core Recovery (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Registered Experiments List */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs font-bold text-white">
              <span>Mission Experiment Registry ({experiments.length})</span>
              <span className="text-zinc-500 text-[10px]">HUMAN APPROVAL WORKFLOW</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {experiments.length === 0 ? (
                <div className="text-xs text-zinc-500 italic p-4 text-center">
                  No experiments registered yet. Configure and add from left panel.
                </div>
              ) : (
                experiments.map((exp: any) => {
                  const needsApproval = exp.requires_human_approval && !exp.is_approved
                  const isApproved = exp.is_approved

                  return (
                    <div
                      key={exp.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            exp.intervention_class === 'CLASS_C' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                            exp.intervention_class === 'CLASS_D' ? 'bg-red-950 text-red-400 border border-red-800' :
                            'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {exp.intervention_class}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1">{exp.name}</h4>
                        </div>
                        <span className={`text-[10px] font-bold ${
                          exp.status === 'COMPLETED' ? 'text-emerald-400' :
                          exp.status === 'IN_PROGRESS' ? 'text-cyan-400' : 'text-zinc-400'
                        }`}>
                          {exp.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                        <span>Duration: {exp.planned_duration_minutes}m</span>
                        <span>Slope: {exp.slope_deg}°</span>
                        <span>
                          {isApproved ? (
                            <strong className="text-emerald-400 font-normal">✓ Approved ({exp.approved_by?.split(' ')[0]})</strong>
                          ) : needsApproval ? (
                            <strong className="text-amber-400">Approval Required</strong>
                          ) : (
                            <strong className="text-emerald-400 font-normal">Autonomous</strong>
                          )}
                        </span>
                      </div>

                      {/* Action Buttons: Approve, Simulate, Reject */}
                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                        {needsApproval && (
                          <button
                            onClick={() => setApprovingExp(exp)}
                            className="flex-1 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition shadow"
                          >
                            Approve Protocol
                          </button>
                        )}

                        <button
                          onClick={() => handleExecuteSimulation(exp)}
                          disabled={needsApproval}
                          className={`flex-1 py-1 rounded font-bold text-[11px] transition ${
                            needsApproval
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow'
                          }`}
                        >
                          Simulate Run
                        </button>

                        <button
                          onClick={() => handleReject(exp.id)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[11px] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Human Approval Modal (Section 6 Requirement) */}
      {approvingExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-600/60 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-bold border-b border-zinc-800 pb-3">
              <UserCheck className="h-5 w-5" />
              <span>CONFIRM HUMAN-IN-THE-LOOP SAFETY APPROVAL</span>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-zinc-400">Target Protocol:</span>
              <div className="text-white font-bold text-sm">{approvingExp.name}</div>
              <span className="text-amber-400 text-[11px] block mt-1">
                Intervention Level: {approvingExp.intervention_class} (Rotary mechanical drilling on 12° slope)
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-zinc-400">Authorized Approver Name:</label>
              <input
                type="text"
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-white"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-zinc-400">Safety Verification Notes:</label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-white"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmApproval}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
              >
                Confirm & Record Approval in DB
              </button>
              <button
                onClick={() => setApprovingExp(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
