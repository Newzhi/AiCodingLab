import { useLayerStore } from '../stores/layerStore'
import { LAYER_REGISTRY } from '../config/layerRegistry'
import { useLayerErrorStore } from '../stores/layerErrorStore'

export function LayerPanel() {
  const layers = useLayerStore((s) => s.layers)
  const setLayer = useLayerStore((s) => s.setLayer)
  const errors = useLayerErrorStore((s) => s.errors)

  return (
    <aside className="panel layer-panel">
      <h2>图层</h2>
      <ul>
        {LAYER_REGISTRY.map(({ id, label }) => (
          <li key={id}>
            <label>
              <input
                type="checkbox"
                checked={layers[id]}
                onChange={(e) => setLayer(id, e.target.checked)}
              />
              {label}
            </label>
            {errors[id] && (
              <span className="layer-error-hint" title={errors[id].message}>
                ⚠
              </span>
            )}
          </li>
        ))}
      </ul>
    </aside>
  )
}
