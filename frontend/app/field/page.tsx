'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  UserCheck,
  Activity,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Send,
  FileText,
  RefreshCw,
  Thermometer,
  Wind,
  Zap,
  Eye,
  Clock,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  getMissions,
  submitObservation,
  uploadBatchObservations,
  getTelemetryState,
  tickTelemetry,
} from '@/services/api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface TelemetryPoint {
  tick: number
  temp: number
  radiation: number
  pressure: number
  dust: number
  o2: number
  battery: number
  risk: number
  ts: string
}

const CATEGORIES = ['TEMPERATURE', 'RADIATION', 'PRESSURE', 'DUST', 'TERRAIN', 'EQUIPMENT']
const CAT_DEFAULTS: Record<string, { value: string; unit: string }> = {
  TEMPERATURE: { value: '-42.5', unit: '°C' },
  RADIATION: { value: '48.5', unit: 'μSv/h' },
  PRESSURE: { value: '718.0', unit: 'Pa' },
  DUST: { value: '1.45', unit: 'Tau' },
  TERRAIN: { value: '12.5', unit: '° slope' },
  EQUIPMENT: { value: '94.0', unit: '%' },
}

const SAFE_LIMITS: Record<string, { min?: number; max: number; label: string }> = {
  RADIATION: { max: 160, label: '160 μSv/h hard limit' },
  TEMPERATURE: { min: -100, max: 20, label: '< 20°C surface safe' },
  TERRAIN: { max: 18, label: '18° slope hard limit' },
  PRESSURE: { max: 1200, label: '< 1200 Pa range' },
}

function getTrend(val: number, prev: number) {
  if (val > prev + 0.1) return <TrendingUp className="h-3 w-3 text-red-400" />
  if (val < prev - 0.1) return <TrendingDown className="h-3 w-3 text-emerald-400" />
  return <Minus className="h-3 w-3 text-zinc-500" />
}

const CSV_TEMPLATE = `[
  {
    "category": "TEMPERATURE",
    "value_numeric": -42.5,
    "unit": "°C",
    "lat": 18.384,
    "lon": 77.575,
    "data_source": "OBSERVED",
    "notes": "Surface temperature near delta front"
  },
  {
    "category": "RADIATION",
    "value_numeric": 48.5,
    "unit": "μSv/h",
    "lat": 18.390,
    "lon": 77.580,
    "data_source": "OBSERVED",
    "notes": "Particle radiation at waypoint 3"
  }
]`

