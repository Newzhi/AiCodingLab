# 技术架构 · 3D 地球气象可视化

> **维护者**：架构师。变更主栈或目录结构须架构师批准并更新本文档。

## 1. 总览

| 层级 | 技术 | 路径 |
|------|------|------|
| 前端 | Vite + React 18 + TypeScript + CesiumJS | `apps/web/` |
| 状态 | Zustand + TanStack Query | `apps/web/src/stores/` |
| 后端 | FastAPI + Uvicorn | `services/api/` |
| GFS | Herbie + cfgrib + xarray | `services/api/ingest/` |
| 海洋 | copernicusmarine | `services/api/ingest/` |
| 存储 | 本地 `data/processed/`（MVP） | `data/` |

## 2. 数据流

```
NOAA GFS (Herbie) ──┐
                    ├──► Preprocessor ──► data/processed/{valid_time}/
CMEMS (Toolbox)  ───┘         │
                                ▼
                         FastAPI /assets
                                │
                                ▼
                    Cesium 图层 (气温/等压线/粒子)
```

## 3. 预处理产物

| 图层 ID | 文件 | 说明 |
|---------|------|------|
| `temperature` | `temperature.png` + `temperature.meta.json` | 2m 气温 EPSG:4326 纹理 |
| `isobars` | `isobars.geojson` | 海平面气压等值线 |
| `wind` | `wind.uv.json` + `wind.uv.bin` | U/V 规则网格（float32） |
| `ocean` | `ocean.uv.json` + `ocean.uv.bin` | 洋流 U/V |

## 4. API 契约

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/layers/catalog` | 图层元数据列表 |
| GET | `/times` | 可用 `valid_time` ISO8601 列表 |
| GET | `/assets/{valid_time}/{layer_id}` | 资产清单（URL 相对路径） |
| POST | `/ingest/demo` | 生成演示数据（开发用） |
| POST | `/ingest/gfs` | 触发 GFS 摄取（需网络与 cfgrib） |
| POST | `/ingest/cmems` | 触发 CMEMS 摄取（需凭据） |

### 资产响应示例

```json
{
  "valid_time": "2026-05-23T12:00:00Z",
  "layer_id": "temperature",
  "files": {
    "texture": "/static/processed/2026-05-23T12:00:00Z/temperature.png",
    "meta": "/static/processed/2026-05-23T12:00:00Z/temperature.meta.json"
  }
}
```

## 5. 前端模块

```
src/
├── cesium/          # Viewer 初始化
├── layers/          # temperature, isobars, windParticles, oceanParticles
├── components/      # LayerPanel, Timeline, Legend, Attribution
├── stores/          # layerVisibility, currentTime
└── api/             # fetch catalog, times, assets
```

## 6. 环境变量

见根目录 `.env.example`：`VITE_CESIUM_ION_TOKEN`、`VITE_API_BASE_URL`、`CMEMS_*`、`GFS_*`、`DATA_DIR`。

## 7. 代码规范（架构师制定）

- TypeScript：`strict` 开启；组件函数式 + hooks
- Python：类型注解；`app/` 包内相对导入；路由放 `routers/`
- 禁止在业务代码中硬编码密钥
- 图层 ID 枚举：`temperature` | `isobars` | `wind` | `ocean` | `basemap`

## 8. 性能目标

- 粒子数 1e4–5e4，目标 60fps（GPU Primitive，非 Entity 逐点）
- 仅保留最近 2–3 个 `valid_time` 的处理结果

## 9. 风险

| 风险 | 对策 |
|------|------|
| GRIB 体积大 | subset 单层变量；降采样 0.25° |
| Herbie 离线失败 | `POST /ingest/demo` 演示数据 |
| Copernicus 配额 | 夜间批处理；前端只读已处理资产 |

## 10. MVP 验收

- 3D 地球可旋转缩放
- 四图层独立开关
- 数据来自 GFS/CMEMS 管线（非爬虫），展示署名与 `valid_time`
- 时间轴 ≥2 时次
