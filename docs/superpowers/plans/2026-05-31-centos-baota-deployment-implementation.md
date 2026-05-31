# CentOS Baota Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CentOS + 宝塔 deployment manual and a semi-automatic deployment script that builds the frontend, installs backend production dependencies, manages the backend with PM2, and generates a Baota/Nginx configuration example.

**Architecture:** Keep deployment automation repository-local and non-invasive: the shell script runs from the project root and never modifies Baota/Nginx files directly. The documentation explains the Baota manual steps and references the generated config snippet.

**Tech Stack:** Bash, npm, Vite, Express, PM2, Nginx/宝塔.

---

## File Structure

Create or modify these files:

- Create: `scripts/deploy-centos-baota.sh`
  - Bash deployment script for CentOS + 宝塔.
  - Validates project layout and required commands.
  - Builds frontend, installs backend production dependencies, starts/restarts PM2 backend, generates `deploy-output/nginx-baota-site-example.conf`.
- Create: `docs/deployment-centos-baota.md`
  - Human-facing deployment manual for CentOS + 宝塔.
  - Includes first deployment, update deployment, Baota site setup, Nginx config snippet, backup, verification, troubleshooting, and security notes.
- Modify: `.gitignore`
  - Ignore `deploy-output/`, because the generated Nginx example is server/runtime output.

## Task 1: Ignore generated deployment output

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Inspect current ignore file**

Run:

```bash
cat .gitignore
```

Expected: existing ignore rules include dependencies, build outputs, logs, runtime data, and worktrees; `deploy-output/` is not present.

- [ ] **Step 2: Add deploy-output ignore rule**

Append this block to `.gitignore`:

```gitignore
# generated deployment artifacts
deploy-output/
```

- [ ] **Step 3: Verify ignore rule exists**

Run:

```bash
grep -n "deploy-output/" .gitignore
```

Expected output contains:

```text
deploy-output/
```

## Task 2: Create semi-automatic deployment script

**Files:**
- Create: `scripts/deploy-centos-baota.sh`

- [ ] **Step 1: Create scripts directory**

Run:

```bash
mkdir -p scripts
```

Expected: command exits successfully.

- [ ] **Step 2: Write deployment script**

Create `scripts/deploy-centos-baota.sh` with this exact content:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="${APP_NAME:-jiaozhou0526-backend}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
PROJECT_ROOT="$(pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
OUTPUT_DIR="$PROJECT_ROOT/deploy-output"
NGINX_EXAMPLE="$OUTPUT_DIR/nginx-baota-site-example.conf"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  printf '\n[ERROR] %s\n' "$*" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  local install_hint="$2"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "未找到命令：$command_name。请先执行：$install_hint"
  fi
}

ensure_project_root() {
  [[ -f "$FRONTEND_DIR/package.json" ]] || fail "未找到 frontend/package.json。请在项目根目录执行本脚本。"
  [[ -f "$BACKEND_DIR/package.json" ]] || fail "未找到 backend/package.json。请在项目根目录执行本脚本。"
  [[ -f "$BACKEND_DIR/server.js" ]] || fail "未找到 backend/server.js。请检查项目文件是否完整。"
}

install_dependencies() {
  log "安装前端依赖"
  cd "$FRONTEND_DIR"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  log "构建前端生产产物"
  npm run build

  log "安装后端生产依赖"
  cd "$BACKEND_DIR"
  if [[ -f package-lock.json ]]; then
    npm ci --omit=dev
  else
    npm install --omit=dev
  fi
}

ensure_runtime_dirs() {
  log "创建运行时目录"
  mkdir -p "$BACKEND_DIR/data" "$BACKEND_DIR/uploads" "$OUTPUT_DIR"
}

start_or_restart_pm2() {
  log "启动或重启 PM2 后端进程：$APP_NAME"
  cd "$BACKEND_DIR"

  if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    pm2 start server.js --name "$APP_NAME"
  fi

  pm2 save
}

