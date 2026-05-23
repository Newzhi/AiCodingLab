import { useQuery } from '@tanstack/react-query'
import { fetchManifest } from '../api/client'

type Props = {
  validTime: string | null
}

const SOURCE_LABELS: Record<string, string> = {
  demo: '演示合成数据（非真实 GFS/CMEMS）',
  gfs: 'NOAA GFS 真实预报数据',
  synthetic: '合成洋流 UV（未配置 CMEMS 凭据）',
  cmems: 'Copernicus Marine 真实洋流数据',
  fallback_demo: 'GFS 摄取失败，已回退演示数据',
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source] ?? `数据来源：${source}`
}

export function Attribution({ validTime }: Props) {
  const { data: manifest } = useQuery({
    queryKey: ['manifest', validTime],
    queryFn: () => fetchManifest(validTime!),
    enabled: Boolean(validTime),
  })

  const basemapNote =
    import.meta.env.VITE_CESIUM_ION_TOKEN &&
    import.meta.env.VITE_CESIUM_ION_TOKEN !== 'your_cesium_ion_token_here'
      ? '底图：Cesium Ion'
      : '底图：Esri World Imagery（无需 Token）'

  return (
    <footer className="attribution">
      <p>
        气象图层：NOAA GFS（气温/气压/风）、Copernicus Marine（洋流）。仅供科研演示，商用请核对许可。
      </p>
      <p>{basemapNote}</p>
      {manifest && (
        <p className="attribution-source">
          当前时次数据：<strong>{sourceLabel(manifest.source)}</strong>
        </p>
      )}
      {validTime && <p>valid_time: {validTime}</p>}
      {!validTime && (
        <p className="attribution-warn">
          未连接后端或无可用时次 — 请先运行 start.bat 或 POST /ingest/demo
        </p>
      )}
    </footer>
  )
}
