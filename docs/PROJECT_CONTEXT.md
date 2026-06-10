# 项目上下文

> 目的：以后处理任务时优先读取本文件，减少重复探索项目结构、技术栈和常用约定。

## 项目概览

本项目是一个前后端分离应用，包含事件管理、历史模块、家居产业/增值服务内容模块等页面。

- 前端目录：`frontend`
- 后端目录：`backend`
- 文档目录：`docs`
- 数据文件：`backend/data/events.db`
- 前端开发地址：`http://localhost:3000`
- 后端开发地址：`http://localhost:3001`

常用页面：

- 家居产业前台：`http://localhost:3000/homeIndustry`
- 家居产业后台：`http://localhost:3000/admin/cd`

## 技术栈

### 前端

- React 18
- Vite 5
- Ant Design 5
- React Router DOM 6
- Axios
- Vitest + Testing Library

### 后端

- Node.js
- Express 4
- sql.js（SQLite 文件持久化）
- Multer
- Vitest + Supertest

## 常用命令

前端：

```bash
cd frontend
npm test
npm run build
npm run dev
```

后端：

```bash
cd backend
npm test
npm start
npm run dev
```

根目录目前只有少量依赖，主要开发命令在 `frontend` 和 `backend` 内执行。

## 关键目录

```text
backend/
  app.js                         Express 应用配置
  server.js                      后端服务入口，默认 3001 端口
  db.js                          sql.js 数据库初始化与读写
  data/events.db                 SQLite 数据文件
  modules/historic/              历史模块后端
  modules/home-industry/         家居产业/增值服务模块后端
  tests/                         后端测试

frontend/
  src/api/                       前端 API 封装
  src/pages/admin/               后台管理页面
  src/pages/home-industry/       家居产业/增值服务前台页面
  src/pages/historic/            历史相关前台页面
  src/styles/                    样式文件
  src/tests/                     前端测试
  vite.config.js                 Vite 配置，含 /api 和 /uploads 代理
```

## 家居产业/增值服务模块重点

### 前端关键文件

- `frontend/src/api/homeIndustry.js`：模块 API 封装。
- `frontend/src/pages/admin/AdminHomeIndustryPage.jsx`：后台模块/树/编辑入口。
- `frontend/src/pages/admin/ContentEditor.jsx`：后台节点内容编辑器。
- `frontend/src/pages/admin/ExcelImportModal.jsx`：Excel 导入弹窗。
- `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx`：前台首页。
- `frontend/src/pages/home-industry/ModuleDetailPage.jsx`：前台模块详情和节点渲染。
- `frontend/src/utils/homeIndustryTree.js`：树结构工具。
- `frontend/src/styles/historic.css`：前台家居产业/历史相关样式复用较多。
- `frontend/src/styles/admin.css`：后台样式。

### 后端关键文件

- `backend/modules/home-industry/schema.js`：表结构。
- `backend/modules/home-industry/seed.js`：初始化数据。
- `backend/modules/home-industry/repository.js`：模块、树、节点、内容 CRUD。
- `backend/modules/home-industry/admin-routes.js`：后台接口。
- `backend/modules/home-industry/public-routes.js`：前台接口。
- `backend/modules/home-industry/import.js`：Excel 导入逻辑。

### 关键接口

前台：

- `GET /api/cd/public/modules`
- `GET /api/cd/public/modules/:code/tree`
- `GET /api/cd/public/nodes/:id`

后台：

- `GET /api/admin/cd/modules`
- `GET /api/admin/cd/modules/:moduleId/tree`
- `POST /api/admin/cd/nodes`
- `PUT /api/admin/cd/nodes/:id`
- `DELETE /api/admin/cd/nodes/:id`
- `PUT /api/admin/cd/contents/:nodeId`
- `POST /api/admin/cd/import`

## 内容节点数据兼容规则

家居产业/增值服务树节点目前需要兼容两种前端数据形态：

1. 嵌套内容：

```js
node.content = {
  content_type,
  summary,
  department,
  remark,
  link_url,
  link_label,
  link_target,
  body,
  fields
}
```

2. 扁平内容（`getTree` 接口常见）：

```js
node = {
  content_type,
  summary,
  department,
  remark,
  link_url,
  link_label,
  link_target,
  body,
  fields,
  children
}
```

注意：

