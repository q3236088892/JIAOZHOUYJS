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

## 6. 正式部署建议

正式部署不要使用：

```bash
npm run dev
```

推荐方式：

```text
前端：npm run build 生成 frontend/dist
后端：PM2 托管 backend/server.js
对外：Nginx 监听 80/443，代理 /api 和 /uploads 到 127.0.0.1:3001
```

### 构建前端

```bash
cd /root/jiaozhou/frontend
npm install
npm run build
```

### 使用 PM2 启动后端

```bash
npm install -g pm2
ln -sf /usr/local/node-v18.20.8/bin/pm2 /usr/local/bin/pm2

cd /root/jiaozhou/backend
npm install
pm2 start server.js --name jiaozhou-backend
pm2 save
```

查看状态：

```bash
pm2 status
pm2 logs jiaozhou-backend --lines 50
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

最终推荐路线：

```text
CentOS 7.6 不升级 glibc
→ 安装 Node.js glibc-217 构建包
→ 服务器重新 npm install
→ 临时用 npm run dev 测试
→ 正式部署改为 npm run build + PM2 + Nginx
```
