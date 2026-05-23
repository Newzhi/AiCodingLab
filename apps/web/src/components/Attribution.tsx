import { isValidIonToken } from '../cesium/createViewer'

type Props = {
  compact?: boolean
}

export function Attribution({ compact = false }: Props) {
  const hasIon = isValidIonToken(import.meta.env.VITE_CESIUM_ION_TOKEN)
  const terrainNote = hasIon
    ? '高程：Cesium World Terrain（Ion）'
    : '高程：椭球（无 Ion Token 时）；配置 VITE_CESIUM_ION_TOKEN 可启用全球地形'

  if (compact) {
    return (
      <footer className="attribution attribution--compact">
        <span>
          底图 ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors
        </span>
        <span> · {terrainNote}</span>
        <span> · 视图锁定 3D 球体</span>
      </footer>
    )
  }

  return (
    <footer className="attribution">
      <p>
        底图瓦片来自 OpenStreetMap（
        <a href="https://operations.osmfoundation.org/policies/tiles/">使用政策</a>
        ）。路网叠加使用 OSM France HOT；高程着色使用 Esri World Hillshade。
      </p>
      <p>{terrainNote}</p>
      <p>视图锁定为 3D 球体（无平面地图模式）。</p>
    </footer>
  )
}
