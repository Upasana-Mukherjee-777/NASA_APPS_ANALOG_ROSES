'use client'

import React, { useState, useEffect } from 'react'
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
  Clock
} from 'lucide-react'
import { getMissions, getExperiments, createExperiment, approveExperiment, updateExperimentStatus, classifyExperiment } from '@/services/api'

export default function ExperimentManagementPage() {
  const [missionId, setMissionId] = useState('')
  const [experiments, setExperiments] = useState<any[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  // New Experiment Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expClass, setExpClass] = useState('GEOLOGICAL_SAMPLING')
  const [lat, setLat] = useState('18.4210')
  const [lon, setLon] = useState('77.5190')
  const [durationMin, setDurationMin] = useState(45)
  const [slopeDeg, setSlopeDeg] = useState(6.0)
  const [involvesDrilling, setInvolvesDrilling] = useState(true)
  const [involvesToxic, setInvolvesToxic] = useState(false)
  const [livePreviewClassification, setLivePreviewClassification] = useState<any>(null)

  // Approval Modal State
  const [approvingExp, setApprovingExp] = useState<any>(null)
  const [approverName, setApproverName] = useState('Commander Sarah Chen')
  const [approvalNotes, setApprovalNotes] = useState('Pre-drill safety checklist verified; two-way comms ping nominal.')

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

  // Live classify preview when form values change
  useEffect(() => {
    if (showCreateModal) {
      handleLiveClassify()
    }
  }, [expClass, slopeDeg, involvesDrilling, involvesToxic, showCreateModal])

  const handleLiveClassify = async () => {
    try {
      const res = await classifyExperiment({
        experiment_class: expClass,
        name: name || 'Scientific Test',
        slope_deg: slopeDeg,
        involves_drilling: involvesDrilling,
        involves_toxic_chemistry: involvesToxic
      })
      setLivePreviewClassification(res)
    } catch (err) {}
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!missionId) return
    try {
      await createExperiment({
        mission_id: missionId,
        name,
        description,
        experiment_class: expClass,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        planned_duration_minutes: durationMin,
        slope_deg: slopeDeg,
        involves_drilling: involvesDrilling,
        involves_toxic_chemistry: involvesToxic
      })
      setShowCreateModal(false)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApproveConfirm = async () => {
    if (!approvingExp) return
    try {
      await approveExperiment(approvingExp.id, approverName, approvalNotes)
      setApprovingExp(null)
      load()
    } catch (err: any) {
      alert(err.response?.data?.detail || "Approval failed")
    }
  }

  const handleStatusChange = async (expId: string, status: string) => {
    try {
      await updateExperimentStatus(expId, status)
      load()
    } catch (err: any) {
      alert(err.response?.data?.detail || "Status update failed")
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 5: AI EXPERIMENT CLASSIFICATION
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Mandatory Human-in-the-Loop Safeguards</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Experiment Management & Intervention Engine
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Classifies experiments into Classes A, B, C, or D. Non-negotiable Commander approval enforced for Class C and Class D.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-orange-500 transition shadow"
        >
          <Plus className="h-4 w-4" />
          <span>New Experiment</span>
        </button>
      </div>

      {/* 4 Intervention Classes Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-emerald-400">CLASS A</span>
            <span className="text-[10px] text-zinc-500 font-mono">AUTONOMOUS</span>
          </div>
          <h4 className="text-xs font-bold text-zinc-200">Autonomous Execution</h4>
          <p className="text-[11px] text-zinc-400 leading-tight">Routine low-risk robotic operations. No astronaut presence needed.</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-cyan-400">CLASS B</span>
            <span className="text-[10px] text-zinc-500 font-mono">SUPERVISED</span>
          </div>
          <h4 className="text-xs font-bold text-zinc-200">Supervised Execution</h4>
          <p className="text-[11px] text-zinc-400 leading-tight">Automated procedure requiring continuous remote telemetry monitoring.</p>
        </div>

        <div className="rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400">CLASS C</span>
            <span className="text-[10px] text-amber-400 font-mono">APPROVAL REQ</span>
          </div>
          <h4 className="text-xs font-bold text-zinc-200">Human Approval Required</h4>
          <p className="text-[11px] text-zinc-300 leading-tight">Drilling, chemical sampling, or steep slope. Enforces Mission Commander sign-off.</p>
        </div>

        <div className="rounded-xl border border-red-800/60 bg-red-950/20 p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-400">CLASS D</span>
            <span className="text-[10px] text-red-400 font-mono">SAFETY HALT</span>
          </div>
          <h4 className="text-xs font-bold text-zinc-200">Stop and Reassess</h4>
          <p className="text-[11px] text-zinc-300 leading-tight">Safety constraint violation (&gt;20° slope, high radiation). Execution strictly blocked.</p>
        </div>
      </div>

      {/* Experiments List Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Registered Sortie Experiments ({experiments.length})</h3>

        <div className="space-y-4">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4 hover:border-zinc-700 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      exp.intervention_class === 'CLASS_A' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      exp.intervention_class === 'CLASS_B' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      exp.intervention_class === 'CLASS_C' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {exp.intervention_class}
                    </span>
                    <h4 className="text-base font-bold text-white">{exp.name}</h4>
                  </div>
                  <p className="text-xs text-zinc-400">{exp.description}</p>
                </div>

                {/* Status Badges & Action Buttons */}
                <div className="flex items-center gap-3">
                  {exp.requires_human_approval && (
                    <div className="text-xs font-mono">
                      {exp.is_approved ? (
                        <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approved by {exp.approved_by?.split(' ')[0]}</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setApprovingExp(exp)}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-500 transition"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Grant Commander Approval</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {exp.status === 'PLANNED' && (
                      <button
                        onClick={() => handleStatusChange(exp.id, 'IN_PROGRESS')}
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
                      >
                        <Play className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Start</span>
                      </button>
                    )}
                    {exp.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatusChange(exp.id, 'COMPLETED')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Complete</span>
                      </button>
                    )}
                    <span className="font-mono text-xs text-zinc-400 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
                      {exp.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classification Explanation & Precautions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800/80">
                <div className="space-y-1">
                  <span className="font-mono text-zinc-400 text-[10px] uppercase font-bold">AI Rationale:</span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">{exp.classification_explanation}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-zinc-400 text-[10px] uppercase font-bold">Mandatory Precautions:</span>
                  <ul className="text-zinc-400 text-[11px] list-disc list-inside space-y-0.5">
                    {exp.recommended_precautions?.map((p: string, idx: number) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Commander Approval Modal */}
      {approvingExp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Mission Commander Authorization Required</h3>
            </div>

            <div className="space-y-2 text-xs text-zinc-300">
              <p>
                The experiment <strong>&quot;{approvingExp.name}&quot;</strong> has been classified as <strong>CLASS C</strong> due to potential environmental or operational hazard.
              </p>
              <p className="text-zinc-400 text-[11px] font-mono bg-zinc-950 p-2.5 rounded border border-zinc-800">
                AI Rule Engine: {approvingExp.classification_explanation}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Authorizing Official</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Commander Approval Notes & Safeguards Confirmed</label>
                <textarea
                  rows={2}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200 font-mono text-[11px]"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setApprovingExp(null)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="rounded-lg bg-orange-600 px-5 py-2 text-xs font-semibold text-white hover:bg-orange-500"
              >
                Confirm Human Authorization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Create Scientific Sortie Experiment</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Belva Crater Rim Olivine Core Sampling"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Scientific Discipline</label>
                  <select
                    value={expClass}
                    onChange={(e) => setExpClass(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-200"
                  >
                    <option value="GEOLOGICAL_SAMPLING">Geological Sampling (Drilling / Coring)</option>
                    <option value="ATMOSPHERIC_ANALYSIS">Atmospheric Analysis (Spectrometry)</option>
                    <option value="BIOLOGY_ASTROBIOLOGY">Biology / Astrobiology (Raman)</option>
                    <option value="THERMAL_ANALYSIS">Thermal / Subsurface Heat Flow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Incline Slope Angle</label>
                  <input
                    type="number"
                    step="0.5"
                    value={slopeDeg}
                    onChange={(e) => setSlopeDeg(parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={involvesDrilling}
                    onChange={(e) => setInvolvesDrilling(e.target.checked)}
                    className="rounded border-zinc-700 accent-orange-500"
                  />
                  <span>Involves Mechanical Drilling</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={involvesToxic}
                    onChange={(e) => setInvolvesToxic(e.target.checked)}
                    className="rounded border-zinc-700 accent-orange-500"
                  />
                  <span>Toxic Perchlorates Suspected</span>
                </label>
              </div>

              {/* Live Preview Classifier Box */}
              {livePreviewClassification && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">PROJECTED INTERVENTION:</span>
                    <span className="font-bold text-orange-400">{livePreviewClassification.intervention_class}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    {livePreviewClassification.explanation}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-semibold text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-500"
                >
                  Register Experiment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

