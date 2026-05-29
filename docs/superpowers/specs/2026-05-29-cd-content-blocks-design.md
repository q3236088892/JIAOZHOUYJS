# `/admin/cd` 内容块自由组合增强设计文档

## 1. 背景与目标

当前家居产业模块 `/admin/cd` 的内容维护能力偏简单：叶子节点内容只能在 `link`、`info`、`richtext` 三种类型中选择一种。用户希望后台维护人员可以像截图示例一样，把“描述说明、链接按钮、信息字段、富文本内容”等混合放置，让前台页面内容更丰富、维护更方便。

本次目标是增强 `/admin/cd`，但保持现有业务逻辑稳定：

1. 内容块主要用于 **leaf 叶子节点**；branch 仍作为目录/分组容器。
2. 已有大部分数据没有混排，前台效果应与现在基本一致。
3. 只有维护人员新增多个内容块时，前台才按块顺序展示混排效果。
4. 旧数据必须自动兼容，不能要求重新录入。

## 2. 范围与非目标

### 2.1 本期范围

1. 新增内容块模型，支持叶子节点下自由组合和排序。
2. `/admin/cd` 内容编辑器改为“左侧内容块列表 + 右侧属性编辑”。
3. 首期支持基础实用型内容块：
   - 分组标题 `heading`
   - 描述/轻量富文本 `richtext`
   - 链接按钮 `link`
   - 信息字段组 `fields`
   - 提示说明 `notice`
4. 旧 `cd_content` / `cd_content_field` 数据自动映射为内容块进行编辑。
5. 前台 `/homeIndustry/:moduleCode` 同步支持内容块渲染：有 blocks 时按块展示，无 blocks 时走旧逻辑。
6. 保持现有目录、树结构、锚点、折叠逻辑尽量不变。

### 2.2 非目标

1. 不改造登录、权限、审核流。
2. 不做复杂页面搭建器，不支持任意布局拖拽。
3. 首期不支持图片、附件、表格、复杂字号颜色、两栏布局。
4. 不强制迁移所有旧内容；旧内容只在编辑保存后写入新 blocks。

## 3. 总体方案

采用方案 A：**新增独立内容块表，保留旧内容结构兜底**。

核心原则：

1. 保留现有 `cd_content`、`cd_content_field`。
2. 新增 `cd_content_block` 与 `cd_content_block_field`。
3. 前台渲染优先级：
   - 如果 leaf 内容存在 active blocks：按 blocks 顺序渲染；
   - 如果没有 blocks：继续走当前 `content_type = link/info/richtext` 逻辑。
4. 后台编辑优先级：
   - 如果有 blocks：直接编辑 blocks；
   - 如果没有 blocks 但有旧内容：临时映射为 blocks 展示；
   - 保存后写入 blocks，同时保留旧字段作为兼容摘要。

这样可以保证旧页面默认效果不变，同时为后续混排提供扩展点。

## 4. 数据模型设计

### 4.1 新增 `cd_content_block`

用于描述叶子节点下的内容块。

字段建议：

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `node_id` INTEGER NOT NULL
- `block_type` TEXT NOT NULL
  - `heading`
  - `richtext`
  - `link`
  - `fields`
  - `notice`
- `title` TEXT
  - heading 标题
  - fields 分组标题
  - 后台列表摘要可复用
- `content_html` TEXT
  - richtext / notice 的安全 HTML
- `content_text` TEXT
  - 可选纯文本摘要，用于后台列表或兼容摘要
- `link_label` TEXT
- `link_url` TEXT
- `link_target` TEXT DEFAULT `_blank`
- `sort_order` INTEGER DEFAULT 0
- `is_active` INTEGER DEFAULT 1
- `created_at` TEXT DEFAULT `(datetime('now','localtime'))`
- `updated_at` TEXT DEFAULT `(datetime('now','localtime'))`

索引：

