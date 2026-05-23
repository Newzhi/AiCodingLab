import { useLayerErrorStore } from '../stores/layerErrorStore'
import { LAYER_REGISTRY } from '../config/layerRegistry'

export function LayerErrorBanner() {
  const errors = useLayerErrorStore((s) => s.errors)
  const entries = Object.values(errors)
  if (entries.length === 0) return null

  return (
    <div className="layer-error-banner" role="alert">
      {entries.map((e) => {
        const label =
          LAYER_REGISTRY.find((r) => r.id === e.layerId)?.label ?? e.layerId
        return (
          <p key={e.layerId}>
            <strong>{label}:</strong> {e.message}
          </p>
        )
      })}
    </div>
  )
}
