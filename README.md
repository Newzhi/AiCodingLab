# 3D 地球气象可视化

Monorepo：Cesium 3D 地球 + FastAPI 预处理 GFS / Copernicus 海洋数据。

## 仓库

- GitHub: https://github.com/Newzhi/AiCodingLab.git
- 协作手册: [AGENTS.md](AGENTS.md)
- 团队章程: [docs/TEAM.md](docs/TEAM.md)
- 新需求模板: [docs/REQUEST_TEMPLATE.md](docs/REQUEST_TEMPLATE.md)

## 快速开始

### Windows 一键启动

在项目根目录 **双击 `start.bat`**（或命令行执行 `start.bat`），脚本会自动：

1. 在新窗口启动后端（`services/api`：创建/激活 `.venv`、按需 `pip install`、生成演示数据、运行 `python run.py`）
2. 等待 `http://localhost:8000/health` 就绪后，在新窗口启动前端（`apps/web`：按需 `npm install`、`npm run dev`）
3. 打开浏览器访问 http://localhost:5173

| 脚本 | 用途 |
|------|------|
| `start.bat` | 一键启动后端 + 前端 |
| `start-backend.bat` | 仅启动后端 API |
| `start-frontend.bat` | 仅启动前端开发服务器 |
| `stop.bat` | 终止占用 8000 / 5173 端口的进程 |

**说明：** 首次运行会安装 Python / Node 依赖，耗时较长；之后若 `.venv` 与 `node_modules` 已存在则跳过安装。可选复制 `.env.example` 为 `.env` 以配置 Cesium Ion Token 等（见下文）。

### 1. 环境

```bash
cp .env.example .env
```

| 变量 | 必需 | 说明 |
|------|------|------|
| `VITE_CESIUM_ION_TOKEN` | 否 | 有则使用 Cesium Ion 底图；无则回退 OpenStreetMap |
| `VITE_API_BASE_URL` | 否 | 默认 `http://localhost:8000` |
| `CMEMS_USERNAME` / `CMEMS_PASSWORD` | 否 | 有则拉取 Copernicus 洋流；无则合成洋流 UV |
| `ENABLE_SCHEDULER` | 否 | 默认 `false`；设为 `true` 时每 6h 后台 GFS 摄取 |
| GFS / Herbie | 否 | 需网络 + ecCodes/cfgrib；失败时自动回退演示数据 |

### 2. 后端 API

```bash
cd services/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

API 默认 http://localhost:8000  
首次启动若无 `data/processed/` 数据，会自动生成两个预报时次的演示资产。

**离线演示数据（无需网络）：**

```bash
cd services/api
python -m app.ingest.demo
```

或通过 HTTP：

```bash
curl -X POST http://localhost:8000/ingest/demo
```

**真实 GFS（需网络与 ecCodes/cfgrib）：**

```bash
curl -X POST http://localhost:8000/ingest/gfs
```

**CMEMS 洋流（需 `.env` 凭据）：**

```bash
curl -X POST "http://localhost:8000/ingest/cmems"
```

无凭据时 `/ingest/cmems` 会写入合成洋流 UV 并返回 `status: synthetic`。

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

### 4. API 验收

| 端点 | 说明 |
|------|------|
| `GET /health` | 健康检查 |
| `GET /layers/catalog` | 四图层元数据 |
| `GET /times` | 可用 `valid_time` 列表（≥2） |
| `GET /assets/{valid_time}/{layer_id}` | 图层资产 URL |
| `GET /static/processed/...` | PNG / GeoJSON / UV 二进制 |

## 目录

```
apps/web/           # Vite + React + Cesium（GPU 风/洋流粒子）
services/api/       # FastAPI + ingest/process
data/processed/     # 预处理资产（gitignore）
docs/               # TEAM, ARCHITECTURE, REQUEST_TEMPLATE
.cursor/rules/      # 各角色 Cursor 规则
```

## MVP 功能

| 项 | 状态 |
|----|------|
| Cesium 3D 地球可旋转缩放 | ✅ |
| 四图层独立开关（气温/等压线/风/洋流） | ✅ |
| GFS/CMEMS 管线 + 演示/合成回退 | ✅ |
| 时间轴 ≥2 时次 | ✅ |
| Attribution + valid_time | ✅ |
| GPU ComputeCommand 粒子（风/洋流） | ✅ |
| 多智能体文档（AGENTS.md 等） | ✅ |

## 向总指挥提交需求

复制 [docs/REQUEST_TEMPLATE.md](docs/REQUEST_TEMPLATE.md) 填写，在 Cursor 中指定 **总指挥** 角色处理。