- `idx_cd_block_node` on `(node_id)`
- `idx_cd_block_sort` on `(node_id, sort_order, id)`

### 4.2 新增 `cd_content_block_field`

用于 `fields` 内容块下的 label/value 行。

字段建议：

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `block_id` INTEGER NOT NULL
- `field_key` TEXT
- `field_label` TEXT NOT NULL
- `field_value` TEXT NOT NULL
- `sort_order` INTEGER DEFAULT 0
- `created_at` TEXT DEFAULT `(datetime('now','localtime'))`

索引：

- `idx_cd_block_field_block` on `(block_id)`

### 4.3 与旧结构的关系

旧表继续保留：

- `cd_content`：保存节点内容主记录与旧字段。
- `cd_content_field`：保存旧 `info` 类型字段。

保存新 blocks 时：

1. 确保 `cd_content` 仍有该 `node_id` 的记录。
2. 写入或替换 `cd_content_block` / `cd_content_block_field`。
3. 对 `cd_content.summary`、`content_type` 保留兼容值，例如：
   - 有 link 块：`content_type = 'link'`，summary 取第一个链接文案或第一个文本摘要；
   - 有 richtext/notice：summary 取纯文本摘要；
   - 仅 fields：`content_type = 'info'`。

## 5. 后端设计

### 5.1 Schema 初始化

在 `backend/modules/home-industry/schema.js` 中新增两张表和索引。初始化必须幂等，不影响已有数据库。

### 5.2 Repository 能力

在 `backend/modules/home-industry/repository.js` 中新增或扩展：

1. `getNodeWithContent(id)`
   - 返回旧 `content` 字段；
   - 若有 blocks，返回 `content.blocks`；
   - fields 块包含 `fields` 数组；
   - 按 `sort_order, id` 排序。
2. `getTree(moduleId)`
   - 继续返回树结构；
   - 必须为 leaf 节点附带 `content.blocks`，因为前台详情当前直接依赖 tree 渲染叶子内容；
   - branch 节点可只保留旧摘要字段，不需要加载 blocks。
3. `upsertContent(nodeId, contentData, fields, blocks)`
   - 兼容旧调用；
   - 当 `blocks` 参数存在时，替换该 node 的 active blocks；
   - 保存前校验 node 必须是 leaf。

### 5.3 API 设计

复用现有接口：

`PUT /api/admin/cd/contents/:nodeId`

请求体扩展：

```json
{
  "content_type": "richtext",
  "summary": "可选摘要",
  "department": "可选部门",
  "remark": "可选备注",
  "fields": [],
  "blocks": [
    {
      "block_type": "richtext",
      "title": "服务说明",
      "content_html": "<p>...</p>",
      "sort_order": 0
    },
    {
      "block_type": "link",
      "link_label": "我要申报",
      "link_url": "https://example.com",
      "link_target": "_blank",
      "sort_order": 1
    }
  ]
}
```

响应仍沿用 `{ code, data, msg }`。

### 5.4 后端校验与错误处理

1. `nodeId` 非法：返回 400。
2. 节点不存在：返回 404。
3. branch 节点提交 blocks：返回 400，提示“内容块仅支持叶子节点”。
4. `block_type` 不在白名单：返回 400。
5. link 块有 `link_url` 时做基础 URL 校验：允许 `http://`、`https://`、站内相对路径 `/...`。
6. fields 块过滤空 label/value 行。
7. richtext/notice 保存前应移除危险标签和事件属性，至少禁止 `script`、`iframe`、`on*` 属性、`javascript:` 链接。

SQL.js 没有完整事务封装时，替换 blocks 的顺序要谨慎：先写入主 content，再删除旧 block fields 和旧 blocks，最后插入新 blocks。若插入失败，应返回错误，不宣称保存成功。

## 6. 后台前端设计

### 6.1 页面结构

`frontend/src/pages/admin/ContentEditor.jsx` 改造为：

