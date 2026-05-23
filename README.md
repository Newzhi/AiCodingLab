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
# 编辑 .env：VITE_CESIUM_ION_TOKEN（可选）、CMEMS 凭据（洋流实况摄取）
```

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
首次启动若无处理数据，会自动 `POST` 等效的演示数据（两个预报时次）。

手动重新生成演示数据：

```bash
curl -X POST http://localhost:8000/ingest/demo
```

拉取真实 GFS（需网络与 cfgrib/ecCodes）：

```bash
curl -X POST http://localhost:8000/ingest/gfs
```

### 3. 前端

```bash
cd apps/web
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 目录

```
apps/web/           # Vite + React + Cesium
services/api/       # FastAPI + ingest/process
data/processed/     # 预处理资产（gitignore）
docs/               # TEAM, ARCHITECTURE, REQUEST_TEMPLATE
.cursor/rules/      # 各角色 Cursor 规则
```

## MVP 功能状态

| 项 | 状态 |
|----|------|
| Monorepo 骨架 | 完成 |
| FastAPI catalog/times/assets | 完成 |
| 演示数据摄取 | 完成 |
| Herbie GFS 摄取 | 已实现（环境依赖 ecCodes） |
| Cesium 地球 + 图层面板 + 时间轴 | 完成 |
| 气温 / 等压线图层 | 完成 |
| 风场 / 洋流粒子（PointPrimitive 平流） | MVP 完成，可升级为 GPU Shader |
| CMEMS 定时摄取 | 接口 + 合成回退；生产需凭据 |

## 向总指挥提交需求

复制 [docs/REQUEST_TEMPLATE.md](docs/REQUEST_TEMPLATE.md) 填写，在 Cursor 中指定 **总指挥** 角色处理。
