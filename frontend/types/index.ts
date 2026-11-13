// ============================================================
// MARS-GUARD — Complete TypeScript Type Definitions
// ============================================================

// ── Enums ───────────────────────────────────────────────────

export type UserRole = 'COMMANDER' | 'ASTRONAUT' | 'RESEARCHER' | 'ADMIN'

export type MissionStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ABORTED'
  | 'EMERGENCY'

export type ObservationType = 'POINT' | 'AREA' | 'PATH'

export type ObservationCategory =
  | 'TEMPERATURE'
  | 'PRESSURE'
  | 'RADIATION'
  | 'TERRAIN'
  | 'DUST'
  | 'GEOLOGICAL'
  | 'ATMOSPHERIC'
  | 'BIOLOGICAL'
  | 'MECHANICAL'
  | 'VISUAL'
  | 'SEISMIC'

export type DataSource = 'OBSERVED' | 'DERIVED' | 'SIMULATED'

export type HazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type ExperimentClass =
  | 'GEOLOGICAL_SAMPLING'
  | 'ATMOSPHERIC_ANALYSIS'
  | 'BIOLOGY_ASTROBIOLOGY'
  | 'PHYSICS_MEASUREMENT'
  | 'ENGINEERING_TEST'
  | 'IMAGING_SURVEY'
  | 'THERMAL_ANALYSIS'
  | 'SEISMIC_MONITORING'

export type DataLayerStatus = 'ACTIVE' | 'LOADING' | 'ERROR' | 'HIDDEN'

// ── Core Entities ────────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Role {
  name: UserRole
  permissions: string[]
  description: string
}

export interface GeoPoint {
  lat: number
  lon: number
  elevation_m?: number
}

export interface GeoPolygon {
  coordinates: [number, number][]
  area_m2?: number
}

// ── Mission ──────────────────────────────────────────────────

export interface Mission {
  id: string
  name: string
  description: string
  status: MissionStatus
  commander_id: string
  commander_name?: string
  start_location: GeoPoint
  destination: GeoPoint
  planned_start_time: string
  planned_duration_hours: number
  actual_start_time?: string
  actual_end_time?: string
  crew_ids: string[]
  route_id?: string
  active_route_candidate_id?: string
  risk_level: HazardSeverity
  created_at: string
  updated_at: string
  tags: string[]
  notes?: string
}

// ── Observation ──────────────────────────────────────────────

export interface Observation {
  id: string
  mission_id: string
  observer_id?: string
  category: ObservationCategory
  observation_type: ObservationType
  data_source: DataSource
  value: number | string | Record<string, unknown>
  unit?: string
  confidence: number // 0-1
  location: GeoPoint
  timestamp: string
  metadata: Record<string, unknown>
  tags: string[]
  is_anomaly: boolean
  anomaly_score?: number
  notes?: string
}

// ── Hazard ───────────────────────────────────────────────────

export interface Hazard {
  id: string
  mission_id?: string
  name: string
  description: string
  severity: HazardSeverity
  category: string
  location: GeoPoint
  affected_radius_m: number
  confidence: number // 0-1
  source: DataSource
  detected_at: string
  expires_at?: string
  is_active: boolean
  mitigation_steps: string[]
  metadata: Record<string, unknown>
}

// ── Route ────────────────────────────────────────────────────

export interface RouteConstraints {
  max_slope_degrees: number
  avoid_hazard_radius_m: number
  max_distance_km: number
  min_visibility_m: number
  require_line_of_sight: boolean
  preferred_terrain_types: string[]
  excluded_zones: GeoPolygon[]
}

export interface RouteWaypoint {
  id: string
  sequence: number
  location: GeoPoint
  label: string
  description?: string
  estimated_arrival?: string
  tasks: string[]
}

export interface RouteCandidate {
  id: string
  route_id: string
  name: string
  description: string
  waypoints: RouteWaypoint[]
  geometry_geojson: Record<string, unknown>
  total_distance_km: number
  estimated_duration_hours: number
  risk_score: number // 0-100
  comfort_score: number // 0-100
  energy_cost_estimate: number
  hazard_count: number
  is_selected: boolean
  created_at: string
}

export interface Route {
  id: string
  mission_id: string
  constraints: RouteConstraints
  candidates: RouteCandidate[]
  selected_candidate_id?: string
  created_at: string
  updated_at: string
}

// ── Experiment ───────────────────────────────────────────────

export interface Experiment {
  id: string
  mission_id: string
  name: string
  description: string
  experiment_class: ExperimentClass
  location: GeoPoint
  planned_start_time: string
  planned_duration_minutes: number
  actual_start_time?: string
  actual_end_time?: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  equipment_required: string[]
  safety_requirements: string[]
  expected_outputs: string[]
  actual_outputs?: Record<string, unknown>
  notes?: string
  created_at: string
}

// ── Historical Incident ──────────────────────────────────────

export interface HistoricalIncident {
  id: string
  mission: string
  year: number
  incident_type: string
  description: string
  root_cause: string
  lesson: string
  prevention: string
  severity: HazardSeverity
  source_document: string
  source_url?: string
  relevance_tags: string[]
  embedding_id?: string
}

// ── Simulation ───────────────────────────────────────────────

