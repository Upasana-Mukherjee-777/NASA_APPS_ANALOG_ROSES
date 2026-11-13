import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Missions
export const getMissions = async () => (await api.get('/missions')).data
export const getMissionDetail = async (id: string) => (await api.get(`/missions/${id}`)).data
export const updateMissionStatus = async (id: string, status: string, notes?: string) =>
  (await api.patch(`/missions/${id}/status`, { status, notes })).data

// Observations & Telemetry
export const getObservations = async (missionId?: string, category?: string) =>
  (await api.get('/observations', { params: { mission_id: missionId, category } })).data
export const submitObservation = async (data: any) =>
  (await api.post('/observations', data)).data
export const uploadBatchObservations = async (missionId: string, observations: any[]) =>
  (await api.post('/observations/batch', { mission_id: missionId, observations })).data
export const getTelemetryStream = async () => (await api.get('/observations/stream')).data

// Routes
export const planRoutes = async (params: any) =>
  (await api.post('/routes/plan', params)).data
export const getMissionRoutes = async (missionId: string) =>
  (await api.get(`/routes/${missionId}`)).data
export const selectRouteCandidate = async (candidateId: string) =>
  (await api.post(`/routes/${candidateId}/select`)).data

// Experiments
export const getExperiments = async (missionId?: string) =>
  (await api.get('/experiments', { params: { mission_id: missionId } })).data
export const createExperiment = async (data: any) =>
  (await api.post('/experiments', data)).data
export const classifyExperiment = async (data: any) =>
  (await api.post('/experiments/classify', data)).data
export const approveExperiment = async (id: string, approverName: string, notes?: string) =>
  (await api.post(`/experiments/${id}/approve`, { approver_name: approverName, approval_notes: notes })).data
export const updateExperimentStatus = async (id: string, status: string) =>
  (await api.patch(`/experiments/${id}/status`, null, { params: { status } })).data

// Geospatial
export const getNASALayers = async () => (await api.get('/geospatial/layers')).data
export const getJezeroLandmarks = async () => (await api.get('/geospatial/landmarks')).data
export const getElevation = async (lat: number, lon: number) =>
  (await api.get('/geospatial/elevation', { params: { lat, lon } })).data

// Historical RAG
export const getHistoricalIncidents = async () => (await api.get('/history/incidents')).data
export const searchHistoricalIncidents = async (query: string, topK: number = 4) =>
  (await api.post('/history/search', { query, top_k: topK })).data

// Simulation Lab
export const runSimulation = async (scenarioType: string, parameters: any) =>
  (await api.post('/simulation/run', { scenario_type: scenarioType, parameters })).data
export const compareScenarios = async (scenarioType: string, scenarioA: any, scenarioB: any) =>
  (await api.post('/simulation/compare', { scenario_type: scenarioType, scenario_a: scenarioA, scenario_b: scenarioB })).data

// Digital Twin
export const getDigitalTwinState = async () => (await api.get('/digital-twin/state')).data
export const getTerrainGrid = async (gridSize: number = 25) =>
  (await api.get('/digital-twin/terrain-grid', { params: { grid_size: gridSize } })).data
export const getMissionTimeline = async () => (await api.get('/digital-twin/timeline')).data
export const replayTimelineStep = async (stepNumber: number) =>
  (await api.post('/digital-twin/replay-step', { step_number: stepNumber })).data

// ML Models
export const classifyTerrain = async (data: any) =>
  (await api.post('/ml/terrain-classify', data)).data
export const predictRisk = async (data: any) =>
  (await api.post('/ml/risk-predict', data)).data
export const getMLMetrics = async () => (await api.get('/ml/metrics')).data

// Reports
export const getMissionReport = async (missionId: string) =>
  (await api.get(`/reports/mission/${missionId}`)).data
export const getSystemHealth = async () => (await api.get('/health')).data

