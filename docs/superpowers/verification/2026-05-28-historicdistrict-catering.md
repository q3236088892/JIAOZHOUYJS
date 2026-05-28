# HistoricDistrict catering verification (2026-05-28)

- backend tests: PASS (`npm --prefix backend test`)
- frontend tests: PASS (`npm --prefix frontend test`)
- manual checklist: pending (needs browser verification)

---

## 访问慢 + 偶发 500 排查结论（2026-05-28）

### 现象

- 页面可以打开，但数据区域加载很慢。
- 浏览器偶发报错：`GET http://localhost:3000/api/historic/public/home 500 (Internal Server Error)`。

### 根因

1. 本机存在多个残留 `node` 进程，导致端口冲突与转发混乱（3000/3001 同时被多进程占用）。
2. 前端代理使用 `localhost`，在 Windows 环境下可能触发 IPv4/IPv6 解析抖动，出现间歇性 `ECONNREFUSED`。
3. Vite 未开启 `strictPort` 时，端口被占用后可能漂移，进一步增加排查难度。

### 证据（实测）

- 冲突状态下压测 `/api/historic/public/home`：
  - `ok=6 fail=24 avgMs=6870.03`
- 修复后（单实例 + 新代理配置）压测同接口：
  - `ok=20 fail=0 avgMs=18.65`

### 已落地修复

- `frontend/vite.config.js`
  - 增加：`strictPort: true`
  - 修改代理目标：
    - `'/api' -> 'http://127.0.0.1:3001'`
    - `'/uploads' -> 'http://127.0.0.1:3001'`
- 新增测试：`frontend/src/tests/vite-dev-server-config.test.js`
  - 约束 dev server 端口和代理目标，防止回退。

### 启停规范（避免复发）

```powershell
# 1) 清理残留进程
taskkill /F /IM node.exe

# 2) 项目根目录启动后端
npm --prefix backend start

# 3) 新开终端，项目根目录启动前端
npm --prefix frontend run dev
```

### 验证命令

```powershell
npm --prefix backend test
npm --prefix frontend test
```
