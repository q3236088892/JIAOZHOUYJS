# 历史城区“一类事”前台+后台（餐饮业态）设计文档

## 1. 背景与目标

### 1.1 背景
当前项目已有一套 `/events` 的通用事项管理页面（React + Ant Design + Express + SQL.js）。
用户希望新增并行模块，视觉和交互对齐青岛市参考页：
- 业态选择页：`/one_type_event/historicDistrict`
- 餐饮详情页：`/one_type_event/openRestaurant`（由业态页“我想开餐饮店”进入）

并明确要求：
1. 仅做到视觉和交互层面的复刻（不做后续申报流程闭环）
2. 链接点击可跳转，且新标签页打开
3. 同一项目双入口（前台 + `/admin` 后台）
4. 先做 PC 端
5. 不加登录
6. 全量可维护（导航、Banner、业态卡片、左侧目录、右侧折叠内容、链接等）
7. **左侧目录与右侧内容必须一致（同源数据驱动）**

### 1.2 建设目标
在不破坏现有 `/events` 的前提下，新增“历史城区文旅产业服务一类事”模块，先落地“我想开餐饮店”整套体验，并通过后台实现内容动态维护，为后续其它业态复用同一套模板。

---

## 2. 范围与非目标

### 2.1 本期范围（P1）
1. 前台：
   - `/historicDistrict`（业态选择页）
   - `/historicDistrict/openRestaurant`（餐饮详情页）
2. 后台：
   - `/admin` 内容管理入口（无鉴权）
   - 支持全量内容增删改查与排序
3. 数据：
   - 基于现有 SQL.js（`backend/data/events.db`）扩展表结构
4. 交互：
   - 左侧目录锚点滚动
   - 右侧折叠展开
   - 外链新开标签页

### 2.2 非目标（本期不做）
1. 不实现“我要申报”业务闭环（仅链接跳转）
2. 不实现后台登录与权限系统
3. 不做移动端适配
4. 不替换/删除已有 `/events` 功能

---

## 3. 总体方案（最终采纳）

采用 **方案 A（并行新增模块）**：
- 保留原 `/events` 全部能力
- 新增 `/historicDistrict` 与 `/admin` 路由域
- 新增一套“历史城区内容模型”
- 前台完全由后台数据驱动

该方案风险最小、可回退、对现有系统影响最小，符合“最稳妥”目标。

---

## 4. 信息架构

### 4.1 前台路由
1. `/historicDistrict`
   - 顶部导航
   - 大图 Banner + 标题
   - “选择您想了解和从事的业态”卡片区
   - “利企便民服务”卡片区
2. `/historicDistrict/openRestaurant`
   - 顶部导航
   - Banner 区
   - 左侧目录（阶段 -> 类别标签 -> 条目）
   - 右侧分阶段内容区（折叠卡片 + 描述 + 链接/信息区）

### 4.2 后台路由
`/admin` 下按模块划分：
1. 站点设置（Banner、背景、页标题）
2. 顶部导航管理
3. 业态卡片管理
4. 利企便民卡片管理
5. 餐饮详情页结构管理
   - 阶段管理
   - 类别管理
   - 事项卡片管理
   - 链接条目管理
   - 信息字段管理

---

## 5. 数据模型设计（SQL.js）

> 说明：保留原 `events` 表不动；新增前缀 `hd_`（historic district）表。

### 5.1 页面与通用配置

#### `hd_page`
- `id` INTEGER PK
- `page_key` TEXT UNIQUE NOT NULL （如：`historic_home`、`open_restaurant`）
- `title` TEXT NOT NULL
- `hero_title` TEXT
- `hero_bg_url` TEXT
- `body_bg_url` TEXT
- `left_header_image_url` TEXT
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

用途：管理页面级视觉要素与标题。

### 5.2 顶部导航

#### `hd_nav_item`
- `id` INTEGER PK
- `title` TEXT NOT NULL
- `icon_url` TEXT
- `link_type` TEXT NOT NULL（`internal`/`external`）
- `link_target` TEXT NOT NULL
- `open_mode` TEXT NOT NULL DEFAULT `_self`
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

> 注：前台固定将业务条目外链使用 `_blank`；顶部导航保留可配打开方式。

### 5.3 业态与首页卡片

#### `hd_industry`
- `id` INTEGER PK
- `slug` TEXT UNIQUE NOT NULL（如：`openRestaurant`）
- `name` TEXT NOT NULL
- `icon_url` TEXT
- `route_path` TEXT NOT NULL（如：`/historicDistrict/openRestaurant`）
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

