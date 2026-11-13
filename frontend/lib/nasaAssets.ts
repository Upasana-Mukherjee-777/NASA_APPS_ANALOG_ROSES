import manifestData from '../public/assets/nasa/manifest.json'

export interface NASAAsset {
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

export const NASA_ASSETS: NASAAsset[] = manifestData as NASAAsset[]

export function getAssetsByCategory(category: string): NASAAsset[] {
  return NASA_ASSETS.filter(a => a.category.toLowerCase().includes(category.toLowerCase()))
}

export function getRandomAsset(category?: string): NASAAsset {
  const pool = category ? getAssetsByCategory(category) : NASA_ASSETS
  if (pool.length === 0) return NASA_ASSETS[0]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function getAssetByIndex(index: number): NASAAsset {
  return NASA_ASSETS[index % NASA_ASSETS.length]
}

export function getAssetById(id: string): NASAAsset | undefined {
  return NASA_ASSETS.find(a => a.id === id)
}