generate_nginx_example() {
  log "生成宝塔/Nginx 配置示例：$NGINX_EXAMPLE"
  cat > "$NGINX_EXAMPLE" <<EOF
# 将以下配置复制到宝塔面板：网站 -> 设置 -> 配置文件
# 放在当前站点的 server { ... } 内，不要覆盖宝塔自动生成的整份配置。
# 网站根目录请在宝塔中设置为：$PROJECT_ROOT/frontend/dist

client_max_body_size 50m;

location /api/ {
    proxy_pass http://$BACKEND_HOST:$BACKEND_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}

location /uploads/ {
    proxy_pass http://$BACKEND_HOST:$BACKEND_PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
}

location / {
    try_files \$uri \$uri/ /index.html;
}
EOF
}

print_summary() {
  local node_version npm_version
  node_version="$(node -v)"
  npm_version="$(npm -v)"

  cat <<EOF

============================================================
部署脚本执行完成
============================================================

项目目录：$PROJECT_ROOT
Node.js：$node_version
npm：$npm_version
PM2 应用名：$APP_NAME
后端地址：http://$BACKEND_HOST:$BACKEND_PORT
前端目录：$PROJECT_ROOT/frontend/dist
Nginx 示例：$NGINX_EXAMPLE

请继续在宝塔面板中完成：
1. 网站目录设置为：$PROJECT_ROOT/frontend/dist
2. 将 Nginx 示例文件中的配置复制到当前站点 server 块内
3. 保存配置并重载 Nginx
4. 如有域名，请在宝塔中申请并启用 SSL

建议检查命令：
  pm2 status
  pm2 logs $APP_NAME --lines 50
  curl -I http://$BACKEND_HOST:$BACKEND_PORT/api/events

如果 curl 返回 200/404 以外结果，请先查看 PM2 日志。
============================================================
EOF
}

main() {
  log "开始部署 CentOS + 宝塔项目"
  ensure_project_root
  require_command node "请在宝塔软件商店安装 Node.js，或在服务器安装 Node.js 18+"
  require_command npm "请先安装 npm"
  require_command pm2 "npm install -g pm2"
  ensure_runtime_dirs
  install_dependencies
  start_or_restart_pm2
  generate_nginx_example
  print_summary
}

main "$@"
```

- [ ] **Step 3: Mark script executable on Unix-compatible systems**

Run:

```bash
chmod +x scripts/deploy-centos-baota.sh
```

Expected: command exits successfully.

- [ ] **Step 4: Run Bash syntax check**

Run:

```bash
bash -n scripts/deploy-centos-baota.sh
```

Expected: no output and exit code 0.

- [ ] **Step 5: Verify script contains data-safe directory creation**

Run:

```bash
grep -n "mkdir -p.*backend.*data" scripts/deploy-centos-baota.sh
grep -n "rm -rf" scripts/deploy-centos-baota.sh || true
```

Expected:

- First command finds `mkdir -p "$BACKEND_DIR/data" "$BACKEND_DIR/uploads" "$OUTPUT_DIR"`.
- Second command prints nothing.

## Task 3: Create deployment manual

**Files:**
- Create: `docs/deployment-centos-baota.md`

- [ ] **Step 1: Write manual**

Create `docs/deployment-centos-baota.md` with this exact content:

````markdown
# CentOS + 宝塔面板部署手册

本文档用于将本项目部署到 **CentOS + 宝塔面板** 服务器。

项目结构：

```text
jiaozhou0526/
├── frontend/        # React + Vite 前端
├── backend/         # Express 后端
├── scripts/         # 部署脚本
└── docs/            # 文档
```

部署后的访问链路：

```text
用户浏览器
  ↓
宝塔 Nginx 80/443
  ├─ frontend/dist 静态文件
  ├─ /api     -> http://127.0.0.1:3001
  └─ /uploads -> http://127.0.0.1:3001
```

## 1. 服务器要求

建议环境：

- CentOS 7/8/9 或兼容发行版
- 宝塔面板
- Nginx，由宝塔软件商店安装
- Node.js 18+，可由宝塔软件商店安装
- npm
- PM2

检查命令：

```bash
node -v
npm -v
pm2 -v
```

如果没有 PM2，执行：

```bash
npm install -g pm2
```

## 2. 上传项目

推荐目录：

```bash
/www/wwwroot/jiaozhou0526
```

如果使用 Git：

```bash
cd /www/wwwroot
git clone 你的仓库地址 jiaozhou0526
cd /www/wwwroot/jiaozhou0526
```

如果使用压缩包上传，请上传后解压到：

```text
/www/wwwroot/jiaozhou0526
```

不要上传 `node_modules`。

## 3. 首次部署

进入项目根目录：

```bash
cd /www/wwwroot/jiaozhou0526
```

执行部署脚本：

```bash
bash scripts/deploy-centos-baota.sh
```

脚本会自动完成：

- 安装前端依赖
- 构建前端 `frontend/dist`
- 安装后端生产依赖
- 创建 `backend/data` 和 `backend/uploads`
- 使用 PM2 启动或重启后端
- 生成宝塔/Nginx 配置示例

脚本生成的配置示例文件：

```text
deploy-output/nginx-baota-site-example.conf
```

## 4. 宝塔网站配置

### 4.1 新建网站

在宝塔面板中进入：

```text
网站 -> 添加站点
```

填写你的域名或服务器 IP。

### 4.2 设置网站目录

网站目录设置为：

```text
/www/wwwroot/jiaozhou0526/frontend/dist
```

不要设置为项目根目录。

### 4.3 配置 Nginx

进入：

```text
网站 -> 对应站点 -> 设置 -> 配置文件
```

将下面配置复制到当前站点的 `server { ... }` 内。

也可以直接复制脚本生成的文件：

```text
/www/wwwroot/jiaozhou0526/deploy-output/nginx-baota-site-example.conf
```

配置片段：

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

保存后，在宝塔中重载 Nginx。

## 5. 验证部署

检查后端进程：

```bash
pm2 status
pm2 logs jiaozhou0526-backend --lines 50
```

检查后端接口：

```bash
curl -I http://127.0.0.1:3001/api/events
```

浏览器访问：

```text
http://你的域名/
http://你的域名/homeIndustry
http://你的域名/admin/cd
http://你的域名/api/events
```

如果配置了 HTTPS，则访问：

```text
https://你的域名/
```

## 6. 后续更新部署

每次更新代码后执行：

```bash
cd /www/wwwroot/jiaozhou0526
git pull
bash scripts/deploy-centos-baota.sh
```

如果不是 Git 部署，上传覆盖代码后执行：

```bash
cd /www/wwwroot/jiaozhou0526
bash scripts/deploy-centos-baota.sh
```

脚本不会删除：

```text
backend/data/events.db
backend/uploads/
```

## 7. 数据和上传文件备份

数据库文件：

```text
backend/data/events.db
```

上传文件目录：

```text
backend/uploads/
```

建议更新前备份：

```bash
cd /www/wwwroot/jiaozhou0526
mkdir -p backups
cp -a backend/data "backups/data-$(date +%Y%m%d-%H%M%S)"
cp -a backend/uploads "backups/uploads-$(date +%Y%m%d-%H%M%S)"
```

## 8. PM2 常用命令

查看进程：

```bash
pm2 status
```

查看日志：

```bash
pm2 logs jiaozhou0526-backend --lines 100
```

重启后端：

```bash
pm2 restart jiaozhou0526-backend
```

停止后端：

```bash
pm2 stop jiaozhou0526-backend
```

设置开机自启：

```bash
pm2 startup
pm2 save
```

执行 `pm2 startup` 后，终端会输出一条 `sudo ...` 命令，请复制并执行。

## 9. 常见问题

### 9.1 访问页面 404

可能原因：宝塔网站目录没有指向 `frontend/dist`，或 Nginx 没有配置：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 9.2 接口 `/api/events` 访问失败

检查后端是否启动：

```bash
pm2 status
pm2 logs jiaozhou0526-backend --lines 50
curl -I http://127.0.0.1:3001/api/events
```

检查 Nginx 是否包含：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
}
```

### 9.3 上传文件失败

检查上传目录是否存在：

```bash
ls -ld backend/uploads
```

检查 Nginx 是否包含：

```nginx
client_max_body_size 50m;
```

### 9.4 `pm2: command not found`

安装 PM2：

```bash
npm install -g pm2
```

然后重新执行：

```bash
bash scripts/deploy-centos-baota.sh
```

### 9.5 前端构建失败

进入前端目录单独构建，查看详细报错：

```bash
cd /www/wwwroot/jiaozhou0526/frontend
npm ci
npm run build
```

### 9.6 后端端口被占用

检查端口：

```bash
lsof -i:3001
```

如果是旧后端进程，可以通过 PM2 重启：

```bash
pm2 restart jiaozhou0526-backend
```

## 10. 安全提醒

当前项目代码中，后台页面和后台接口从代码层面看没有登录鉴权，例如：

```text
/admin
/admin/cd
/api/admin/historic
/api/admin/cd
```

如果部署到公网，建议至少采取一种保护措施：

1. 在应用中增加登录鉴权。
2. 在宝塔/Nginx 中对 `/admin` 和 `/api/admin` 增加访问限制。
3. 限制后台路径只允许指定办公 IP 访问。

本部署脚本不会自动添加后台访问限制，避免误拦截正常访问。
````

- [ ] **Step 2: Verify manual references the generated script and config file**

Run:

```bash
grep -n "scripts/deploy-centos-baota.sh" docs/deployment-centos-baota.md
grep -n "nginx-baota-site-example.conf" docs/deployment-centos-baota.md
```

Expected: both commands find at least one line.

## Task 4: Verify generated artifacts locally

**Files:**
- `scripts/deploy-centos-baota.sh`
- `docs/deployment-centos-baota.md`
- `.gitignore`

- [ ] **Step 1: Check Bash syntax**

Run:

```bash
bash -n scripts/deploy-centos-baota.sh
```

Expected: no output and exit code 0.

- [ ] **Step 2: Build frontend to confirm the documented deployment command remains valid**

Run:

```bash
cd frontend
npm run build
cd ..
```

Expected: Vite build succeeds and writes `frontend/dist`.

- [ ] **Step 3: Run backend tests if dependencies are present**

Run:

```bash
cd backend
npm test
cd ..
```

Expected: backend tests pass. If tests fail, investigate before completion.

- [ ] **Step 4: Confirm git status only contains intended files**

Run:

```bash
git status --short
```

Expected intended tracked changes:

```text
 M .gitignore
?? docs/deployment-centos-baota.md
?? scripts/deploy-centos-baota.sh
```

`frontend/dist/` and `deploy-output/` should not appear because they are ignored.

## Task 5: Commit deployment manual and script

**Files:**
- `.gitignore`
- `docs/deployment-centos-baota.md`
- `scripts/deploy-centos-baota.sh`

- [ ] **Step 1: Stage files**

Run:

```bash
git add .gitignore docs/deployment-centos-baota.md scripts/deploy-centos-baota.sh
```

Expected: command exits successfully.

- [ ] **Step 2: Commit**

Run:

```bash
git commit -m "docs: 添加centos宝塔部署手册和脚本"
```

Expected: commit succeeds.

- [ ] **Step 3: Confirm clean status**

Run:

```bash
git status --short
```

Expected: no output.
