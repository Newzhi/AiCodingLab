import { useLayerStore } from '../stores/layerStore'

export function Legend() {
  const range = useLayerStore((s) => s.tempRange)
  const layers = useLayerStore((s) => s.layers)

  if (!layers.temperature || !range) return null

  return (
    <div className="panel legend">
      <h3>气温 (°C)</h3>
      <div className="legend-bar" />
      <div className="legend-labels">
        <span>{range.min.toFixed(1)}</span>
        <span>{range.max.toFixed(1)}</span>
      </div>
    </div>
  )
}