#### `hd_home_service`
- `id` INTEGER PK
- `name` TEXT NOT NULL
- `icon_url` TEXT
- `link_type` TEXT NOT NULL（`internal`/`external`）
- `link_target` TEXT NOT NULL
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

### 5.4 餐饮详情页结构（核心）

#### `hd_stage`
- `id` INTEGER PK
- `industry_id` INTEGER NOT NULL
- `stage_key` TEXT NOT NULL（如：`prepare`、`develop`、`exit`）
- `stage_title` TEXT NOT NULL（如：`筹备开办阶段`）
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

#### `hd_stage_category`
- `id` INTEGER PK
- `stage_id` INTEGER NOT NULL
- `category_key` TEXT NOT NULL（如：`basic_service`）
- `category_title` TEXT NOT NULL（如：`基本政务服务`）
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

#### `hd_topic`
- `id` INTEGER PK
- `category_id` INTEGER NOT NULL
- `topic_key` TEXT NOT NULL
- `anchor_key` TEXT UNIQUE NOT NULL（如：`guide-basic-1`）
- `title` TEXT NOT NULL
- `description` TEXT
- `content_mode` TEXT NOT NULL DEFAULT `links`
  - `links`：仅展示链接条目
  - `info_apply`：展示信息字段 + “我要申报”按钮
  - `mixed`：混合
- `apply_button_text` TEXT DEFAULT `我要申报`
- `apply_link_type` TEXT DEFAULT `internal`（`internal`/`external`/`none`）
- `apply_link_target` TEXT
- `default_expanded` INTEGER DEFAULT 0
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

#### `hd_topic_link`
- `id` INTEGER PK
- `topic_id` INTEGER NOT NULL
- `label` TEXT NOT NULL
- `url` TEXT NOT NULL
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