- 修改 `ContentEditor.jsx` 或 `ModuleDetailPage.jsx` 时，不要只读取 `node.content`，要兼容扁平字段。
- 链接节点通常是 `content_type='link'` 且有 `link_url`，不要影响其现有展示和编辑逻辑。
- 存在历史/导入数据不一致情况：`content_type='info'` 但有 `body` 且 `fields` 为空。这类节点应按富文本正文兜底处理。
- 如果叶子节点标题和 `body` 完全重复，前台应避免把整段正文再次作为标题栏展示。
- `content_type='blocks'` 是新增的区块内容类型，`body` 存储 JSON 数组。编辑旧 `richtext`/`info` 内容时会自动转换为 `blocks` 格式。前台渲染时需处理 JSON 解析失败的降级情况。

## 最近重要改动记录

### 2026-06-08：按 2026.6.6 新版 Excel 标注替换部分服务内容

需求：`胶州市家居产业服务“一类事”线上框架 - 2026.6.6新版.xls` 中，背景色标黄/字体标红的位置为需要替换的最新内容；整体内容结构、展示风格和其它未标注内容保持不变。

处理：

- 已按最新 Excel 中黄色标注的内容列，定向更新 `backend/data/events.db` 中 35 处内容：
  - `industry_chain`（产业链服务）22 处；
  - `enterprise_support`（利企配套服务）13 处。
- 更新方式为“只替换现有节点内容”，不重新导入整表、不改变节点层级：
  - 产业链服务中的普通叶子节点更新 `richtext` 正文或链接 URL；
  - 利企配套服务中的字段拆分型服务继续保留字段拆分结构；
  - 利企配套服务仍按既有规则不展示/不恢复“提供部门”字段；
  - 衍生服务等普通富文本节点保持原有渲染风格，仅替换正文。
- 更新前数据库备份为 `backend/data/events.db.bak-20260608-233757-before-20260606-highlight-update`。

相关验证：

- 已脚本校验 35 处标注内容均写入当前数据库对应节点。

### 2026-06-08：修复产业简介专题页不显示后台正文

问题：`value_added?section=industry-intro` 使用静态展板专题模板后，只显示固定展板图片，没有渲染后台维护的“产业简介”正文。当前数据库中 `产业简介 -> 产业简介` 叶子节点存在 `body` 正文，但前台模板未读取。

处理：

- `ModuleDetailPage.jsx` 在产业简介静态展板模板中新增后台正文渲染区，保留原有左侧固定锚点和右侧静态展板图片，同时展示 `tree` 中筛选出的产业简介内容。
- 新增/更新专题模板回归测试，校验产业简介后台正文能在前台出现。

相关回归测试：

- `frontend/src/tests/module-detail-special-template.test.jsx`

### 2026-06-08：修复产业链上游衍生服务左侧菜单无子节点

问题：新版产业链数据中，`industry_chain?section=upstream` 下 `1.3衍生服务` 的直接子节点是 `leaf`。详情页左侧菜单原本只把分支型子节点作为第三级菜单项，导致右侧实际有服务卡片，但左侧展开“衍生服务”后没有子节点。

处理：

- `ModuleDetailPage.jsx` 调整左侧菜单构建规则：默认仍优先展示分支型子节点；当分类标题包含“衍生服务”且直接子节点为叶子节点时，兜底把这些叶子节点显示为左侧锚点。
- 新增回归测试覆盖上游衍生服务叶子子节点在左侧菜单中可见。

相关回归测试：

- `frontend/src/tests/module-detail-service-card.test.jsx`

### 2026-06-05：后台内容管理页面视觉升级

需求：后台功能暂时不变，但现有样式偏简陋，需要提升视觉质感和维护体验。

处理：

- `AdminHomeIndustryPage.jsx` 顶部操作区增加 `cd-admin-toolbar`，后台页面采用更统一的浅色卡片、圆角、阴影和蓝色主色风格。
- `admin.css` 美化后台整体背景、主卡片、工具栏、内容树、右侧编辑器、编辑器分区和专题素材说明卡；功能逻辑、接口和数据结构不变。
- 新增样式回归测试 `frontend/src/tests/admin-page-visual-css.test.js`，锁定关键后台视觉选择器，避免后续回退。

### 2026-06-05：后台内容同步到 2026.6.5 新版线上框架

需求：后台原始数据来自 `胶州市家居产业服务“一类事”线上框架.xls`，现在需改为 `胶州市家居产业服务“一类事”线上框架 - 2026.6.5新版.xls`，程序整体逻辑不变，做最小化必要修改。

