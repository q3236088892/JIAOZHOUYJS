# CentOS 7.6 部署问题记录与处理手册

本文档记录本项目在 CentOS 7.6 服务器部署过程中遇到的问题、原因和处理方式。

当前服务器环境特点：

- 系统：CentOS 7.6 / CentOS 7.x
- 系统 glibc：通常为 `2.17`
- 项目要求：Node.js 18+、npm、前端 Vite、后端 Express

> 注意：CentOS 7.x 系统较老，不能直接安装很多新版 Node.js RPM 包。

---

## 1. 问题：`npm: command not found`

### 现象

在前端目录执行：

```bash
npm run dev
```

报错：

```bash
-bash: npm: command not found
```

### 原因

服务器没有安装 Node.js/npm，或者安装后 `node`、`npm` 不在 `PATH` 中。

### 检查命令

```bash
node -v
npm -v
which node
which npm
```

如果都找不到，需要安装 Node.js。

---

## 2. 问题：CentOS 7.6 安装 NodeSource Node.js 18 失败

### 现象

执行 NodeSource 安装 Node.js 18 后，`yum install nodejs` 报错：

```text
Requires: libc.so.6(GLIBC_2.28)(64bit)
Requires: libm.so.6(GLIBC_2.27)(64bit)
Requires: glibc >= 2.28
Installed: glibc-2.17
```

### 原因

CentOS 7.x 默认 glibc 是 `2.17`，而 NodeSource 的 Node.js 18 RPM 包需要 `glibc >= 2.28`。

### 重要提醒

不要为了安装 Node.js 去升级系统 glibc。

升级 glibc 可能导致系统命令、SSH、yum 等基础功能异常，风险很高。

### 推荐处理方式

使用适配 glibc 2.17 的 Node.js 非官方构建包：

```bash
cd /usr/local

yum install -y wget xz tar

wget https://unofficial-builds.nodejs.org/download/release/v18.20.8/node-v18.20.8-linux-x64-glibc-217.tar.xz

tar -xf node-v18.20.8-linux-x64-glibc-217.tar.xz

mv node-v18.20.8-linux-x64-glibc-217 node-v18.20.8

ln -sf /usr/local/node-v18.20.8/bin/node /usr/local/bin/node
ln -sf /usr/local/node-v18.20.8/bin/npm /usr/local/bin/npm
ln -sf /usr/local/node-v18.20.8/bin/npx /usr/local/bin/npx

hash -r

node -v
npm -v
```

正常应输出类似：

```text
v18.20.8
```

---

## 3. 问题：解压 Node 后仍然 `node: command not found`

### 现象

执行过软链接命令后：

```bash
node -v
```

仍然报错：

```bash
-bash: node: command not found
```

### 原因

常见原因是 Node 解压目录和软链接目录不一致。

例如实际解压在：

```text
/root/node-v18.20.8
```

但软链接指向：

```text
/usr/local/node-v18.20.8/bin/node
```

这样 `/usr/local/bin/node` 会指向一个不存在的文件。

### 修复方式

如果 Node 解压在 `/root/node-v18.20.8`，执行：

```bash
mv /root/node-v18.20.8 /usr/local/node-v18.20.8

ln -sf /usr/local/node-v18.20.8/bin/node /usr/local/bin/node
ln -sf /usr/local/node-v18.20.8/bin/npm /usr/local/bin/npm
ln -sf /usr/local/node-v18.20.8/bin/npx /usr/local/bin/npx

hash -r

node -v
npm -v
```

如果仍然找不到，检查：

```bash
echo $PATH
ls -l /usr/local/bin/node
ls -l /usr/local/node-v18.20.8/bin/node
```

如果 `/usr/local/bin` 不在 `PATH` 中，执行：

```bash
export PATH=/usr/local/bin:$PATH
echo 'export PATH=/usr/local/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

node -v
npm -v
```

---

## 4. 问题：`vite: Permission denied`

### 现象

在前端目录执行：

```bash
npm run dev -- --host 0.0.0.0
```

报错：

```bash
sh: /root/jiaozhou/frontend/node_modules/.bin/vite: Permission denied
```

### 原因

`node_modules/.bin/vite` 没有执行权限。

常见原因：

