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