处理：

- 已按新版 xls 替换 `backend/data/events.db` 中家居产业三大模块内容：
  - `industry_chain`：使用新版“板块二、产业链服务”，根节点为 `1.上游 原辅料采购、仓储`、`2.中游 生产制造`、`3.下游 销售出海`。
  - `enterprise_support`：使用新版“板块三、利企配套服务”，根节点为政策服务、法律服务、人才服务、金融服务、国际贸易服务、帮办服务、社会服务（企业）资源、衍生服务。
  - `value_added`：使用新版“首页展示”中的产业简介、招商宣传入口；产业简介/招商宣传前台仍按现有专题模板展示。
- 首页固定服务卡片保持“家居产业链服务”和“利企配套服务”两组；利企配套服务入口改为新版 8 类：政策服务、法律服务、人才服务、金融服务、国际贸易服务、社会服务（企业）资源、帮办服务、衍生服务。
- 首页 11 个服务入口使用各自独立图标，不再按模块共用同一图标；回归测试会校验首页服务卡片图标 `src` 不重复。
- 顶部导航按新版“首页展示”简化为：首页、产业简介、招商宣传。
- 后台模块 `value_added` 不再显示为旧“增值服务”，迁移/展示名称为“首页展示”；数据库初始化和启动迁移会把旧标题 `增值服务` 更新为 `首页展示`，但模块 code 仍保持 `value_added` 以兼容路由和接口。
- 后台编辑“首页展示”下的“产业简介/招商宣传”节点时，会在编辑器上方显示“前台专题模板说明”和当前静态图片/视频素材预览，提醒维护人员这些页面前台使用静态专题模板，素材目录分别为 `/home-industry/industry-intro/` 和 `/home-industry/investment-promo/`。
- “社会服务（企业）资源”下的代理记账、人力资源、施工企业清单附件继续指向现有 `/uploads/*.xlsx`；中介服务保留可点击链接 `点击访问山东政务服务中介超市`。
- 利企配套服务按用户要求不展示“提供部门”：新版导入后的 `enterprise_support` 数据已清理 `提供部门` 字段分支和普通正文中的 `提供部门：...` 段；前台字段拆分卡片也会兜底隐藏 `提供部门` 字段，避免历史数据再次显示。
- 后台 Excel 导入逻辑同步了利企配套服务兼容规则：`backend/modules/home-industry/import.js` 对 `enterprise_support`/“利企配套”模块导入正文时会移除 `提供部门：...` 段，并将“山东政务服务中介超市”链接统一识别为 `点击访问山东政务服务中介超市`。
- 字段拆分型信息卡仍只对已精确匹配的 17 个服务分类拆字段；新版衍生服务等其它结构化说明保留为普通富文本卡片，避免再次出现字段折叠条。
- 导入前数据库已备份为 `backend/data/events.db.bak-20260605-before-new-framework`。

相关验证：

- `frontend/src/tests/home-industry-home-layout.test.jsx`
- `frontend/src/tests/admin-home-industry-nav-settings.test.jsx`
- `backend/tests/home-industry-import.test.js`

### 2026-06-04：字段拆分型服务分类改为平铺信息卡展示

需求：增值服务中部分分类把“服务内容、服务地点/窗口、提供部门、办公时间、咨询电话、我要咨询/我要申报”等字段拆成多个可展开折叠条，视觉上类似一排排白色折叠卡；需要改成参考图的一张信息卡平铺展示方式。

处理：

- `ModuleDetailPage.jsx` 增加字段拆分型分类识别：只精确匹配当前排查出的 17 个服务分类标题；同时要求其直接子节点全部是字段类 branch，且数量不少于 3 个，避免误把其它正常业务层级改成平铺卡片。
- 命中后使用 `FieldBranchServiceCard` 渲染为单张信息卡：普通字段按两列/整行展示，“我要咨询/我要申报/线上申报”等动作字段渲染为按钮；`提供部门` 字段按用户要求兜底隐藏；不再把每个字段渲染成可展开折叠条。
- `buildLeftMenu` 同步跳过字段类子节点，避免左侧导航继续显示“服务内容、提供部门、咨询电话”等字段名。
- 仅影响精确匹配字段拆分型的服务分类；其它正常业务层级 branch 仍保持原折叠展示。
- `historic.css` 增加 `.hd-field-service-*` 样式，移动端自动改为单列。

已排查命中的 17 个服务分类：

