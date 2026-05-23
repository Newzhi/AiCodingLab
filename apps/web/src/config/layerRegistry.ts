import type { LayerId } from '../stores/layerStore'

export type LayerType = 'basemap' | 'terrain' | 'imagery_overlay'

export type LayerRegistryEntry = {
  id: LayerId
  label: string
  type: LayerType
  defaultVisible: boolean
  description?: string
}

/** Map-only layer catalog — OSM basemap, terrain, hillshade, roads. */
export const LAYER_REGISTRY: LayerRegistryEntry[] = [
  {
    id: 'basemap',
    label: '底图 (OSM)',
    type: 'basemap',
    defaultVisible: true,
    description: 'OpenStreetMap 栅格瓦片',
  },
  {
    id: 'terrain',
    label: '高程地形',
    type: 'terrain',
    defaultVisible: false,
    description: 'Cesium World Terrain（需 Ion Token）',
  },
  {
    id: 'hillshade',
    label: '高程着色',
    type: 'imagery_overlay',
    defaultVisible: false,
    description: 'Esri World Hillshade 山体阴影叠加',
  },
  {
    id: 'roads',
    label: '路网',
    type: 'imagery_overlay',
    defaultVisible: false,
    description: 'OSM HOT 路网强调半透明叠加',
  },
]

export const DEFAULT_LAYER_VISIBILITY = Object.fromEntries(
  LAYER_REGISTRY.map((e) => [e.id, e.defaultVisible]),
) as Record<LayerId, boolean>

export function getLayerEntry(id: LayerId): LayerRegistryEntry | undefined {
  return LAYER_REGISTRY.find((e) => e.id === id)
}
