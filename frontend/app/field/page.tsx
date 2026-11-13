'use client'

import React, { useState, useEffect } from 'react'
import {
  UserCheck,
  Activity,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Flame,
  Layers,
  Send,
  FileText,
  ShieldAlert
} from 'lucide-react'
import { getMissions, submitObservation, uploadBatchObservations, getTelemetryStream } from '@/services/api'

export default function AstronautFieldConsolePage() {
  const [missionId, setMissionId] = useState('')
  const [category, setCategory] = useState('TEMPERATURE')
  const [valueNumeric, setValueNumeric] = useState('-42.5')
  const [unit, setUnit] = useState('°C')
  const [lat, setLat] = useState('18.3840')
  const [lon, setLon] = useState('77.5750')
  const [dataSource, setDataSource] = useState('OBSERVED')
  const [notes, setNotes] = useState('Surface regolith temperature at Delta Front base')
  const [isHazardTag, setIsHazardTag] = useState(false)

  const [loading, setLoading] = useState(false)
  const [submissionFeedback, setSubmissionFeedback] = useState<any>(null)
  const [telemetry, setTelemetry] = useState<any>({})

  // CSV Batch Upload State
  const [batchJsonText, setBatchJsonText] = useState('')
  const [batchFeedback, setBatchFeedback] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const ms = await getMissions()
        if (ms && ms.length > 0) setMissionId(ms[0].id)
        const t = await getTelemetryStream()
        setTelemetry(t)
      } catch (e) {}
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!missionId) return
    setLoading(true)
    setSubmissionFeedback(null)
    try {
      const resp = await submitObservation({
        mission_id: missionId,
        category,
        value_numeric: parseFloat(valueNumeric),
        unit,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        data_source: dataSource,
        notes,
        tags: isHazardTag ? ['HAZARD', category] : [category]
      })
      setSubmissionFeedback(resp)
    } catch (err: any) {
      console.error(err)
      setSubmissionFeedback({ status: 'ERROR', message: err.message || 'Failed to submit observation' })
    } finally {
      setLoading(false)
    }
  }

  const handleBatchSubmit = async () => {
    if (!missionId || !batchJsonText.trim()) return
    try {
      const parsed = JSON.parse(batchJsonText)
      const resp = await uploadBatchObservations(missionId, parsed)
      setBatchFeedback(resp)
    } catch (err: any) {
      setBatchFeedback({ status: 'ERROR', message: 'Invalid JSON format: Must be an array of observation objects.' })
    }
  }

  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    if (cat === 'TEMPERATURE') { setValueNumeric('-42.5'); setUnit('°C'); }
    else if (cat === 'RADIATION') { setValueNumeric('48.5'); setUnit('uSv/hr'); }
    else if (cat === 'PRESSURE') { setValueNumeric('718.0'); setUnit('Pa'); }
    else if (cat === 'DUST') { setValueNumeric('1.45'); setUnit('Tau'); }
    else if (cat === 'TERRAIN') { setValueNumeric('19.5'); setUnit('deg slope'); }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 1: ADAPTIVE TELEMETRY INGESTION
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Reactive Event-Driven Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">
            Astronaut Field Console
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log in-situ environmental readings, report terrain anomalies, and trigger real-time route & digital-twin updates.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-mono text-zinc-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Airlock Comms: <strong className="text-white">LINK ACTIVE</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left (2 cols): Manual Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Send className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Submit Astronaut Field Observation</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">Validated Range Check Active</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Category Selector */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Observation Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {['TEMPERATURE', 'RADIATION', 'PRESSURE', 'DUST', 'TERRAIN'].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono font-medium transition ${
                        category === cat
                          ? 'border-orange-500 bg-orange-600/20 text-orange-400'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Sensor Measurement Value</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={valueNumeric}
                    onChange={(e) => setValueNumeric(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                    placeholder="e.g. -42.5"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Engineering Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                    placeholder="°C, uSv/hr, Pa, etc."
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Data Source & Hazard Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Data Provenance</label>
                  <select
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="OBSERVED">OBSERVED (Physical Sensor Measurement)</option>
                    <option value="DERIVED">DERIVED (Calculated / Estimated)</option>
                    <option value="SIMULATED">SIMULATED (Demonstration Scenario)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="hazardCheckbox"
                    checked={isHazardTag}
                    onChange={(e) => setIsHazardTag(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 accent-orange-500"
                  />
                  <label htmlFor="hazardCheckbox" className="text-zinc-300 font-medium cursor-pointer">
                    Flag as Potential Environmental Hazard
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Field Context & Equipment Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 focus:border-orange-500 focus:outline-none"
                  placeholder="Describe location, terrain roughness, visual dust devil, or equipment status..."
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-orange-500 hover:to-amber-500 transition glow-orange"
              >
                {loading ? "Processing Telemetry & Running Anomaly Models..." : "Submit Observation & Trigger Adaptive Intelligence"}
              </button>
            </form>

            {/* Submission Feedback & Adaptive Pipeline Summary */}
            {submissionFeedback && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    {submissionFeedback.anomaly_analysis?.is_anomaly ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    <span className="font-bold text-white">Adaptive Pipeline Response</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    submissionFeedback.anomaly_analysis?.severity === 'CRITICAL' || submissionFeedback.anomaly_analysis?.severity === 'HIGH'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {submissionFeedback.anomaly_analysis?.severity || "NOMINAL"}
                  </span>
                </div>

                <div className="space-y-1.5 text-zinc-300 font-sans text-xs">
                  <p><strong>Anomaly Detection:</strong> {submissionFeedback.anomaly_analysis?.explanation}</p>
                  <p><strong>Expected Range:</strong> {submissionFeedback.anomaly_analysis?.expected_range}</p>
                  <p>
                    <strong>Hazard Created:</strong>{' '}
                    {submissionFeedback.hazard_created ? (
                      <span className="text-red-400 font-bold font-mono">YES — Rerouting Triggered</span>
                    ) : (
                      <span className="text-emerald-400 font-mono">None (Within Safe Envelope)</span>
                    )}
                  </p>
                  <p><strong>Digital Twin State:</strong> Version {submissionFeedback.digital_twin?.twin_version} Synchronized.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right (1 col): Batch Upload & Live Telemetry Stream */}
        <div className="space-y-6">
          {/* Live Stream Panel */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-orange-400 animate-pulse" />
                <h4 className="font-bold text-white">Live Rover Telemetry Stream</h4>
              </div>
              <span className="text-[10px] text-zinc-400">1 Hz</span>
            </div>

            <div className="space-y-2.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-400">Atmospheric Temp:</span>
                <span className="text-zinc-200 font-bold">{telemetry.temperature_c}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Radiation Flux:</span>
                <span className="text-zinc-200 font-bold">{telemetry.radiation_usv_hr} μSv/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Surface Pressure:</span>
                <span className="text-zinc-200 font-bold">{telemetry.pressure_pa} Pa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Dust Optical Tau:</span>
                <span className="text-zinc-200 font-bold">{telemetry.dust_tau}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Suit LCVG Coolant:</span>
                <span className="text-emerald-400 font-bold">19.8°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Suit O2 Delivery:</span>
                <span className="text-emerald-400 font-bold">0.42 L/min</span>
              </div>
            </div>
          </div>

          {/* Batch JSON / CSV Upload Panel */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Batch Telemetry Upload</h4>
            </div>

            <p className="text-xs text-zinc-400">
              Paste JSON array of sensor readings or telemetry logs for batch ingestion:
            </p>

            <textarea
              rows={4}
              value={batchJsonText}
              onChange={(e) => setBatchJsonText(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 focus:border-cyan-500 focus:outline-none"
              placeholder={`[\n  {\n    "category": "TEMPERATURE",\n    "value_numeric": -45.0,\n    "unit": "°C",\n    "lat": 18.384,\n    "lon": 77.575\n  }\n]`}
            ></textarea>

            <button
              onClick={handleBatchSubmit}
              className="w-full rounded-lg bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              Upload Batch Telemetry
            </button>

            {batchFeedback && (
              <div className="text-xs font-mono p-3 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                {batchFeedback.status === 'SUCCESS' ? (
                  <span className="text-emerald-400">
                    ✓ Imported {batchFeedback.records_imported} observation(s) • Detected {batchFeedback.anomalies_detected} anomalies.
                  </span>
                ) : (
                  <span className="text-red-400">{batchFeedback.message}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