- 政策服务：税务政策咨询、常见税务风险防范培训；工业技术改造等政策咨询。
- 法律服务：企业经营合规指导；跨境电商法律法规解读。
- 人才服务：家居类职业经理人、仓储运维等高端人才引进服务；电商直播、售后、行政等青年人才引进服务；家居行业线上消费节点（双11、618等）临时用工需求服务；人才安置、子女入学、医疗卫生等保障性服务；推动校企合作定向委培家居行业技能人才。
- 金融服务：上市辅导、普惠金融政策咨询服务；供应链金融服务（订单贷、仓单质押、智享家居贷等特色化产业投融资业务）。
- 帮办服务：重大项目“金牌团队”服务；营商企服“金牌团队”服务。
- 国际贸易服务：线上销售综合服务基地选品服务；跨境贸易综合服务；中欧班列提供特色化进出口货运服务；跨境信用互认。

相关回归测试：

- `frontend/src/tests/module-detail-field-branch-card.test.jsx`

### 2026-06-04：修复家居产业 Banner 异步加载闪错图并统一详情页标题

问题：家居产业首页/详情页支持后台 Banner 后，页面初始渲染会先显示 CSS 默认 Banner；接口返回后台配置后再切换为后台图，导致用户看到“先闪一下别的图再变正常图”。

处理：

- 新增 `frontend/src/constants/homeIndustry.js`，集中维护首页和详情页共用标题 `胶州市家居产业服务“一类事”`。
- `HomeIndustryHomePage.jsx` 增加 `homeBannerResolved` 状态，后台首页 Banner 配置未返回前添加 `.hd-page--banner-pending`，暂不显示 CSS 默认 Banner；配置返回后再显示后台图或默认图。
- `ModuleDetailPage.jsx` 的加载态添加 `.hd-detail-page--banner-pending`，详情 Banner URL 未解析前不显示 CSS 默认 Banner；详情页顶部标题由模块名（如“增值服务”）改为统一标题。
- `historic.css` 新增 `.hd-page--banner-pending` / `.hd-detail-page--banner-pending`，用于禁用待加载期间的默认背景图。

相关回归测试：

- `frontend/src/tests/home-industry-banner-pending.test.jsx`
- `frontend/src/tests/module-detail-banner-title.test.jsx`

### 2026-06-04：招商宣传专题改为视频置顶静态展板页

需求：`value_added?section=investment-promo` 的“招商宣传”专题参考“产业简介”的左侧锚点 + 右侧专题展板效果，但视频需要放在最上方，下面完整展示两张招商宣传展板。

处理：

- `ModuleDetailPage.jsx` 新增 `InvestmentPromoSpecialContent`：当访问 `/homeIndustry/value_added?section=investment-promo` 时，不再使用后台树节点正文渲染，而是展示静态专题模板。
- 招商宣传专题左侧锚点固定为“宣传视频、完善供应链、做强产业链”；右侧内容顺序为宣传视频播放器、完善供应链展板、做强产业链展板。
- 新增静态素材目录 `frontend/public/home-industry/investment-promo/`：
  - `promo-video.mp4`
  - `supply-chain.webp`
  - `strong-chain.webp`
- `historic.css` 增加招商宣传视频容器和专题封面样式，复用产业简介专题的白底左侧菜单、蓝色激活态和展板卡片视觉。
- 家居产业详情页内容区统一放大：`.hd-detail-content` 参考目标站左右布局调整为更宽的 `min(88vw, 1560px)`，专题展板图片和招商宣传视频容器改为使用右侧内容区域全宽，避免展板文字过小难以阅读。
- 不改数据库、后台编辑器和接口；后台导入/维护的旧“招商宣传”长正文在该静态专题页中不会展示。

相关回归测试：

- `frontend/src/tests/module-detail-special-template.test.jsx`
- `frontend/src/tests/module-detail-special-template-single-leaf.test.jsx`
- `frontend/src/tests/home-industry-detail-layout-css.test.js`

### 2026-06-03：首页顶部导航改为固定业务入口并支持详情分组过滤

需求：家居产业首页顶部导航参考设计稿，不再平铺后台模块；点击“招商入驻、项目服务、政策服务、法律服务、人才服务、金融服务、帮办服务、国际贸易服务、‘一件事’延链拓面”等入口时，详情页应以左侧导航栏 + 右侧卡片详情形式展示，且只展示所选业务分组内容。

处理：

