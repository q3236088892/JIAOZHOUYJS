# CentOS + 宝塔半自动部署设计

## 背景

当前项目是前后端分离应用：

- 前端位于 `frontend/`，技术栈为 React + Vite，生产构建产物为 `frontend/dist/`。
- 后端位于 `backend/`，技术栈为 Express + sql.js/SQLite，启动入口为 `backend/server.js`，当前监听端口为 `3001`。
- 后端运行时数据位于 `backend/data/events.db`。
- 上传文件位于 `backend/uploads/`。
- 前端生产环境通过同源路径请求 `/api` 和 `/uploads`，需要由 Nginx 转发到后端。

用户服务器环境为 CentOS + 宝塔面板，希望提供部署手册，并提供一键运行脚本。用户选择的自动化边界是“半自动”：脚本负责项目部署和生成宝塔/Nginx 配置示例，但不直接修改宝塔站点配置。

## 目标

新增面向 CentOS + 宝塔面板的部署资料，使运维人员可以：

1. 按手册在宝塔中创建站点并配置网站目录。
2. 在服务器项目目录中执行一个脚本完成依赖安装、前端构建、后端 PM2 启动/重启。
3. 从脚本生成的 Nginx 示例文件中复制反向代理和 SPA 路由配置到宝塔站点配置。
4. 在后续更新时重复执行同一个脚本完成重新部署。

## 非目标

本次不做以下事项：

- 不安装宝塔面板。
- 不自动创建宝塔网站。
- 不直接写入或覆盖宝塔 Nginx 站点配置。
- 不自动申请或配置 SSL 证书。
- 不改造项目后端端口配置方式。
- 不改造当前后台鉴权逻辑。
- 不迁移数据库技术栈。

## 推荐方案

采用“半自动脚本 + 宝塔配置示例”。

### 方案职责边界

脚本负责：

- 检查当前运行目录是否为项目根目录。
- 检查 `frontend/package.json`、`backend/package.json` 是否存在。
- 检查 `node`、`npm` 是否可用。
- 检查或提示安装 `pm2`。
- 创建运行时目录：
  - `backend/data`
  - `backend/uploads`
  - `deploy-output`
- 安装前端依赖。
- 执行前端生产构建。
- 安装后端生产依赖。
- 使用 PM2 启动或重启后端服务。
- 保存 PM2 进程列表。
- 生成宝塔/Nginx 配置示例文件：`deploy-output/nginx-baota-site-example.conf`。
- 输出部署完成后的检查命令和宝塔配置提示。

宝塔面板负责：

- 新建网站。
- 绑定域名。
- 配置网站根目录为 `frontend/dist`。
- 粘贴脚本生成的 Nginx 配置片段。
- 配置 SSL。
- 控制防火墙和安全组。

## 文件设计

### `docs/deployment-centos-baota.md`

部署手册，面向最终部署人员。内容包含：

- 项目部署架构说明。
- 服务器要求。
- 宝塔准备事项。
- 项目上传方式。
- 第一次部署步骤。
- 一键脚本运行方式。
- 宝塔网站目录配置。
- 宝塔 Nginx 配置示例。
- PM2 常用命令。
- 数据库和上传文件备份说明。
- 后续更新流程。
- 常见问题排查。
- 安全提醒，尤其是 `/admin` 和 `/api/admin` 当前未做登录保护的风险。

### `scripts/deploy-centos-baota.sh`

半自动部署脚本，面向 CentOS/宝塔环境。脚本应满足：

- 可从项目根目录执行：

```bash
bash scripts/deploy-centos-baota.sh
```

- 使用严格模式：

```bash
set -Eeuo pipefail
```

- 默认变量：

```bash
APP_NAME="jiaozhou0526-backend"
BACKEND_PORT="3001"
BACKEND_HOST="127.0.0.1"
PROJECT_ROOT="$(pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
OUTPUT_DIR="$PROJECT_ROOT/deploy-output"
NGINX_EXAMPLE="$OUTPUT_DIR/nginx-baota-site-example.conf"
```

- 不删除 `backend/data/events.db`。
- 不删除 `backend/uploads/`。
- 如果 `pm2` 不存在，脚本提示执行：

```bash
npm install -g pm2
```

- PM2 启动逻辑：
  - 如果 `jiaozhou0526-backend` 已存在，则执行 `pm2 restart jiaozhou0526-backend --update-env`。
  - 如果不存在，则在 `backend` 目录执行 `pm2 start server.js --name jiaozhou0526-backend`。

- 生成的 Nginx 示例包含：
  - `/api/` 反向代理到 `http://127.0.0.1:3001`。
  - `/uploads/` 反向代理到 `http://127.0.0.1:3001`。
  - `/` 使用 `try_files $uri $uri/ /index.html;` 支持 React Router 刷新。
  - `client_max_body_size 50m;` 支持上传文件。

## Nginx 配置设计

脚本生成的示例应优先作为“宝塔站点配置中 server 块内的配置片段”使用，而不是完整覆盖整个站点配置。

核心配置片段：

```nginx
client_max_body_size 50m;

location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /uploads/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

## 数据保护设计

部署脚本必须避免破坏运行时数据：

- 不执行 `rm -rf backend/data`。
- 不执行 `rm -rf backend/uploads`。
- 不覆盖已有 `backend/data/events.db`。
- 只通过 `mkdir -p` 确保目录存在。

手册需要明确备份命令：

```bash
mkdir -p backups
cp -a backend/data "backups/data-$(date +%Y%m%d-%H%M%S)"
cp -a backend/uploads "backups/uploads-$(date +%Y%m%d-%H%M%S)"
```

## 验证设计

部署后建议执行：

```bash
pm2 status
pm2 logs jiaozhou0526-backend --lines 50
curl -I http://127.0.0.1:3001/api/events
```

宝塔/Nginx 配置后建议访问：

- `http://域名/`
- `http://域名/homeIndustry`
- `http://域名/admin/cd`
- `http://域名/api/events`

## 错误处理设计

脚本遇到关键失败时直接退出，包括：

- 不在项目根目录执行。
- 未安装 Node.js。
- 未安装 npm。
- 前端依赖安装失败。
- 前端构建失败。
- 后端依赖安装失败。
- PM2 启动/重启失败。

脚本对 PM2 不存在的情况给出明确安装提示并退出，不自动全局安装，避免权限问题和 npm 源问题。

## 安全提示

手册必须提示：当前项目的 `/admin`、`/admin/cd`、`/api/admin/*` 等后台页面和接口从代码层面看没有登录鉴权。公网部署前建议至少采取一种保护措施：

1. 在应用中增加登录鉴权。
2. 在宝塔/Nginx 中对 `/admin` 和 `/api/admin` 增加访问限制。
3. 限制后台路径只允许指定办公 IP 访问。

本次部署脚本不自动添加上述限制，因为不同项目现场的访问策略不同，自动写入可能导致正常访问受阻。
