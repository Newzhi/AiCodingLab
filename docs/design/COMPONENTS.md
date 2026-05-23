# UI 组件索引

| 文档 | 说明 |
|------|------|
| [UI_SPEC.md](./UI_SPEC.md) | 完整 UI/UX 规格、Token、线框、交互 |

## 前端组件（`apps/web/src/components/`）

| 组件 | 文件 |
|------|------|
| LayerPanel | `LayerPanel.tsx` |
| Timeline | `Timeline.tsx` |
| CrosshairOverlay | `CrosshairOverlay.tsx` |
| Legend | `Legend.tsx` |
| Attribution | `Attribution.tsx` |
| EarthGlobe | `EarthGlobe.tsx` |
| FlyToPanel | `FlyToPanel.tsx` |
| LayerErrorBanner | `LayerErrorBanner.tsx` |

## 控制器 / 图层

| 模块 | 文件 |
|------|------|
| 图层注册表 | `config/layerRegistry.ts` |
| 全球图层同步 | `controllers/useGlobeLayers.ts` |
| 区域视图 | `controllers/useRegionalView.ts` |
| 十字准星探针 | `controllers/useCrosshairProbe.ts` |
| 气温 Imagery | `layers/temperatureLayer.ts` |
| 区域边界 | `layers/regionalViewLayer.ts` |
