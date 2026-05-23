import { useLayerStore, type LayerId } from '../stores/layerStore'

const LABELS: Record<LayerId, string> = {
  basemap: '底图',
  temperature: '气温 (2m)',
  isobars: '等压线',
  wind: '风场粒子',
  ocean: '洋流粒子',
}

export function LayerPanel() {
  const layers = useLayerStore((s) => s.layers)
  const setLayer = useLayerStore((s) => s.setLayer)

  return (
    <aside className="panel layer-panel">
      <h2>图层</h2>
      <ul>
        {(Object.keys(LABELS) as LayerId[]).map((id) => (
          <li key={id}>
            <label>
              <input
                type="checkbox"
                checked={layers[id]}
                onChange={(e) => setLayer(id, e.target.checked)}
              />
              {LABELS[id]}
            </label>
          </li>
        ))}
      </ul>
    </aside>
  )
}
