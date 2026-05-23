# 3D 地球地图可视化

Monorepo：Cesium 3D 地球（OSM 底图、地形、路网）+ FastAPI 图层目录与可选遗留气象摄取管线。

## 仓库

- GitHub: https://github.com/Newzhi/AiCodingLab.git
- 协作手册: [AGENTS.md](AGENTS.md)
- 团队章程: [docs/TEAM.md](docs/TEAM.md)
- **UI 设计规格**: [docs/design/UI_SPEC.md](docs/design/UI_SPEC.md)
- 新需求模板: [docs/REQUEST_TEMPLATE.md](docs/REQUEST_TEMPLATE.md)

## 快速开始

### Windows 一键启动

在项目根目录 **双击 `start.bat`**（或命令行执行 `start.bat`），脚本会启动后端 API 与前端开发服务器，并打开 http://localhost:5173

| 脚本 | 用途 |
|------|------|
| `start.bat` | 一键启动后端 + 前端 |
| `start-backend.bat` | 仅启动后端 API |
| `start-frontend.bat` | 仅启动前端开发服务器 |
| `stop.bat` | 终止占用 8000 / 5173 端口的进程 |

可选复制 `.env.example` 为 `.env` 以配置 Cesium Ion Token（见下文）。

### 1. 环境

```bash
cp .env.example .env
```

| 变量 | 必需 | 说明 |
|------|------|------|
| `VITE_CESIUM_ION_TOKEN` | 否 | 有效 Token 时启用 **Cesium World Terrain**（高程地形图层）；未设置时为椭球地形 + 面板提示 |
| `VITE_API_BASE_URL` | 否 | 默认 `http://localhost:8000`（图层目录；地图瓦片由浏览器直连 OSM/Esri） |

### 2. 后端 API（可选）

地图前端可独立运行；后端提供 `GET /layers/catalog` 与健康检查。遗留气象摄取端点仍保留于代码库，但**默认启动不再生成演示气象数据**。

```bash
cd services/api
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

API 默认 http://localhost:8000

### 3. 前端

```bash
cd apps/web
npm install
npm run dev
```

浏览器打开 http://localhost:5173

生产构建：

```bash
npm run build
npm run preview
```

## 图层说明（左侧面板）

| 图层 | 说明 |
|------|------|
| **底图 (OSM)** | [OpenStreetMap](https://www.openstreetmap.org/) 栅格瓦片，遵守 [瓦片使用政策](https://operations.osmfoundation.org/policies/tiles/) |
| **高程地形** | 需有效 `VITE_CESIUM_ION_TOKEN` → Cesium World Terrain；否则椭球并显示 ⚠ |
| **高程着色** | Esri World Hillshade 半透明叠加（无需 Ion） |
| **路网** | OSM France HOT 半透明叠加，强调道路网络 |
| **定位** | 侧栏 FlyTo：输入经纬度飞行至目标 |

鼠标移动显示十字准星与 **经纬度 HUD**（无气温探针）。

视图锁定为 **3D 球体**（`SCENE3D`）。

## 底图与地形配置

| 场景 | 行为 |
|------|------|
| 无 Ion Token | OSM 底图 + 椭球；可开 hillshade / 路网 |
| 有效 Ion Token | OSM 底图 + 可切换 Cesium World Terrain |
| 署名 | 页脚 © OpenStreetMap contributors；hillshade © Esri |

## API（地图 MVP）

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /layers/catalog` | 地图图层元数据（basemap / terrain / hillshade / roads） |

遗留气象端点（`/times`、`/assets/...`、`/weather/...`、`POST /ingest/*`）仍存在于 `services/api`，供后续扩展，**不在默认 catalog 中**。

## 目录

```
apps/web/           # Vite + React + Cesium
services/api/       # FastAPI（catalog + 可选 ingest）
data/processed/     # 遗留气象资产（gitignore）
docs/               # TEAM, ARCHITECTURE, design/
```

## MVP 功能

| 项 | 状态 |
|----|------|
| Cesium 3D 地球 | ✅ |
| OSM 底图 | ✅ |
| 高程地形 / 着色 / 路网开关 | ✅ |
| 经纬度十字准星 HUD | ✅ |
| 经纬度定位飞行 | ✅ |
| Attribution（OSM / Esri / 地形说明） | ✅ |
| 仅 3D 球体 | ✅ |

## 故障排查

### 球体全黑、无底图

1. 确认可访问 `tile.openstreetmap.org`（Network 中瓦片 200）。
2. 确认 `apps/web/src/index.css` 包含 Cesium widgets CSS。
3. 控制台无 Cesium 初始化错误。

### 高程地形不生效

1. 在 `.env` 设置有效 `VITE_CESIUM_ION_TOKEN`（勿使用占位符 `your_cesium_ion_token_here`）。
2. 勾选 **高程地形**；无 Token 时面板会显示 ⚠ 提示。

### 构建验证

```bash
cd apps/web
npm run build
```
