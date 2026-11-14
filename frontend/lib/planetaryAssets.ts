import manifestData from '../public/assets/nasa/manifest.json'

export interface PlanetaryObservation {
  id: string
  filename: string
  title: string
  date: string
  instrument: string
  credit: string
  description: string
  category: string
  original_url: string
  local_path: string
}

export const PLANETARY_OBSERVATIONS: PlanetaryObservation[] = manifestData as PlanetaryObservation[]

export function getObservationsByCategory(category: string): PlanetaryObservation[] {
  return PLANETARY_OBSERVATIONS.filter(a => a.category.toLowerCase().includes(category.toLowerCase()))
}

export function getRandomObservation(category?: string): PlanetaryObservation {
  const pool = category ? getObservationsByCategory(category) : PLANETARY_OBSERVATIONS
  if (pool.length === 0) return PLANETARY_OBSERVATIONS[0]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getObservationByIndex(index: number): PlanetaryObservation {
  return PLANETARY_OBSERVATIONS[index % PLANETARY_OBSERVATIONS.length]
}

export function getObservationById(id: string): PlanetaryObservation | undefined {
  return PLANETARY_OBSERVATIONS.find(a => a.id === id)
}