1. 从 Windows 或其他环境把 `node_modules` 一起上传到了 Linux；
2. 压缩、解压或传输过程中权限丢失；
3. 服务器上的依赖不是在当前 Linux 环境重新安装的。

### 推荐处理方式

不要复用本地上传的 `node_modules`，在服务器重新安装依赖。

前端执行：

```bash
cd /root/jiaozhou/frontend

rm -rf node_modules
npm install

npm run dev -- --host 0.0.0.0
```

如果仍然报权限问题，再执行：

```bash
cd /root/jiaozhou/frontend
chmod -R u+x node_modules/.bin
npm run dev -- --host 0.0.0.0
```

后端也建议重新安装依赖：

```bash
cd /root/jiaozhou/backend

rm -rf node_modules
npm install

npm start
```

---

## 5. 临时运行方式

这种方式适合先确认项目能跑起来，不适合作为正式生产部署。

### 启动后端

打开一个终端：

```bash
cd /root/jiaozhou/backend
npm install
npm start
```

后端默认监听：

```text
http://localhost:3001
```

### 启动前端

打开另一个终端：

```bash
cd /root/jiaozhou/frontend
npm install
npm run dev -- --host 0.0.0.0
```

前端默认监听：

```text
http://服务器IP:3000
```

### 需要开放端口

临时运行时需要开放：

```text
3000
3001
```

如果是云服务器，还需要在云厂商安全组中放行对应端口。

CentOS firewalld 示例：

```bash
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

---

## 6. 正式部署

### 架构概览

| 层 | 用途 | 端口 |
|---|---|---|
| Nginx | 前端静态文件服务 + API 反向代理 | 80 / 443 |
| PM2 | 后端进程管理（自动重启、日志、开机自启） | 3001 |
| 前端构建产物 | 纯静态文件，由 Nginx 直接 serve | - |
| 后端 Express | REST API + 文件上传 | 3001 |

> **不要用 `npm run dev` 作为生产运行方式**。dev 模式有 Vite 实时编译开销，首次访问极慢。

### 6.1 构建前端

```bash
cd /root/jiaozhou/frontend
npm install
npm run build
```

构建产物在 `frontend/dist/`，包含压缩后的 HTML/CSS/JS。

### 6.2 用 PM2 启动后端

```bash
# 安装 PM2
npm install -g pm2
ln -sf /usr/local/node-v18.20.8/bin/pm2 /usr/local/bin/pm2

# 启动后端
cd /root/jiaozhou/backend
npm install
pm2 start server.js --name jiaozhou-backend

# 开机自启
pm2 save
pm2 startup
```

常用命令：

```bash
pm2 status                    # 查看进程状态
pm2 logs jiaozhou-backend --lines 50   # 查看最近50行日志
pm2 restart jiaozhou-backend           # 重启
pm2 stop jiaozhou-backend              # 停止
pm2 delete jiaozhou-backend            # 删除
```

### 6.3 Nginx 配置

创建配置文件 `/etc/nginx/conf.d/jiaozhou.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 改成你的域名或服务器IP

    # 前端静态文件（由 Vite build 生成）
    location / {
        root /root/jiaozhou/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理到后端
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 上传文件代理
    location /uploads {
        proxy_pass http://127.0.0.1:3001;
    }
}
```

检查并重载配置：

```bash
nginx -t          # 检查语法
nginx -s reload   # 重载生效
```

如果是云服务器，还需要同时在云厂商控制台的安全组中放行 80 端口。

### 6.4 启动服务并保持后台运行

部署完成后，整个系统的运行只依赖两个后台进程：**Nginx** 和 **PM2 托管的后端**。两者都是 daemon（守护进程），关闭 SSH/终端后不会停止。

```bash
# 一次性启动所有服务
systemctl start nginx              # 启动 Nginx（系统服务）
pm2 start server.js --name jiaozhou-backend   # 启动后端（PM2 守护）