- 新增 `frontend/src/utils/homeIndustryNavigation.js`：集中维护顶部固定导航项、跳转地址和 `section` 分组筛选规则。
- 顶部导航新增“产业简介、招商宣传、企业办证”三个固定入口，均跳转到 `value_added` 模块下对应 `section`：`industry-intro`、`investment-promo`、`enterprise-cert`；这三个入口匹配“招商入驻”顶层分组下的二级节点，避免点击后回退显示整棵树。
- `ModuleDetailPage.jsx` 对 `value_added?section=industry-intro` 和 `value_added?section=investment-promo` 启用特殊专题模板：左侧为当前专题内部锚点导航，右侧为专题内容分段展示；2026-06-04 起 `investment-promo` 已改为视频置顶静态展板页，具体规则见上方记录。
- 特殊专题模板的左侧锚点设置方式：`industry-intro` 目前使用固定静态锚点；早期数据驱动专题会根据后台内容树子节点生成锚点，如果只有一个叶子节点且标题是导入正文长文本，前台会自动使用父级标题作为锚点名称，避免左侧显示整段正文。
- 后台 `frontend/src/pages/admin/AdminHomeIndustryPage.jsx` 增加“导航菜单设置”，通过 `cd_setting.home_industry_nav_visibility` 保存各固定导航项显示/隐藏状态；前台 `HomeIndustryTopNav.jsx` 读取 public settings 后过滤隐藏项。未配置时默认全部显示。
- 2026-06-05 新版框架起，顶部导航只保留“首页、产业简介、招商宣传”；旧版“招商入驻、项目服务、政策服务、法律服务、人才服务、金融服务、帮办服务、国际贸易服务、‘一件事’延链拓面”等入口不再作为顶部导航展示。
- 顶部导航使用 `HomeIndustryTopNav.jsx` 共享组件，视觉为蓝色导航条内“线性小图标 + 文字”的入口样式，不使用白色边框按钮。
- 首页“家居产业链服务”卡片分别跳转 `industry_chain?section=upstream|midstream|downstream`，只展示上游/中游/下游对应树分组；2026-06-05 新版框架起，“利企配套服务”卡片跳转 `enterprise_support?section=policy|legal|talent|finance|trade|social-resource|assistance|derivative`，对应政策/法律/人才/金融/国际贸易/社会服务（企业）资源/帮办/衍生服务。
- `policy/legal/talent/finance/assistance/trade` 等 section key 同时兼容旧 `value_added` 过滤和新版 `enterprise_support` 过滤；`filterTreeByTopNavSection` 会按当前 `moduleCode` 选择对应规则，避免同名 key 覆盖。
- `filterTreeByTopNavSection` 只匹配模块树顶层节点标题，不递归匹配子节点，避免例如上游子节点文案含“上下游”时误把上游带入“下游”筛选结果。
- `HomeIndustryHomePage.jsx`：顶部导航改用固定业务入口；原首页分组服务卡片和 banner 逻辑保持不变。
- `ModuleDetailPage.jsx`：读取 URL query 中的 `section`，对模块树递归筛选，仅将匹配业务分组传给左侧导航和右侧内容区；补充 `IntersectionObserver` 不存在时的环境保护，避免测试环境报错。
- `historic.css`：顶部导航改为更紧凑的小按钮样式，适配参考图入口数量。

相关回归测试：

- `frontend/src/tests/home-industry-home-layout.test.jsx`
- `frontend/src/tests/module-detail-service-card.test.jsx`

### 2026-06-01：后台增加登录认证

需求：后台管理页面需要账号密码保护，防止未授权访问。

处理：

- 新建 `backend/auth.js`：使用 Node.js 内置 `crypto` 模块实现 SHA-256 密码哈希和随机 Token 生成。默认账号 `admin` / `admin123`，Token 存内存，24 小时有效。
- `backend/app.js`：新增 `POST /api/auth/login` 和 `GET /api/auth/me` 路由；`/api/admin/*` 路由加 `authMiddleware` 保护。
- 新建 `frontend/src/api/auth.js`：登录和验证 API 封装。
- 新建 `frontend/src/pages/admin/LoginPage.jsx`：深色科技感登录页，渐变光效背景，居中登录卡片。
- `frontend/src/App.jsx`：新增 `ProtectedRoute` 组件和 `/login` 路由，admin 路由用守卫包裹。
- `frontend/src/api/index.js`：axios 请求拦截器自动附加 Token，响应拦截器 401 时跳转登录页。
- `frontend/src/styles/admin.css`：新增登录页样式（`.login-page`、`.login-card`、光效动画）。
- 移除 `AdminHomeIndustryPage` 和 `AdminHistoricPage` 的统计摘要面板。
- 后端测试更新：admin 路由测试需先获取 Token。