// ─── Component ────────────────────────────────────────────────────────────────
export default function AstronautFieldConsolePage() {
  const [missionId, setMissionId] = useState('')
  const [category, setCategory] = useState('TEMPERATURE')
  const [valueNumeric, setValueNumeric] = useState('-42.5')
  const [unit, setUnit] = useState('°C')
  const [lat, setLat] = useState('18.3840')
  const [lon, setLon] = useState('77.5750')
  const [dataSource, setDataSource] = useState('OBSERVED')
  const [notes, setNotes] = useState('Surface regolith temperature at Delta Front base camp')
  const [isHazardTag, setIsHazardTag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submissionFeedback, setSubmissionFeedback] = useState<any>(null)
  const [batchJsonText, setBatchJsonText] = useState('')
  const [batchFeedback, setBatchFeedback] = useState<any>(null)

  // Live telemetry history
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([])
  const [latestTelemetry, setLatestTelemetry] = useState<any>(null)
  const [prevTelemetry, setPrevTelemetry] = useState<any>(null)
  const [connected, setConnected] = useState(false)
  const [tickCount, setTickCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Observation log (local session)
  const [obsLog, setObsLog] = useState<any[]>([])

  // ── Boot: load mission + seed telemetry ──
  useEffect(() => {
    const boot = async () => {
      try {
        const ms = await getMissions()
        if (ms?.length > 0) setMissionId(ms[0].id)
      } catch {}
      // Prime with first tick
      try {
        const t = await tickTelemetry()
        setLatestTelemetry(t)
        addHistory(t, 0)
        setConnected(true)
      } catch {
        // offline — use local simulation
        const local = localTick(0)
        setLatestTelemetry(local)
        addHistory(local, 0)
      }
    }
    boot()
  }, []) // eslint-disable-line

  // ── Polling loop ──
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const t = await tickTelemetry()
        setPrevTelemetry(latestTelemetry)
        setLatestTelemetry(t)
        setTickCount(c => c + 1)
        addHistory(t, tickCount + 1)
        setConnected(true)
      } catch {
        const local = localTick(tickCount + 1)
        setPrevTelemetry(latestTelemetry)
        setLatestTelemetry(local)
        setTickCount(c => c + 1)
        addHistory(local, tickCount + 1)
        setConnected(false)
      }
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tickCount, latestTelemetry]) // eslint-disable-line

  const addHistory = useCallback((t: any, tick: number) => {
    const pt: TelemetryPoint = {
      tick,
      temp: +(t.temperature_c ?? t.temp ?? 0).toFixed(1),
      radiation: +(t.radiation_usv_hr ?? t.radiation ?? 0).toFixed(1),
      pressure: +(t.pressure_pa ?? t.pressure ?? 0).toFixed(0),
      dust: +(t.dust_tau ?? t.dust ?? 0).toFixed(2),
      o2: +(t.o2_pct ?? t.o2 ?? 0).toFixed(1),
      battery: +(t.battery_pct ?? t.battery ?? 0).toFixed(1),
      risk: +(t.risk_score ?? t.risk ?? 0).toFixed(3),
      ts: new Date().toLocaleTimeString(),
    }
    setTelemetryHistory(prev => [...prev.slice(-49), pt])
  }, [])

  // Local simulation fallback
  const localTick = (tick: number) => {
    const base = -44 + Math.sin(tick * 0.1) * 3
    return {
      temperature_c: base,
      radiation_usv_hr: 48 + Math.sin(tick * 0.2) * 8,
      pressure_pa: 718 + Math.cos(tick * 0.15) * 12,
      dust_tau: 1.45 + Math.sin(tick * 0.08) * 0.4,
      o2_pct: 95 - tick * 0.05,
      battery_pct: 98 - tick * 0.08,
      risk_score: 0.2 + Math.sin(tick * 0.12) * 0.05,
    }
  }

  // ── Category switch ──
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    const def = CAT_DEFAULTS[cat]
    setValueNumeric(def.value)
    setUnit(def.unit)
  }

  // ── Observation submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!missionId) return
    setLoading(true)
    setSubmissionFeedback(null)
    const val = parseFloat(valueNumeric)
    // Client-side range check
    const limit = SAFE_LIMITS[category]
    let clientWarning: string | null = null
    if (limit) {
      if (category === 'RADIATION' && val > limit.max) clientWarning = `⚠ HARD LIMIT BREACH: Radiation ${val} μSv/h exceeds ${limit.max} μSv/h.`
      if (category === 'TERRAIN' && val > limit.max) clientWarning = `⚠ HARD LIMIT BREACH: Slope ${val}° exceeds ${limit.max}° safe threshold.`
    }
    try {
      const resp = await submitObservation({
        mission_id: missionId,
        category,
        value_numeric: val,
        unit,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        data_source: dataSource,
        notes,
        tags: isHazardTag ? ['HAZARD', category] : [category],
      })
      const feedback = { ...resp, clientWarning }
      setSubmissionFeedback(feedback)
      setObsLog(prev => [{ ...feedback, category, value: val, unit, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)])
    } catch (err: any) {
      setSubmissionFeedback({ status: 'ERROR', message: err.message || 'Failed to submit observation', clientWarning })
    } finally {
      setLoading(false)
    }
  }

  // ── Batch submit ──
  const handleBatchSubmit = async () => {
    if (!missionId || !batchJsonText.trim()) return
    try {
      const parsed = JSON.parse(batchJsonText)
      const resp = await uploadBatchObservations(missionId, parsed)
      setBatchFeedback(resp)
    } catch {
      setBatchFeedback({ status: 'ERROR', message: 'Invalid JSON — must be an array of observation objects.' })
    }
  }

  // ── Template download ──
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'marsguard_batch_template.json'
    a.click()
  }

  const lat_t = latestTelemetry
  const riskPct = lat_t ? Math.round((lat_t.risk_score ?? 0) * 100) : 0
  const riskColor = riskPct > 60 ? 'text-red-400' : riskPct > 35 ? 'text-amber-400' : 'text-emerald-400'

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-orange-400 font-semibold">
              MODULE 1: ADAPTIVE TELEMETRY INGESTION
            </span>
            <span className="text-xs text-zinc-400 font-mono">• Reactive Event-Driven Pipeline</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-1">Astronaut Field Console</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log in-situ environmental readings, report terrain anomalies, and trigger real-time route &amp; digital-twin updates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-mono ${
            connected ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300' : 'border-zinc-700 bg-zinc-900 text-zinc-400'
          }`}>
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>Airlock Comms: <strong className="text-white">{connected ? 'LINK ACTIVE' : 'OFFLINE SIM'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-mono text-zinc-400">
            <Clock className="h-3 w-3" />
            <span>Tick #{tickCount}</span>
          </div>
        </div>
      </div>

      {/* ── Live telemetry ticker strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: 'TEMP', val: lat_t?.temperature_c?.toFixed(1), unit: '°C', icon: <Thermometer className="h-3 w-3 text-orange-400" />, key: 'temperature_c', warn: lat_t?.temperature_c > 20 },
          { label: 'RADIATION', val: lat_t?.radiation_usv_hr?.toFixed(1), unit: 'μSv/h', icon: <Zap className="h-3 w-3 text-yellow-400" />, key: 'radiation_usv_hr', warn: lat_t?.radiation_usv_hr > 160 },
          { label: 'PRESSURE', val: lat_t?.pressure_pa?.toFixed(0), unit: 'Pa', icon: <Wind className="h-3 w-3 text-cyan-400" />, key: 'pressure_pa', warn: false },
          { label: 'DUST τ', val: lat_t?.dust_tau?.toFixed(2), unit: 'Tau', icon: <Eye className="h-3 w-3 text-amber-400" />, key: 'dust_tau', warn: lat_t?.dust_tau > 2.5 },
          { label: 'O₂', val: lat_t?.o2_pct?.toFixed(1), unit: '%', icon: <Activity className="h-3 w-3 text-emerald-400" />, key: 'o2_pct', warn: lat_t?.o2_pct < 80 },
          { label: 'BATTERY', val: lat_t?.battery_pct?.toFixed(1), unit: '%', icon: <Radio className="h-3 w-3 text-blue-400" />, key: 'battery_pct', warn: lat_t?.battery_pct < 20 },
          { label: 'RISK', val: riskPct, unit: '%', icon: <AlertTriangle className={`h-3 w-3 ${riskColor}`} />, key: 'risk_score', warn: riskPct > 60 },
        ].map(item => (
          <div
            key={item.label}
            className={`rounded-xl border p-3 space-y-1 ${
              item.warn
                ? 'border-red-800 bg-red-950/30'
                : 'border-zinc-800 bg-zinc-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">{item.icon}{item.label}</div>
              {prevTelemetry && lat_t && getTrend(lat_t[item.key] ?? 0, prevTelemetry[item.key] ?? 0)}
            </div>
            <div className={`text-lg font-bold font-mono ${item.warn ? 'text-red-300' : 'text-white'}`}>
              {item.val ?? '—'}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono">{item.unit}</div>
          </div>
        ))}
      </div>

      {/* ── Telemetry Stream Chart ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white">Live Telemetry Stream — Last 50 Readings</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-zinc-400">Auto-refresh 3 s</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Temperature & Radiation */}
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-2">Temperature (°C) &amp; Radiation (μSv/h)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="ts" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={160} stroke="#f87171" strokeDasharray="4 2" label={{ value: 'RAD LIMIT', fontSize: 8, fill: '#f87171' }} yAxisId={0} />
                <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={1.5} dot={false} name="Temp °C" />
                <Line type="monotone" dataKey="radiation" stroke="#facc15" strokeWidth={1.5} dot={false} name="Rad μSv/h" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: O2 & Battery */}
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-2">O₂ &amp; Battery (%)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="ts" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={20} stroke="#f87171" strokeDasharray="4 2" label={{ value: 'LOW', fontSize: 8, fill: '#f87171' }} />
                <Line type="monotone" dataKey="o2" stroke="#34d399" strokeWidth={1.5} dot={false} name="O₂ %" />
                <Line type="monotone" dataKey="battery" stroke="#60a5fa" strokeWidth={1.5} dot={false} name="Battery %" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Risk Score */}
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-2">Mission Risk Score (0–1)</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="ts" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <ReferenceLine y={0.6} stroke="#f87171" strokeDasharray="4 2" label={{ value: 'HIGH RISK', fontSize: 8, fill: '#f87171' }} />
                <Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={1.5} dot={false} name="Risk" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Dust & Pressure */}
          <div>
            <p className="text-xs font-mono text-zinc-500 mb-2">Dust Optical Depth (Tau) &amp; Pressure (Pa)</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={telemetryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="ts" tick={{ fontSize: 9, fill: '#71717a' }} tickLine={false} />
                <YAxis yAxisId="dust" domain={[0, 5]} tick={{ fontSize: 9, fill: '#a78bfa' }} tickLine={false} width={28} />
                <YAxis yAxisId="pres" orientation="right" tick={{ fontSize: 9, fill: '#67e8f9' }} tickLine={false} width={38} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontSize: 10 }}
                  labelStyle={{ color: '#a1a1aa' }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line yAxisId="dust" type="monotone" dataKey="dust" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Dust τ" />
                <Line yAxisId="pres" type="monotone" dataKey="pressure" stroke="#67e8f9" strokeWidth={1.5} dot={false} name="Pressure Pa" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Main 2-col: form + right panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left 2-col: Observation Form ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Send className="h-5 w-5 text-orange-400" />
                <h3 className="text-base font-bold text-white">Submit Astronaut Field Observation</h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">Range-validated • Anomaly-scored • Twin-synced</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* Category */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Observation Category</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`py-2 px-2 rounded-lg border text-[11px] font-mono font-medium transition ${
                        category === cat
                          ? 'border-orange-500 bg-orange-600/20 text-orange-400'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {cat.substring(0, 6)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value + unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Sensor Measurement Value</label>
                  <input
                    type="number" step="any" required value={valueNumeric}
                    onChange={(e) => setValueNumeric(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                    placeholder="e.g. -42.5"
                  />
                  {/* Inline threshold indicator */}
                  {SAFE_LIMITS[category] && (
                    <div className={`mt-1 text-[10px] font-mono ${
                      parseFloat(valueNumeric) > SAFE_LIMITS[category].max ? 'text-red-400' : 'text-zinc-500'
                    }`}>
                      {SAFE_LIMITS[category].label}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Engineering Unit</label>
                  <input
                    type="text" required value={unit} onChange={(e) => setUnit(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none"
                    placeholder="°C, μSv/h, Pa…"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Latitude (°N — Jezero Crater)</label>
                  <input type="number" step="0.0001" required value={lat} onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Longitude (°E)</label>
                  <input type="number" step="0.0001" required value={lon} onChange={(e) => setLon(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none" />
                </div>
              </div>

              {/* Provenance + hazard tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1.5">Data Provenance</label>
                  <select value={dataSource} onChange={(e) => setDataSource(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 font-mono text-zinc-100 focus:border-orange-500 focus:outline-none">
                    <option value="OBSERVED">OBSERVED (Physical Sensor Measurement)</option>
                    <option value="DERIVED">DERIVED (Calculated / Estimated)</option>
                    <option value="SIMULATED">SIMULATED (Demonstration Scenario)</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <input type="checkbox" id="hazardCheckbox" checked={isHazardTag} onChange={(e) => setIsHazardTag(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 accent-orange-500" />
                  <label htmlFor="hazardCheckbox" className="text-zinc-300 font-medium cursor-pointer">
                    Flag as Potential Environmental Hazard
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5">Field Context &amp; Equipment Notes</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 focus:border-orange-500 focus:outline-none"
                  placeholder="Terrain roughness, visual dust devil, equipment status…" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-orange-500 hover:to-amber-500 transition">
                {loading ? 'Processing Telemetry & Running Anomaly Models…' : 'Submit Observation & Trigger Adaptive Intelligence'}
              </button>
            </form>

            {/* ── Submission feedback ── */}
            {submissionFeedback && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    {submissionFeedback.anomaly_analysis?.is_anomaly
                      ? <AlertTriangle className="h-4 w-4 text-amber-400" />
                      : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    <span className="font-bold text-white">Adaptive Pipeline Response</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    submissionFeedback.anomaly_analysis?.severity === 'CRITICAL' || submissionFeedback.anomaly_analysis?.severity === 'HIGH'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {submissionFeedback.anomaly_analysis?.severity || 'NOMINAL'}
                  </span>
                </div>
                {submissionFeedback.clientWarning && (
                  <div className="rounded-lg border border-red-800 bg-red-950/40 p-2 text-red-300 text-[11px]">
                    {submissionFeedback.clientWarning}
                  </div>
                )}
                <div className="space-y-1.5 text-zinc-300 font-sans text-xs">
                  <p><strong>Anomaly Detection:</strong> {submissionFeedback.anomaly_analysis?.explanation}</p>
                  <p><strong>Expected Range:</strong> {submissionFeedback.anomaly_analysis?.expected_range}</p>
                  <p>
                    <strong>Hazard Created:</strong>{' '}
                    {submissionFeedback.hazard_created
                      ? <span className="text-red-400 font-bold font-mono">YES — Rerouting Triggered</span>
                      : <span className="text-emerald-400 font-mono">None (Within Safe Envelope)</span>}
                  </p>
                  <p><strong>Digital Twin:</strong> Version {submissionFeedback.digital_twin?.twin_version} Synchronized.</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Session Observation Log ── */}
          {obsLog.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white">Session Observation Log</h3>
                </div>
                <button onClick={() => setObsLog([])} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition">
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="space-y-1.5">
                {obsLog.map((o, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">{o.ts}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        o.anomaly_analysis?.is_anomaly ? 'bg-amber-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                      }`}>{o.category}</span>
                      <span className="text-zinc-200 font-bold">{o.value} {o.unit}</span>
                    </div>
                    <span className={`text-[10px] ${o.anomaly_analysis?.is_anomaly ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {o.anomaly_analysis?.severity || 'NOMINAL'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Batch Upload + Stats ── */}
        <div className="space-y-6">
          {/* Batch Upload Panel */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Batch Telemetry Upload</h4>
              </div>
              <button onClick={downloadTemplate}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-cyan-400 transition">
                <Download className="h-3 w-3" /> Template
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Paste JSON array of sensor readings for batch ingestion. Download the template for field format reference.
            </p>

            <textarea
              rows={6}
              value={batchJsonText}
              onChange={(e) => setBatchJsonText(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 focus:border-cyan-500 focus:outline-none"
              placeholder={`[\n  {\n    "category": "TEMPERATURE",\n    "value_numeric": -45.0,\n    "unit": "°C",\n    "lat": 18.384,\n    "lon": 77.575\n  }\n]`}
            />

            <button onClick={handleBatchSubmit}
              className="w-full rounded-lg bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition">
              <Plus className="h-3.5 w-3.5 inline mr-1" />
              Upload Batch Telemetry
            </button>

            {batchFeedback && (
              <div className="text-xs font-mono p-3 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                {batchFeedback.status === 'SUCCESS' ? (
                  <span className="text-emerald-400">
                    ✓ Imported {batchFeedback.records_imported} record(s) • {batchFeedback.anomalies_detected} anomalies detected.
                  </span>
                ) : (
                  <span className="text-red-400">{batchFeedback.message}</span>
                )}
              </div>
            )}
          </div>

          {/* Quick-reference limits card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Hard Safety Thresholds
            </h4>
            <p className="text-[10px] text-zinc-500 font-mono">These constraints cannot be overridden by AI or user action.</p>
            <div className="space-y-2 font-mono text-xs">
              {[
                { label: 'Radiation', limit: '≤ 160 μSv/h', color: 'text-yellow-400' },
                { label: 'Terrain Slope', limit: '≤ 18°', color: 'text-orange-400' },
                { label: 'Surface Temp', limit: '< +20°C', color: 'text-cyan-400' },
                { label: 'O₂ Level', limit: '≥ 70%', color: 'text-emerald-400' },
                { label: 'Battery', limit: '≥ 15% return reserve', color: 'text-blue-400' },
              ].map(t => (
                <div key={t.label} className="flex justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-zinc-400">{t.label}</span>
                  <span className={`font-bold ${t.color}`}>{t.limit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connection status detail */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-zinc-400" />
              <h4 className="font-bold text-white">Pipeline Status</h4>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Telemetry Source</span>
                <span className={connected ? 'text-emerald-400' : 'text-amber-400'}>
                  {connected ? 'Backend Engine' : 'Local Sim Fallback'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Poll Rate</span>
                <span className="text-zinc-300">3 s / tick</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">History Buffer</span>
                <span className="text-zinc-300">{telemetryHistory.length} / 50 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Anomaly Engine</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Digital Twin Sync</span>
                <span className="text-emerald-400">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