# 查看是否在运行
systemctl status nginx
pm2 status
```

设置开机自启（服务器重启后自动拉起）：

```bash
systemctl enable nginx
pm2 save
pm2 startup
```

之后：

- **关闭 SSH 窗口** → 进程继续在后台运行，不受影响
- **服务器重启** → Nginx 和 PM2 自动拉起
- **代码更新** → `pm2 restart jiaozhou-backend` 重新加载后端；前端只需重新 `npm run build`

> 生产模式没有"前端进程"这一说。`npm run build` 出来的 `dist/` 目录是纯静态文件，Nginx 直接读硬盘 serve，关闭终端完全不影响。

---

### 6.5 不使用 Nginx 的部署方式（单端口直连）

如果不方便装 Nginx，可以让 Express 后端**同时** serve 前端静态文件。这样只需要一个端口（默认 3001），前端用 `http://服务器IP:3001` 即可访问。

#### 6.5.1 改造后端

在 `backend/app.js` 的路由注册之后、`return app` 之前，加上静态文件托管和 SPA fallback：

```js
// 文件末尾，return app 之前
const distDir = path.join(__dirname, '..', 'frontend', 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}
```

> `/api` 和 `/uploads` 路由已经在前面注册过，Express 会优先匹配它们，剩下的 `*` 兜底返回 `index.html`，保证 React Router 的 SPA 路由能正常刷新。

#### 6.5.2 构建并启动

```bash
# 1. 构建前端
cd /root/jiaozhou/frontend
npm install
npm run build

# 2. 启动后端（PM2 守护）
cd /root/jiaozhou/backend
npm install
pm2 start server.js --name jiaozhou-backend
pm2 save
pm2 startup
```

#### 6.5.3 开放端口

```bash
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

如果是云服务器，还需在云厂商安全组放行 3001。

#### 6.5.4 访问

```text
http://服务器IP:3001              # 前端
http://服务器IP:3001/api/...      # API
http://服务器IP:3001/uploads/...  # 上传文件
```

#### 6.5.5 vs Nginx 方案对比

| | 单端口直连 | Nginx + PM2 |
|---|---|---|
| 进程数 | 1（PM2 后端） | 2（Nginx + PM2 后端） |
| 端口 | 3001 | 80/443 + 3001（仅本机） |
| HTTPS | 需另加证书到 Express | Nginx 一行配置 |
| 性能 | 单点 | 静态文件经 Nginx 直出更快 |
| 适合场景 | 临时/小流量/不想配 Nginx | 正式生产 |

---

### 6.6 启用 HTTPS（可选）

安装 Certbot 获取免费证书：

```bash
yum install -y epel-release
yum install -y certbot python-certbot-nginx
certbot --nginx -d your-domain.com
```

Certbot 会自动修改 Nginx 配置并启用 HTTPS。

### 6.7 完整部署流程（从零开始）

```bash
# 1. 安装 Node.js（如尚未安装）
# （见本文档第2节）

# 2. 拉取/上传代码到服务器
# /root/jiaozhou/

# 3. 构建前端
cd /root/jiaozhou/frontend
npm install
npm run build

# 4. 安装并启动后端
npm install -g pm2
cd /root/jiaozhou/backend
npm install
pm2 start server.js --name jiaozhou-backend
pm2 save
pm2 startup

# 5. 配置 Nginx（如果走单端口方案，此步可跳过，见 6.5）
# （见本节 6.3）
nginx -t && nginx -s reload

# 6. 开放端口
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload
```

### 6.8 生产模式 vs 开发模式对比

| | 开发模式 `npm run dev` | 生产模式 `build + PM2 + Nginx` |
|---|---|---|
| 首次访问速度 | 慢（Vite 实时编译） | 快（静态文件直出） |
| 后端进程 | `node --watch` 有文件监听开销 | PM2 直接运行，无额外开销 |
| 进程管理 | 无 | PM2 自动重启崩溃进程 |
| 日志 | 散落在终端 | `pm2 logs` 统一查看 |
| 端口 | 前端 3000 + 后端 3001，暴露多个端口 | 统一 80/443 |
| 开机自启 | 无 | PM2 startup |

### 6.9 快速回滚/更新

代码更新后重新部署：

```bash
# 前端更新
cd /root/jiaozhou/frontend
git pull
npm run build