### 2026-06-01：首页和详情页 Banner 支持后台更换

需求：首页和子页面的 banner 背景图需要支持从后台管理页面更换。

处理：

- `schema.js` 对 `cd_module` 表增加 `home_banner_url` 和 `detail_banner_url` 列（ALTER TABLE 迁移）。
- `admin-routes.js` PUT/POST modules 接口增加接收这两个字段。
- `AdminHomeIndustryPage.jsx` 增加"Banner设置"按钮，展开后可上传/更换首页和详情页 banner 图片，上传后自动保存。
- `HomeIndustryHomePage.jsx` 读取模块的 `home_banner_url` 作为 `.hd-page` 的内联背景样式，无设置时回退到 CSS 默认 `home_bg.png`。
- `ModuleDetailPage.jsx` 读取 `moduleInfo.detail_banner_url` 作为 `.hd-detail-page` 的内联背景样式，无设置时回退到 CSS 默认 `detail_bg.png`。

### 2026-06-01：新增区块化内容编辑器

需求：后台编辑器需要支持复杂内容编辑（多段文字、图片、视频、结构化信息组合），使发布内容能呈现丰富的页面效果。

处理：

- 新增 `content_type='blocks'`，区块数组以 JSON 存入 `body` 字段，不改数据库结构。
- `ContentEditor.jsx` 重写为区块编辑器，支持 text/image/video/info 四种区块类型，每种区块有独立编辑 UI。
- `ModuleDetailPage.jsx` 新增 `BlocksContent` 组件，解析 JSON 并渲染各类型区块，JSON 解析失败时降级为纯文本。
- `admin.css` 新增区块编辑器相关样式（.ce-section, .ce-block-item, .ce-block-toolbar 等）。
- `homeIndustry.js` 新增 `uploadCdImage` 函数，复用已有的 `POST /api/system/oss/upload` 接口。
- 旧 `richtext`/`info` 内容编辑时自动转换为 `blocks` 格式；旧 `link` 类型保持不变。
- `normalizeNodeContent` 和 `isBodyOnlyLeaf` 增加对 `blocks` 类型的兼容处理。

向后兼容：旧数据（richtext/info/link）前台渲染不受影响，编辑时自动转换。

### 2026-06-01：修复长文本叶子节点不可编辑/前台显示异常

问题：某些叶子节点（例如产业简介）数据为 `content_type='info'`，但实际正文在 `body` 中，且没有 `fields`。后台编辑器只显示结构化字段，不显示正文编辑框；前台把整段正文作为标题栏展示，显示异常。

处理：

- `ContentEditor.jsx` 增加内容归一化：有 `body`、无 `link_url`、非链接、无字段时按 `richtext` 兜底。
- `ModuleDetailPage.jsx` 增加相同归一化，并对“标题和正文重复”的叶子节点只展示正文区域。
- `historic.css` 增加独立正文区域样式。
- `admin.css` 限制后台编辑器头部长标题为单行省略。

相关回归测试：

- `frontend/src/tests/content-editor-body-fallback.test.jsx`
- `frontend/src/tests/module-detail-body-fallback.test.jsx`
- `frontend/src/tests/content-editor-link.test.jsx`
- `frontend/src/tests/module-detail-link.test.jsx`

验证命令：

```bash
cd frontend
npm test
npm run build
```

## 测试与验证习惯

- 修改前端页面/渲染逻辑后，优先补充或运行 `frontend/src/tests` 中相关测试。
- 修改家居产业内容渲染时，至少关注：
  - body fallback 测试；
  - link 节点测试；
  - `npm test`；
  - `npm run build`。
- 构建时可能出现 Vite chunk size warning，目前不代表构建失败。

## 已知注意事项

- `README.md` 当前存在中文编码显示异常，不建议把它作为唯一上下文来源。
- 工作区可能存在未提交改动，修改前先看 `git status --short`，避免覆盖无关文件。
- Windows 环境执行命令时优先使用 PowerShell。
- 前端 `vite.config.js` 已配置 `/api` 和 `/uploads` 代理到 `http://127.0.0.1:3001`。