export interface SimulationScenario {
  id: string
  name: string
  description: string
  base_mission_id?: string
  parameters: Record<string, unknown>
  hazard_overrides: Partial<Hazard>[]
  environment_conditions: {
    dust_storm_probability: number
    temperature_variation_c: number
    wind_speed_mps: number
    visibility_m: number
    radiation_level_msvh: number
  }
  created_by: string
  created_at: string
}

export interface SimulationResult {
  id: string
  scenario_id: string
  mission_id?: string
  success_probability: number // 0-1
  estimated_duration_hours: number
  risk_timeline: Array<{
    time_offset_minutes: number
    risk_score: number
    dominant_hazard?: string
  }>
  recommended_actions: string[]
  critical_decision_points: Array<{
    waypoint_id: string
    description: string
    options: string[]
  }>
  computed_at: string
  computation_time_ms: number
}

// ── Data Layer ───────────────────────────────────────────────

export interface DataLayer {
  id: string
  name: string
  description: string
  layer_type: 'TERRAIN' | 'HAZARD' | 'ROUTE' | 'OBSERVATION' | 'IMAGERY' | 'GEOLOGICAL'
  status: DataLayerStatus
  source_url?: string
  tile_url?: string
  geojson?: Record<string, unknown>
  opacity: number // 0-1
  color_map?: string
  min_zoom?: number
  max_zoom?: number
  last_updated: string
  metadata: Record<string, unknown>
}

// ── Telemetry ────────────────────────────────────────────────

export interface TelemetryRecord {
  id: string
  mission_id: string
  astronaut_id: string
  timestamp: string
  suit_pressure_kpa: number
  suit_temperature_c: number
  o2_level_percent: number
  co2_level_ppm: number
  heart_rate_bpm: number
  body_temperature_c: number
  radiation_dose_msv: number
  battery_percent: number
  comms_signal_strength: number // 0-1
  location: GeoPoint
  heading_degrees: number
  speed_mps: number
  anomalies: string[]
}

// ── Report ───────────────────────────────────────────────────

export interface MissionReport {
  id: string
  mission_id: string
  generated_at: string
  generated_by: string
  summary: string
  key_findings: string[]
  hazards_encountered: Hazard[]
  experiments_completed: Experiment[]
  observations_count: number
  route_deviation_km: number
  safety_score: number // 0-100
  recommendations: string[]
  full_text?: string
}

// ── Risk ─────────────────────────────────────────────────────

export interface RiskAnalysis {
  id: string
  mission_id: string
  computed_at: string
  overall_risk_score: number // 0-100
  risk_level: HazardSeverity
  contributing_factors: Array<{
    factor: string
    weight: number
    score: number
    description: string
  }>
  time_series: Array<{
    timestamp: string
    risk_score: number
  }>
  historical_comparison: {
    similar_incidents: HistoricalIncident[]
    similarity_score: number
  }
  recommendations: string[]
  confidence: number // 0-1
}

// ── Comfort Estimation ───────────────────────────────────────

export interface ComfortEstimate {
  id: string
  mission_id: string
  astronaut_id: string
  route_candidate_id?: string
  timestamp: string
  physical_load_score: number // 0-100 (100 = max exertion)
  thermal_comfort_score: number // 0-100
  cognitive_load_score: number // 0-100
  overall_comfort_score: number // 0-100
  estimated_fatigue_percent: number
  recommended_rest_in_minutes: number
  warnings: string[]
}

// ── Digital Twin ─────────────────────────────────────────────

export interface DigitalTwinState {
  mission_id: string
  timestamp: string
  astronauts: Array<{
    id: string
    name: string
    location: GeoPoint
    heading_degrees: number
    speed_mps: number
    telemetry: TelemetryRecord
    predicted_location_5min?: GeoPoint
  }>
  environment: {
    dust_opacity: number
    wind_speed_mps: number
    wind_direction_degrees: number
    surface_temperature_c: number
    atmospheric_pressure_pa: number
    uv_index: number
    radiation_msvh: number
  }
  active_hazards: Hazard[]
  route_progress_percent: number
  estimated_time_to_destination_minutes: number
  alerts: Notification[]
}

// ── Notification ─────────────────────────────────────────────

export interface Notification {
  id: string
  mission_id?: string
  type: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL'
  title: string
  message: string
  timestamp: string
  read: boolean
  action_required: boolean
  action_url?: string
  metadata?: Record<string, unknown>
}

// ── Mission Event ────────────────────────────────────────────

export interface MissionEvent {
  id: string
  mission_id: string
  event_type:
    | 'MISSION_START'
    | 'MISSION_PAUSE'
    | 'MISSION_RESUME'
    | 'MISSION_END'
    | 'WAYPOINT_REACHED'
    | 'HAZARD_DETECTED'
    | 'EXPERIMENT_START'
    | 'EXPERIMENT_END'
    | 'ANOMALY_DETECTED'
    | 'ROUTE_DEVIATION'
    | 'EMERGENCY_DECLARED'
    | 'SYSTEM_UPDATE'
  timestamp: string
  actor_id?: string
  description: string
  metadata: Record<string, unknown>
}

// ── API Responses ────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface ApiError {
  detail: string
  status_code: number
}

export interface WebSocketMessage {
  event: string
  data: unknown
  timestamp: string
}