# 后端更新
cd /root/jiaozhou/backend
git pull
pm2 restart jiaozhou-backend
```

---

## 7. 本次问题总结

本次部署过程中依次遇到的问题：

1. `npm: command not found`
   - 服务器未安装 Node.js/npm。
2. NodeSource Node.js 18 安装失败
   - CentOS 7.6 的 glibc 版本太低，不能直接安装该 RPM 包。
3. `node: command not found`
   - Node 解压目录和软链接目录不一致。
4. `vite: Permission denied`
   - `node_modules` 权限不正确，通常是上传了本地依赖或权限丢失。
5. `pm2: command not found`
   - 手动安装的 Node.js 没把 PM2 软链接到 `/usr/local/bin/`。

最终推荐路线：

```text
CentOS 7.6 不升级 glibc
→ 安装 Node.js glibc-217 构建包
→ 服务器重新 npm install
→ 临时用 npm run dev 测试
→ 正式部署：npm run build + 后端改 app.js 同时 serve 前端 + PM2 守护（单端口）
→ 或正式部署：npm run build + PM2 + Nginx（多端口）
```

---

## 8. 问题：`pm2: command not found`

### 现象

执行：

```bash
pm2 start server.js --name jiaozhou-backend
```

报错：

```bash
-bash: pm2: command not found
```

### 原因

按本文档第 2 节手动安装的 Node.js 位于 `/usr/local/node-v18.20.8`，并把 `node`、`npm`、`npx` 软链接到了 `/usr/local/bin/`，但 `npm install -g pm2` 装出来的 `pm2` 二进制**没有做软链接**，所以 `pm2` 命令找不到。

### 修复

**情况 1：之前没装过 PM2**

```bash
npm install -g pm2
ln -sf /usr/local/node-v18.20.8/bin/pm2 /usr/local/bin/pm2
hash -r
pm2 -v
```

**情况 2：装过 PM2 但链接缺失（最常见）**

```bash
ls /usr/local/node-v18.20.8/bin/   # 看看有没有 pm2
ln -sf /usr/local/node-v18.20.8/bin/pm2 /usr/local/bin/pm2
hash -r
pm2 -v
```

如果还报 `not found`，检查 `PATH`：

```bash
echo $PATH
ls -l /usr/local/bin/pm2
ls -l /usr/local/node-v18.20.8/bin/pm2
```

确认 `/usr/local/bin` 在 `PATH` 中，必要时追加到 `~/.bashrc`：

```bash
export PATH=/usr/local/bin:$PATH
source ~/.bashrc
```

### 启动后端（PM2 常用命令）

```bash
# 进入后端目录
cd /root/jiaozhou/backend

# 首次启动
pm2 start server.js --name jiaozhou-backend

# 设置开机自启（必须执行，否则服务器重启后进程不会拉起）
pm2 save
pm2 startup
# pm2 startup 会输出一行命令（带 sudo/env 路径），把那行复制执行一次
```

**日常运维命令：**

```bash
pm2 status                          # 查看所有进程状态
pm2 logs jiaozhou-backend           # 实时日志（Ctrl+C 退出）
pm2 logs jiaozhou-backend --lines 50   # 最近 50 行日志
pm2 restart jiaozhou-backend        # 重启（代码更新后用）
pm2 reload jiaozhou-backend         # 0 秒重载（不中断）
pm2 stop jiaozhou-backend           # 停止
pm2 delete jiaozhou-backend         # 从 PM2 列表移除
pm2 monit                           # 实时 CPU/内存监控
```

### 验证部署成功

```bash
# 1. PM2 状态应该是 online
pm2 status

# 2. 端口监听
ss -tlnp | grep 3001

# 3. 本地访问测试
curl http://localhost:3001
curl http://localhost:3001/api/events
```

如果 `curl http://localhost:3001` 返回 HTML（含 `<div id="root">`），说明前端构建产物已被后端正确 serve。

### 常见 PM2 故障排查

| 现象 | 排查 |
|---|---|
| `pm2 status` 显示 `errored` | `pm2 logs jiaozhou-backend --lines 100` 看启动报错 |
| 启动后立即退出 | 检查 `backend/server.js` 端口是否被占用：`lsof -i :3001` |
| `pm2 startup` 报权限错 | 用 `sudo` 跑它输出的那行命令 |
| 修改代码不生效 | `pm2 restart jiaozhou-backend`，前端重新 `npm run build` |

