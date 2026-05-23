import type { LayerId } from '../stores/layerStore'

export type LayerType = 'basemap' | 'scalar_texture' | 'geojson' | 'uv_particles'

export type LayerRegistryEntry = {
  id: LayerId
  label: string
  type: LayerType
  defaultVisible: boolean
  description?: string
}

/** Data-driven layer catalog — extend here for future layers. */
export const LAYER_REGISTRY: LayerRegistryEntry[] = [
  {
    id: 'basemap',
    label: '底图',
    type: 'basemap',
    defaultVisible: true,
  },
  {
    id: 'temperature',
    label: '气温 (2m)',
    type: 'scalar_texture',
    defaultVisible: true,
    description: 'GFS 2m 气温填色（coolwarm -40~40°C）',
  },
  {
    id: 'terrain_contours',
    label: '地势等高线',
    type: 'geojson',
    defaultVisible: true,
    description: '全球地势海拔等高线（非气压）',
  },
  {
    id: 'wind',
    label: '风场粒子',
    type: 'uv_particles',
    defaultVisible: true,
    description: 'GPU 风场粒子',
  },
  {
    id: 'ocean',
    label: '洋流粒子',
    type: 'uv_particles',
    defaultVisible: true,
    description: 'GPU 洋流粒子',
  },
]

export const DEFAULT_LAYER_VISIBILITY = Object.fromEntries(
  LAYER_REGISTRY.map((e) => [e.id, e.defaultVisible]),
) as Record<LayerId, boolean>

export function getLayerEntry(id: LayerId): LayerRegistryEntry | undefined {
  return LAYER_REGISTRY.find((e) => e.id === id)
}
