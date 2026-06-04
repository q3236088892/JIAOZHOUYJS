# 招商宣传专题页设计规格

日期：2026-06-04

## 背景

家居产业前台详情页已经对 `value_added?section=industry-intro` 提供了静态专题模板：左侧专题锚点菜单，右侧以“专题展示”标题和展板分段方式呈现。用户希望 `value_added?section=investment-promo` 的“招商宣传”也做成类似效果，并加入 `E:\progamecode\jiaozhou0526\2` 目录中的宣传视频。

## 已确认方案

采用“B 方案 + 视频置顶”：保持展板完整呈现风格，同时把视频作为右侧内容区第一段。

页面结构：

1. 左侧专题菜单
   - 顶部蓝色封面，标题为“招商宣传”。
   - 锚点依次为：宣传视频、完善供应链、做强产业链。
   - 样式复用“产业简介”专题菜单的白底、蓝色激活态、左侧高亮边线。

2. 右侧专题内容
   - 顶部 header：`专题展示` / `招商宣传`。
   - 第一段：宣传视频。
     - 使用浏览器原生 `<video controls>` 播放。
     - 视频源来自 public 静态资源目录。
     - 不做转码，不依赖后端接口。
   - 第二段：完善供应链展板。
     - 展示 `2\图片 14.png` 优化后的 webp 图片。
   - 第三段：做强产业链展板。
     - 展示 `2\图片 15.png` 优化后的 webp 图片。

## 素材处理

源素材：

- `2\家居产业宣传视频.mp4`，约 8.2MB。
- `2\图片 14.png`，2667×1500。
- `2\图片 15.png`，2667×1500。

目标素材目录：

- `frontend/public/home-industry/investment-promo/promo-video.mp4`
- `frontend/public/home-industry/investment-promo/supply-chain.webp`
- `frontend/public/home-industry/investment-promo/strong-chain.webp`

图片需要压缩为 webp，保持横版展板比例，页面中按宽度自适应展示。当前环境没有 `ffmpeg/ffprobe`，所以视频只复制，不转码、不抽帧。

## 代码设计

修改 `frontend/src/pages/home-industry/ModuleDetailPage.jsx`：

- 新增 `INVESTMENT_PROMO_ASSET_BASE = '/home-industry/investment-promo'`。
- 新增静态分段数据：
  - `video` 段：标题“宣传视频”，视频文件 `promo-video.mp4`。
  - `image` 段：标题“完善供应链”，图片 `supply-chain.webp`。
  - `image` 段：标题“做强产业链”，图片 `strong-chain.webp`。
- 新增 `InvestmentPromoSpecialContent` 组件。
- 在 `SpecialSectionContent` 中：
  - `sectionKey === 'industry-intro'` 继续走产业简介静态专题。
  - `sectionKey === 'investment-promo'` 走招商宣传静态专题。
  - 其他特殊专题保持现有数据驱动逻辑。

修改 `frontend/src/styles/historic.css`：

- 复用现有 `.hd-special-section-layout--industry-intro`、`.hd-special-poster-section`、`.hd-special-poster-image` 的视觉语言。
- 为招商宣传补充视频容器样式：蓝色或白底卡片、圆角、阴影、16:9 比例、移动端自适应。
- 保持 `@media (max-width: 1100px)` 下左侧菜单与内容区可纵向排列。

## 数据与兼容性

- 不改数据库。
- 不改后台编辑器。
- 不改接口。
- 当 URL 为 `/homeIndustry/value_added?section=investment-promo` 时优先展示静态招商宣传专题，不展示后台导入的旧正文内容。
- 其他 `value_added` 分组仍保持原有左侧导航 + 服务卡片内容渲染。

## 测试计划

新增或更新 `frontend/src/tests/module-detail-special-template.test.jsx`：

- 验证 `section=investment-promo` 渲染招商宣传静态专题。
- 验证页面存在视频元素，`src` 指向 `/home-industry/investment-promo/promo-video.mp4`。
- 验证锚点包含“宣传视频”“完善供应链”“做强产业链”。
- 验证图片依次指向 `/home-industry/investment-promo/supply-chain.webp` 和 `/home-industry/investment-promo/strong-chain.webp`。
- 验证不会展示 mock 树中的旧“招商宣传内容”。

回归命令：

```bash
cd frontend
npm test
npm run build
```

后端不涉及修改，必要时可运行：

```bash
cd backend
npm test
```