1. 节点基础信息区：标题、类型、排序。
2. 当 `node_type === 'branch'`：
   - 不显示内容块编辑器；
   - 显示提示：“内容块仅支持叶子节点，请在叶子节点维护具体服务内容。”
3. 当 `node_type === 'leaf'`：
   - 显示内容块编辑器；
   - 布局为左侧块列表 + 右侧属性编辑。

### 6.2 内容块编辑器组件拆分

建议新增组件：

- `ContentBlockEditor.jsx`
  - 管理 blocks 数组、当前选中块、添加、删除、上移、下移。
- `BlockList.jsx`
  - 左侧列表，显示块类型、摘要、排序操作。
- `BlockPropertyPanel.jsx`
  - 右侧表单，根据 `block_type` 渲染字段。
- `LightRichTextEditor.jsx`
  - 轻量富文本编辑器。

组件边界清晰，避免 `ContentEditor.jsx` 继续膨胀。

### 6.3 轻量富文本

首期支持：

- 加粗
- 无序列表
- 有序列表
- 插入链接
- 换行
- 清除格式

推荐实现：

1. 使用小型 `contentEditable` 编辑区和自定义工具栏。
2. 编辑输出 HTML。
3. 只允许有限标签：`p`、`br`、`strong`、`b`、`ul`、`ol`、`li`、`a`。
4. 使用轻量依赖 `dompurify` 在保存前和渲染前清理 HTML，避免 XSS；后端另做基础危险标签和危险协议拦截。

### 6.4 旧数据映射规则

当后台打开 leaf 节点时：

1. 如果 `content.blocks.length > 0`：直接使用 blocks。
2. 如果没有 blocks：根据旧内容临时生成 blocks：
   - `summary` → `richtext`，排在最前；
   - `content_type = 'link'` → `link`；
   - `content_type = 'info'` + `content.fields` → `fields`；
   - `content_type = 'richtext'` + `body` → `richtext`；
   - `department` → 追加到 fields 块，字段名“提供部门”；
   - `remark` → `notice`。
3. 用户保存后，新 blocks 持久化到数据库。

### 6.5 保存体验

1. 点击“保存”一次性保存节点基础信息和内容块。
2. 保存成功后刷新树和当前节点内容。
3. 删除内容块前弹出二次确认；确认后只修改本地 blocks，点击保存后才持久化。
4. 上移/下移只调整本地顺序，保存时统一提交。

## 7. 前台展示设计

### 7.1 渲染入口

`frontend/src/pages/home-industry/ModuleDetailPage.jsx` 中 `LeafContent` 调整为：

1. `content.blocks` 存在且非空：调用 `ContentBlocksRenderer`。
2. 否则：走当前旧逻辑。

这样可以保证大部分旧内容前台展示与现在基本一致。

### 7.2 内容块渲染样式

沿用当前视觉体系，不另起一套风格：

- `heading`：蓝色小标题，类似字段 label 的强化版。
- `richtext`：使用当前 `.hd-topic-description` 浅蓝说明框。
- `link`：使用当前 `.hd-service-link` 胶囊链接样式。
- `fields`：使用当前 `.hd-topic-info` 网格样式。
- `notice`：新增轻量提示框样式，可用浅黄或浅蓝背景，避免抢主内容。

### 7.3 默认效果不变策略

1. 未保存为 blocks 的旧内容：完全走旧渲染路径。
2. 旧内容映射并保存为 blocks 后：
   - 单个 link/info/richtext 应使用与旧逻辑相同或非常接近的 CSS；
   - 多块混排才出现更丰富的组合效果。
3. 不改变 branch 展开/收起、左侧目录、锚点滚动逻辑。

## 8. 数据流

### 8.1 后台编辑数据流

