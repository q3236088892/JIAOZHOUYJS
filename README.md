# One Type Event 项目

## 项目概述

这是一个前后端分离的事件管理系统，后端使用 Express + SQLite，前端使用 React + Vite + Ant Design。

## 技术栈

### 后端 (backend)
- **运行时**: Node.js
- **框架**: Express 4.18
- **数据库**: SQLite (sql.js)
- **文件上传**: Multer
- **测试**: Vitest + Supertest

### 前端 (frontend)
- **框架**: React 18
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 5
- **路由**: React Router DOM 6
- **HTTP 客户端**: Axios
- **测试**: Vitest + Testing Library

## 项目结构

```
jiaozhou0526/
├── backend/                    # 后端服务
│   ├── server.js              # 服务入口，监听 3001 端口
│   ├── app.js                 # Express 应用配置
│   ├── db.js                  # 数据库操作
│   ├── modules/               # 功能模块
│   │   └── historic/         # 历史相关模块
│   ├── routes/                # 路由目录
│   ├── uploads/               # 上传文件存储
│   └── data/                  # 数据文件
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── App.jsx           # 主应用组件
│   │   ├── main.jsx          # 入口文件
│   │   ├── api/              # API 请求
│   │   ├── components/       # 组件
│   │   ├── pages/            # 页面
│   │   ├── styles/           # 样式
│   │   └── utils/            # 工具函数
│   ├── vite.config.js        # Vite 配置
│   └── index.html            # HTML 入口
└── docs/                      # 文档目录
```

## API 端点

### 事件管理 API
- `GET /api/events` - 获取所有事件
- `GET /api/events/:id` - 获取单个事件
- `POST /api/events` - 创建事件
- `PUT /api/events/:id` - 更新事件
- `DELETE /api/events/:id` - 删除事件

### 文件上传 API
- `POST /api/system/oss/upload` - 上传文件

### 历史模块 API
- `/api/historic/public` - 历史公开接口
- `/api/admin/historic` - 历史管理接口

## 启动服务

### 前置要求
- Node.js 18+
- npm 或 yarn

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 启动后端服务

```bash
cd backend

# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

后端服务将在 `http://localhost:3001` 启动。

### 3. 启动前端服务

```bash
cd frontend

# 开发模式
npm run dev
```

前端服务将在 `http://localhost:3000` 启动。

前端已配置代理，会自动将 `/api` 和 `/uploads` 请求转发到后端 `http://localhost:3001`。

## 关闭服务

### 方法一：使用 Ctrl+C
在运行服务的终端窗口中，按下 `Ctrl + C` 即可停止服务。

### 方法二：查找并终止进程

**Windows:**
```bash
# 查找占用 3001 端口的进程（后端）
netstat -ano | findstr :3001

# 查找占用 3000 端口的进程（前端）
netstat -ano | findstr :3000

# 终止进程（将 <PID> 替换为实际的进程 ID）
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# 查找并终止占用 3001 端口的进程
lsof -ti:3001 | xargs kill -9

# 查找并终止占用 3000 端口的进程
lsof -ti:3000 | xargs kill -9
```

## 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

## 环境配置

- 后端端口: 3001 (在 `backend/server.js` 中配置)
- 前端端口: 3000 (在 `frontend/vite.config.js` 中配置)
- 数据库: SQLite，数据存储在 `backend/data/` 目录
- 上传目录: `backend/uploads/`

## 开发建议

1. 使用 `npm run dev` 启动开发模式，后端支持文件监听自动重启
2. 前端修改会通过 Vite HMR 热更新，无需手动刷新
3. 确保后端先启动，前端的代理功能才能正常工作


http://localhost:3000/homeIndustry
http://localhost:3000/admin/cd
