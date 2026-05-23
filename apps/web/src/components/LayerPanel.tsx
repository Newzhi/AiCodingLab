import { useLayerStore } from '../stores/layerStore'
import { LAYER_REGISTRY } from '../config/layerRegistry'
import { useLayerErrorStore } from '../stores/layerErrorStore'
import { useCrosshairStore } from '../stores/crosshairStore'

export function LayerPanel() {
  const layers = useLayerStore((s) => s.layers)
  const setLayer = useLayerStore((s) => s.setLayer)
  const errors = useLayerErrorStore((s) => s.errors)
  const liveWebWeather = useCrosshairStore((s) => s.liveWebWeather)
  const setLiveWebWeather = useCrosshairStore((s) => s.setLiveWebWeather)

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
        <li className="layer-panel-divider" />
        <li>
          <label title="十字准星优先使用 Open-Meteo / wttr.in 实时网页数据">
            <input
              type="checkbox"
              checked={liveWebWeather}
              onChange={(e) => setLiveWebWeather(e.target.checked)}
            />
            实时网页数据
          </label>
        </li>
      </ul>
    </aside>
  )
}
