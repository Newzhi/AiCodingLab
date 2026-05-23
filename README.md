# 3D 地球气象可视化

Monorepo：Cesium 3D 地球 + FastAPI 预处理 GFS / Copernicus 海洋数据。

## 仓库

- GitHub: https://github.com/Newzhi/AiCodingLab.git
- 协作手册: [AGENTS.md](AGENTS.md)
- 团队章程: [docs/TEAM.md](docs/TEAM.md)
- 新需求模板: [docs/REQUEST_TEMPLATE.md](docs/REQUEST_TEMPLATE.md)

## 快速开始

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