1. 用户选择树上 leaf 节点。
2. `ContentEditor` 从 `selectedNode.content` 读取旧内容和 blocks。
3. `normalizeContentToBlocks(content)` 生成编辑器 blocks。
4. 用户添加、删除、排序、编辑内容块。
5. 保存时：
   - `PUT /api/admin/cd/nodes/:id` 保存节点基础信息；
   - `PUT /api/admin/cd/contents/:nodeId` 保存 content 和 blocks；
   - 保存成功后 `loadTree()` 刷新。

### 8.2 前台渲染数据流

1. `GET /api/cd/public/modules/:code/tree` 返回树结构。
2. `ModuleDetailPage` 构建左侧目录和右侧内容。
3. leaf 节点调用 `LeafContent`：
   - 有 blocks：按 `sort_order` 渲染；
   - 无 blocks：旧逻辑渲染。

## 9. 测试设计

### 9.1 后端测试

新增或扩展 Vitest：

1. schema 初始化包含 `cd_content_block` 与 `cd_content_block_field`。
2. 保存 leaf blocks 后，`GET /api/admin/cd/nodes/:id` 返回 blocks 且排序正确。
3. branch 节点提交 blocks 返回 400。
4. link URL 非法时返回 400。
5. 删除 leaf 节点时级联删除 content blocks 和 block fields。
6. 旧 content 无 blocks 时仍按旧字段返回，兼容旧前台逻辑。

### 9.2 前端测试

1. `ContentEditor`：branch 节点显示提示，不显示内容块编辑器。
2. `ContentEditor`：leaf 旧 link/info/richtext 能映射为 blocks。
3. `ContentBlockEditor`：添加、删除、上移、下移行为正确。
4. `LeafContent`：有 blocks 时按顺序渲染；无 blocks 时旧逻辑仍可渲染。
5. 富文本渲染时危险 HTML 被清理。

### 9.3 手工验收

1. 打开 `/admin/cd`，选择 leaf，可添加 5 类内容块。
2. 保存后刷新后台，内容块顺序和内容不丢失。
3. 打开 `/homeIndustry/:moduleCode`，新混排内容按后台顺序展示。
4. 未混排的旧内容前台效果与现在基本一致。
5. branch 节点不能维护内容块。

## 10. 风险与控制

1. **风险：旧内容保存为 blocks 后视觉细节变化**
   - 控制：复用现有 CSS 类；旧逻辑无 blocks 时完全不变。
2. **风险：富文本带来 XSS**
   - 控制：白名单标签和属性；渲染前清理 HTML；禁止 `javascript:`。
3. **风险：编辑器文件变大难维护**
   - 控制：拆分 `ContentBlockEditor`、`BlockList`、`BlockPropertyPanel`、`LightRichTextEditor`。
4. **风险：替换 blocks 时部分失败**
   - 控制：后端按明确顺序写入并返回错误；保存后重新读取校验。
5. **风险：维护人员误把目录节点改为 leaf 或反向修改**
   - 控制：branch 不显示内容块；node_type 从 branch/leaf 互切时必须弹出二次确认。

## 11. 验收标准

1. `/admin/cd` leaf 节点支持内容块自由组合和排序。
2. 支持 `heading`、`richtext`、`link`、`fields`、`notice` 五类块。
3. 旧内容打开后台时能自动映射为内容块。
4. 保存后前台按内容块顺序展示。
5. 无 blocks 的旧内容继续按当前逻辑展示，效果基本不变。
6. branch 节点不允许保存内容块。
7. 后端接口保持 `{ code, data, msg }` 结构。
8. 自动化测试覆盖核心兼容、保存、渲染和校验场景。

## 12. 实施顺序建议

1. 数据层：新增 schema、repository blocks 读写和级联删除。
2. 后端 API：扩展 `PUT /contents/:nodeId`，补充校验与测试。
3. 前台渲染：新增 `ContentBlocksRenderer`，确保无 blocks 时旧逻辑不变。
4. 后台编辑器：拆分并实现内容块编辑体验。
5. 富文本安全：实现白名单清理和前台安全渲染。
6. 回归测试：后端、前端、手工验收。