#### `hd_topic_info_field`
- `id` INTEGER PK
- `topic_id` INTEGER NOT NULL
- `group_key` TEXT DEFAULT `base`
- `group_title` TEXT
- `field_label` TEXT NOT NULL（如：`服务类型`）
- `field_value` TEXT NOT NULL
- `field_type` TEXT DEFAULT `text`（`text`/`link`）
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` / `updated_at`

---

## 6. 左右一致性设计（强约束）

### 6.1 核心原则
- **不建立“左侧目录专用表”**
- 左侧目录由 `stage -> category -> topic` 运行时派生
- 右侧内容与左侧使用同一 `topic` 数据集合与同一排序字段

### 6.2 服务端组装协议
`GET /api/historic/public/industry/:slug/detail` 返回：
- `stages[]`
  - `categories[]`
    - `topics[]`（含 anchor、title、description、links、infoFields、apply）
- `leftMenu` 不单独查表，而是由 `stages` 在服务端派生（或前端由 `stages`直接派生）

### 6.3 一致性校验
新增轻量校验逻辑：
- 返回 `content_version`（`updated_at` 聚合哈希）
- 后台提交后刷新前台数据版本
- 若左侧/右侧渲染来源非同一版本，前端拒绝渲染并提示重试（防止并发编辑脏读）

---

## 7. API 设计

### 7.1 前台公开接口
1. `GET /api/historic/public/home`
   - 首页 Banner、导航、业态卡片、利企便民卡片
2. `GET /api/historic/public/industry/:slug/detail`
   - 详情页完整结构（阶段、类别、事项、链接、信息字段）

### 7.2 后台管理接口（示例）
1. 页面配置
   - `GET/PUT /api/admin/historic/pages/:pageKey`
2. 导航管理
   - `GET/POST /api/admin/historic/nav-items`
   - `PUT/DELETE /api/admin/historic/nav-items/:id`
3. 业态卡片管理
   - `GET/POST /api/admin/historic/industries`
   - `PUT/DELETE /api/admin/historic/industries/:id`
4. 利企便民卡片管理
   - `GET/POST /api/admin/historic/home-services`
   - `PUT/DELETE /api/admin/historic/home-services/:id`
5. 详情页结构管理
   - `GET/POST /api/admin/historic/stages`
   - `GET/POST /api/admin/historic/categories`
   - `GET/POST /api/admin/historic/topics`
   - `GET/POST /api/admin/historic/topic-links`
   - `GET/POST /api/admin/historic/topic-info-fields`
   - 各资源 `PUT/DELETE /:id`

### 7.3 统一约定
- 继续沿用 `{ code, data, msg }` 响应结构
- 所有排序字段为整数，后台支持上移/下移
- 所有外链字段后端做 URL 基础校验

---

## 8. 前端设计（React）

### 8.1 路由（并行新增）
- 继续保留：`/events` 相关路由
- 新增：
  - `/historicDistrict`
  - `/historicDistrict/openRestaurant`
  - `/admin`

### 8.2 页面组件拆分建议
1. 公共组件
   - `HistoricTopNav`
   - `HistoricHero`
   - `AccordionTopicCard`
2. 前台页面
   - `HistoricHomePage`
   - `HistoricIndustryDetailPage`
3. 后台页面
   - `AdminLayout`
   - `AdminNavManager`
   - `AdminHomeManager`
   - `AdminDetailStructureManager`

### 8.3 关键交互
- 左侧目录点击：平滑滚动到 `anchor_key`
- 右侧折叠：点击标题展开/收起
- 链接跳转：统一 `target="_blank" rel="noopener noreferrer"`
- PC 优先：1920 视觉优先，内容区宽度与参考站点比例对齐

---

## 9. 后端设计（Express + SQL.js）

1. 在 `db.js` 中新增 `hd_*` 表初始化与 seed
2. 新建 `backend/modules/historic/` 目录，按领域拆分：
   - `queries.js`（SQL 与装配）
   - `public-routes.js`
   - `admin-routes.js`
   - `validators.js`
3. 在 `server.js` 挂载：
   - `/api/historic/public/*`
   - `/api/admin/historic/*`

并保证每次写操作后调用现有 `saveDb()` 持久化。

---

## 10. Seed 初始化策略（首屏可用）

首版写入“我想开餐饮店”默认数据：
1. 顶部导航（首页/历史城区简介/招商入驻/文旅资讯）
2. 首页 6 个业态卡片 + 5 个利企便民服务卡片
3. 餐饮详情页 3 大阶段、子类标签、事项卡片
4. 至少覆盖红框级条目（如“食品小作坊登记”等）并可新标签跳转

后续其它业态仅需后台录入，无需改代码。

---

## 11. 验收标准（DoD）

1. 访问 `/historicDistrict` 视觉结构、主色、卡片布局与参考页同风格
2. 点击“我想开餐饮店”进入 `/historicDistrict/openRestaurant`
3. 左侧目录与右侧内容条目**完全同序、同名、同源**
4. 右侧条目可折叠/展开
5. 链接条目均新标签页打开
6. 后台可维护：导航、Banner、业态卡片、详情结构与链接
7. 后台修改后前台刷新可见
8. 旧 `/events` 页面可正常访问

---

## 12. 风险与控制

1. **风险：样式还原度不足**
   - 控制：先搭结构再细化 CSS token（间距、圆角、阴影、渐变）
2. **风险：目录与内容不一致**
   - 控制：禁止独立目录表，统一数据源派生
3. **风险：后台误操作导致内容断层**
   - 控制：新增必填校验、删除二次确认、软禁用（`is_active`）

---

## 13. 实施顺序建议

1. 数据层：`hd_*` 表 + seed
2. 后端：public/admin API
3. 前台：`/historicDistrict` + `/historicDistrict/openRestaurant`
4. 后台：`/admin` 管理页面
5. 联调与验收

---

## 14. 参考来源（用于视觉与结构对齐）

1. 参考站入口：
   - http://qdsxzspfwj.qingdao.gov.cn/one_type_event/historicDistrict
2. 业态首页脚本（用于提取首页结构与卡片文案）
   - http://qdsxzspfwj.qingdao.gov.cn/one_type_event/assets/index.2d50826c.js
3. 业态首页样式（用于提取布局参数）
   - http://qdsxzspfwj.qingdao.gov.cn/one_type_event/assets/index.32068369.css
4. 餐饮详情脚本（用于提取左侧目录与右侧分组结构）
   - http://qdsxzspfwj.qingdao.gov.cn/one_type_event/assets/index.0ae0b4de.js
5. 详情公共样式（用于折叠卡、信息框、导航样式）
   - http://qdsxzspfwj.qingdao.gov.cn/one_type_event/assets/common-pages.bd9a6a24.css
6. 顶部导航样式
   - http://qdsxzspfwj.qingdao.gov.cn/one_type_event/assets/index.cfa382ed.css

> 说明：本项目仅做视觉与交互借鉴，不复制对方后端业务流程。
