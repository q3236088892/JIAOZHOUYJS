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

## 最近重要改动记录

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
