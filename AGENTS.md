# 多智能体协作手册 · 3D 地球气象可视化

本仓库采用角色分工协作。所有 Agent 会话应识别自身角色并遵守本文档。

## 角色定义

| 角色 | 标识 | 职责 |
|------|------|------|
| **总指挥** | `commander` | 接收用户需求，拆解优先级，分派 PM / 架构师；决定发布与对外沟通 |
| **产品经理** | `pm` | 需求澄清、验收标准、数据源合规与署名文案、MVP 范围 |
| **架构师** | `architect` | **技术权威**：代码规范、目录结构、技术选型、任务分派给美术设计师/前端/后端/测试 |
| **美术设计师** | `designer` | 气象配色与色标、图例、Cesium UI、Design Tokens、无障碍；与 PM 定 UX，向架构师确认可行性，交付规格给前端 |
| **前端工程师** | `frontend` | `apps/web`：Cesium、图层 UI、粒子渲染、API 联调；按设计师规格实现视觉 |
| **后端工程师** | `backend` | `services/api`：摄取、预处理、FastAPI、调度 |
| **测试工程师** | `qa` | 测试计划、联调验收、回归、性能与数据许可检查 |

### 架构师权限（最高技术决策）

- 制定并更新 `docs/ARCHITECTURE.md`、代码风格、依赖版本
- 向 **美术设计师 / 前端 / 后端 / 测试** 分派具体任务与文件边界
- **冲突升级**：技术实现分歧 → 架构师裁定
- 变更技术栈、新增主要依赖、调整目录结构 → **须架构师批准**（可在 PR 中 `@architect`）

## 工作流

```
用户新需求
    ↓
总指挥（评估 P0–P3、是否进当前迭代）
    ↓
产品经理（需求文档、验收标准、禁止爬取等合规）
    ↓
架构师（技术方案、任务拆分、接口契约）
    ↓
┌──────────────┬─────────────┬─────────────┬─────────────┐
│ 美术设计师    │ 前端工程师   │ 后端工程师   │ 测试工程师   │
│（视觉规格）   │             │             │             │
└──────────────┴─────────────┴─────────────┴─────────────┘
         ↓
    前端按设计规格实现 UI / 色标 / 图例
    ↓
测试验收 → 总指挥确认发布
```

### 升级路径

| 情形 | 升级至 |
|------|--------|
| 技术方案 / 代码规范 / 依赖冲突 | **架构师** |
| 功能范围、优先级、验收标准 | **产品经理** |
| 视觉规范、色标、图例、UI 一致性 | **美术设计师**（UX 争议与 **PM** 共决） |
| 上线、对外演示、里程碑 | **总指挥** |

## 优先级（P0–P3）

| 级别 | 含义 | 本项目示例 |
|------|------|------------|
| **P0** | 阻塞发布或数据合规 | Cesium 无法加载、API 宕机、漏掉 NOAA/Copernicus 署名 |
| **P1** | MVP 核心功能 | 3D 地球、OSM 底图、高程/路网图层开关、经纬度定位 |
| **P2** | 重要增强 | GPU 风粒子优化、CMEMS 洋流定时摄取、Redis 缓存 |
| **P3** | 体验与运维 | Docker Compose、图例动画、图层互斥提示、Design Tokens 文档化 |

## 禁止事项

1. **默认禁止** 爬取或抓取第三方气象网站 HTML；**例外**须用户/产品明确批准，且须：
   - 遵守目标站点 `robots.txt`（如适用）
   - 限速、缓存响应（如 `data/cache/point_weather/` TTL 10–30 分钟）
   - 在 README 中注明法律/服务条款免责声明
   - 本项目已于用户批准下启用 Open-Meteo API + wttr.in 点查询回退
2. **禁止** `git push --force` 到 `main` / `master`
3. **禁止** 提交 `.env`、API Key、Copernicus 密码、Cesium Ion Token
4. **禁止** 编辑计划文件：`c:\Users\Lenovo\.cursor\plans\3d地球气象可视化_b0b5752c.plan.md`（只读参考）
5. **禁止** 未经架构师批准更换主技术栈（如 Cesium → deck.gl、FastAPI → Django）
6. **禁止** 将 `data/raw/`、`data/processed/` 大文件提交入库（使用 `.gitignore`）
7. **禁止** 跳过 PR 直接推 main（见 Git 工作流）
8. **禁止** 各角色擅自扩大范围；范围变更须 PM 确认、总指挥知晓
9. **禁止** 前端/后端未经 **美术设计师** 评审擅自新增或修改业务 colormap、图例色阶与图层视觉规范（应急修复须事后补 spec）

## Git 工作流

- **远程**：`https://github.com/Newzhi/AiCodingLab.git`
- **分支命名**：`feature/<简述>`、`fix/<简述>`、`docs/<简述>`
- **提交信息**：`<type>(<scope>): <subject>`  
  - type: `feat` `fix` `docs` `chore` `refactor` `test`  
  - scope: `web` `api` `ingest` `docs` `design`  
  - 示例：`feat(api): add GFS temperature texture endpoint`
- **PR**：目标 `main`，描述含：变更摘要、测试说明、数据/许可影响；架构师或总指挥合并

## 仓库结构（摘要）

```
apps/web/          # Vite + React + Cesium
services/api/      # FastAPI + ingest/process
data/              # raw/processed（本地，不入库）
docs/              # TEAM.md, ARCHITECTURE.md, REQUEST_TEMPLATE.md, design/
```

## 角色规则文件

各角色细则见 `.cursor/rules/`：`commander.mdc`、`pm.mdc`、`architect.mdc`、`designer.mdc`、`frontend.mdc`、`backend.mdc`、`qa.mdc`。

## 用户提交新需求

使用 [`docs/REQUEST_TEMPLATE.md`](docs/REQUEST_TEMPLATE.md) 填写后交给 **总指挥**。
