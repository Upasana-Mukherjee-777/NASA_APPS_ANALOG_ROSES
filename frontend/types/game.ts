export type CompanionMood = 'idle' | 'happy' | 'thinking' | 'scanning' | 'alert' | 'celebrate'
export type TimeOfDay = 'dawn' | 'noon' | 'sunset' | 'night'
export type WeatherState = 'clear' | 'dust_devil' | 'dust_storm' | 'solar_storm'

export interface RoverPosition {
  x: number // percentage (0-100) on Jezero tactical grid
  y: number
  lat: number
  lon: number
  heading: number // degrees 0-360
  isDriving: boolean
  targetX?: number
  targetY?: number
}

export interface SurvivalState {
  batteryPct: number // 0-100%
  oxygenPct: number // 0-100%
  hullIntegrityPct: number // 0-100%
  coolantPct: number // 0-100%
  sampleCount: number
  maxSamples: number
  isRecharging: boolean
  warningAlert?: string | null
}

export interface MineralDeposit {
  name: string
  percent: number
  description: string
  color: string
  isHydrated: boolean
}

export interface TerrainScanResult {
  pointId: string
  name: string
  lat: number
  lon: number
  elevationMeters: number
  slopeDeg: number
  slopePlainEnglish: string
  roughnessMeters: number
  minerals: MineralDeposit[]
  waterIceProbability: number
  hazardLevel: 'SAFE' | 'CAUTION' | 'DANGER'
  hazardNotes: string
  landingSuitability: 'EXCELLENT' | 'ACCEPTABLE' | 'HAZARDOUS'
  scienceImage: string
  scienceTitle: string
  scienceInstrument: string
  solObserved: number
  datasetProvenance: string
  sampleAvailable?: boolean
}

export interface DiscoveryItem {
  id: string
  title: string
  category: 'MINERAL' | 'LANDMARK' | 'ATMOSPHERE' | 'SAMPLE'
  image: string
  description: string
  sol: number
  xpEarned: number
  timestamp: string
}

export interface MissionObjective {
  id: string
  text: string
  completed: boolean
  targetAction: string
  xp: number
}

export interface GameMission {
  id: string
  code: string
  title: string
  difficulty: 'CADET' | 'SURVEYOR' | 'SPECIALIST' | 'PIONEER'
  brief: string
  location: string
  status: 'locked' | 'active' | 'completed'
  objectives: MissionObjective[]
  rewardXP: number
  badgeReward: string
  badgeIcon: string
}

export interface AchievementBadge {
  id: string
  name: string
  description: string
  category: 'NAVIGATION' | 'SCIENCE' | 'SURVIVAL' | 'HONORS'
  unlocked: boolean
  unlockedAt?: string
  iconKey: string
}

