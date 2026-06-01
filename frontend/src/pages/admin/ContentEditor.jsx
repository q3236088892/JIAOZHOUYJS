import { useEffect, useState, useCallback, useRef } from 'react'
import { Button, Form, Input, Select, Space, Divider, message, Popconfirm } from 'antd'
import {
  PlusOutlined, MinusCircleOutlined, SaveOutlined, DeleteOutlined,
  HolderOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FileTextOutlined, PictureOutlined, PlayCircleOutlined, TableOutlined,
  UploadOutlined
} from '@ant-design/icons'
import {
  getAdminCdModules,
  updateAdminCdNode,
  updateAdminCdContent,
  uploadCdImage
} from '../../api/homeIndustry'

const { TextArea } = Input

function normalizeNodeContent(content = {}) {
  const fields = content.fields || []
  if (content.content_type === 'blocks') return { ...content, fields }
  if (content.body && !content.link_url && content.content_type !== 'link' && fields.length === 0) {
    return { ...content, content_type: 'richtext', fields }
  }
  return { ...content, fields }
}

function getNodeContent(node) {
  const content = node.content || {
    content_type: node.content_type,
    summary: node.summary,
    department: node.department,
    remark: node.remark,
    link_url: node.link_url,
    link_label: node.link_label,
    link_target: node.link_target,
    body: node.body,
    fields: node.fields || []
  }
  return normalizeNodeContent(content)
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function unwrapDoubleEncodedBlocks(blocks) {
  // Fix double-encoded blocks: single text block whose content is a JSON string of actual blocks
  if (blocks.length === 1 && blocks[0].type === 'text' && typeof blocks[0].content === 'string') {
    try {
      const inner = JSON.parse(blocks[0].content)
      if (Array.isArray(inner) && inner.length > 0 && inner[0].type) {
        return inner
      }
    } catch {}
  }
  return blocks
}

function convertToBlocks(content) {
  if (content.content_type === 'blocks') {
    try {
      const parsed = JSON.parse(content.body)
      if (Array.isArray(parsed)) return unwrapDoubleEncodedBlocks(parsed)
    } catch {
      return [{ id: generateId(), type: 'text', content: content.body || '' }]
    }
  }
  if (content.content_type === 'richtext' && content.body) {
    return [{ id: generateId(), type: 'text', content: content.body }]
  }
  if (content.content_type === 'info' && content.fields && content.fields.length > 0) {
    return [{ id: generateId(), type: 'info', fields: content.fields.map(f => ({ label: f.field_label, value: f.field_value })) }]
  }
  return []
}

const BLOCK_TYPE_OPTIONS = [
  { key: 'text', label: '文字', icon: <FileTextOutlined /> },
  { key: 'image', label: '图片', icon: <PictureOutlined /> },
  { key: 'video', label: '视频', icon: <PlayCircleOutlined /> },
  { key: 'info', label: '信息', icon: <TableOutlined /> }
]

function createEmptyBlock(type) {
  const base = { id: generateId(), type }
  if (type === 'text') return { ...base, content: '' }
  if (type === 'image') return { ...base, url: '', caption: '' }
  if (type === 'video') return { ...base, url: '' }
  if (type === 'info') return { ...base, fields: [{ label: '', value: '' }] }
  return base
}

function TextBlockEditor({ block, onChange }) {
  return (
    <TextArea
      rows={4}
      value={block.content}
      onChange={e => onChange({ ...block, content: e.target.value })}
      placeholder="输入文字内容..."
      style={{ resize: 'vertical' }}
    />
  )
}

function ImageBlockEditor({ block, onChange }) {
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadCdImage(file)
      if (res.data.code === 200) {
        onChange({ ...block, url: res.data.data.url })
      }
    } catch {
      message.error('图片上传失败')
    }
    e.target.value = ''
  }

  return (
    <div>
      {block.url && (
        <div style={{ marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden', background: '#fafafa' }}>
          <img
            src={block.url}
            alt={block.caption || ''}
            style={{ display: 'block', maxWidth: '100%', maxHeight: 200, objectFit: 'contain', margin: '0 auto' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
        <Button icon={<UploadOutlined />} size="small" onClick={() => fileInputRef.current?.click()}>
          {block.url ? '更换图片' : '上传图片'}
        </Button>
        <Input
          value={block.url}
          onChange={e => onChange({ ...block, url: e.target.value })}
          placeholder="图片地址"
          size="small"
          style={{ flex: 1 }}
        />
      </div>
      <Input
        value={block.caption}
        onChange={e => onChange({ ...block, caption: e.target.value })}
        placeholder="图片说明（可选）"
        size="small"
      />
    </div>
  )
}

function VideoBlockEditor({ block, onChange }) {
  return (
    <div>
      <Input
        value={block.url}
        onChange={e => onChange({ ...block, url: e.target.value })}
        placeholder="粘贴视频链接（支持B站、优酷、YouTube等）"
        size="small"
      />
      {block.url && (
        <div style={{ marginTop: 8 }}>
          {block.url.includes('bilibili.com') ? (
            <iframe
              src={block.url.replace('/video/', '/player/bn/').split('?')[0]}
              className="ce-block-video-preview"
              allowFullScreen
              frameBorder="0"
            />
          ) : (
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, color: '#999', fontSize: 12, textAlign: 'center' }}>
              视频预览: {block.url}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InfoBlockEditor({ block, onChange }) {
  const updateField = (index, key, value) => {
    const newFields = [...block.fields]
    newFields[index] = { ...newFields[index], [key]: value }
    onChange({ ...block, fields: newFields })
  }

  const addField = () => {
    onChange({ ...block, fields: [...block.fields, { label: '', value: '' }] })
  }

  const removeField = (index) => {
    onChange({ ...block, fields: block.fields.filter((_, i) => i !== index) })
  }

  return (
    <div className="ce-block-info-fields">
      {block.fields.map((field, index) => (
        <div key={index} className="ce-block-info-row">
          <Input
            value={field.label}
            onChange={e => updateField(index, 'label', e.target.value)}
            placeholder="标签"
            size="small"
            style={{ width: 120 }}
          />
          <Input
            value={field.value}
            onChange={e => updateField(index, 'value', e.target.value)}
            placeholder="内容"
            size="small"
            style={{ flex: 1 }}
          />
          <Button
            type="text"
            size="small"
            icon={<MinusCircleOutlined />}
            onClick={() => removeField(index)}
            danger
          />
        </div>
      ))}
      <Button type="dashed" onClick={addField} icon={<PlusOutlined />} size="small" style={{ alignSelf: 'flex-start' }}>
        添加字段
      </Button>
    </div>
  )
}

function BlockEditor({ block, onChange, onMoveUp, onMoveDown, onDelete, isFirst, isLast }) {
  const typeLabel = BLOCK_TYPE_OPTIONS.find(t => t.key === block.type)?.label || block.type
  const typeIcon = BLOCK_TYPE_OPTIONS.find(t => t.key === block.type)?.icon

  const EditorComponent = {
    text: TextBlockEditor,
    image: ImageBlockEditor,
    video: VideoBlockEditor,
    info: InfoBlockEditor
  }[block.type]

  return (
    <div className="ce-block-item">
      <div className="ce-block-header">
        <div className="ce-block-type-label">
          <HolderOutlined />
          {typeIcon}
          <span>{typeLabel}区块</span>
        </div>
        <div className="ce-block-actions">
          <Button type="text" size="small" icon={<ArrowUpOutlined />} onClick={onMoveUp} disabled={isFirst} />
          <Button type="text" size="small" icon={<ArrowDownOutlined />} onClick={onMoveDown} disabled={isLast} />
          <Popconfirm title="确定删除此区块？" onConfirm={onDelete} okText="删除" cancelText="取消">
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </div>
      </div>
      {EditorComponent && <EditorComponent block={block} onChange={onChange} />}
    </div>
  )
}

export default function ContentEditor({ node, onRefresh }) {
  const [form] = Form.useForm()
  const [contentType, setContentType] = useState('info')
  const [saving, setSaving] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [legacyFields, setLegacyFields] = useState([])

  useEffect(() => {
    if (!node) return
    const content = getNodeContent(node)
    let ct = content.content_type || 'info'

    // Auto-detect: body is JSON blocks array even if content_type isn't 'blocks'
    if (ct !== 'blocks' && content.body) {
      try {
        const parsed = JSON.parse(content.body)
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
          ct = 'blocks'
        }
      } catch {}
    }

    setContentType(ct)

    form.setFieldsValue({
      title: node.title,
      node_type: node.node_type,
      sort_order: node.sort_order ?? 0,
      content_type: ct,
      summary: content.summary || '',
      link_url: content.link_url || '',
      link_label: content.link_label || '',
      link_target: content.link_target || '_blank',
      body: content.body || '',
      department: content.department || '',
      remark: content.remark || ''
    })

    if (ct === 'blocks') {
      setBlocks(convertToBlocks(content))
    } else if (ct === 'richtext' || ct === 'info') {
      setBlocks(convertToBlocks(content))
      setLegacyFields((content.fields || []).map(f => ({
        field_key: f.field_key,
        field_label: f.field_label,
        field_value: f.field_value
      })))
    } else {
      setBlocks([])
      setLegacyFields((content.fields || []).map(f => ({
        field_key: f.field_key,
        field_label: f.field_label,
        field_value: f.field_value
      })))
    }
  }, [node, form])

  const updateBlock = useCallback((index, newBlock) => {
    setBlocks(prev => prev.map((b, i) => i === index ? newBlock : b))
  }, [])

  const moveBlock = useCallback((index, direction) => {
    setBlocks(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  const removeBlock = useCallback((index) => {
    setBlocks(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addBlock = useCallback((type) => {
    setBlocks(prev => [...prev, createEmptyBlock(type)])
  }, [])

  const handleContentTypeChange = useCallback((value) => {
    setContentType(value)
    if (value === 'blocks' && blocks.length === 0) {
      const content = getNodeContent(node)
      setBlocks(convertToBlocks(content))
    }
  }, [node, blocks.length])

  const handleSave = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()

      // Use the effective content type (auto-detected may differ from form value)
      const effectiveType = contentType

      await updateAdminCdNode(node.id, {
        title: values.title,
        node_type: values.node_type,
        sort_order: values.sort_order ?? 0
      })

      if (values.node_type === 'leaf') {
        const contentData = {
          content_type: effectiveType,
          summary: values.summary || null,
          department: values.department || null,
          remark: values.remark || null
        }

        if (effectiveType === 'link') {
          contentData.link_url = values.link_url || null
          contentData.link_label = values.link_label || null
          contentData.link_target = values.link_target || '_blank'
        } else if (effectiveType === 'richtext') {
          contentData.body = values.body || null
        } else if (effectiveType === 'blocks') {
          contentData.body = JSON.stringify(blocks)
        } else if (effectiveType === 'info') {
          const fields = legacyFields.filter(f => f.field_label && f.field_value).map((f, i) => ({
            field_key: f.field_key || `field_${i}`,
            field_label: f.field_label,
            field_value: f.field_value
          }))
          await updateAdminCdContent(node.id, { ...contentData, fields })
          message.success('保存成功')
          onRefresh?.()
          return
        }

        await updateAdminCdContent(node.id, contentData)
      }

      message.success('保存成功')
      onRefresh?.()
    } catch (e) {
      if (e?.errorFields) return
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="content-editor">
      <div className="content-editor-header">
        <h3>编辑节点内容</h3>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存
        </Button>
      </div>

      <Form form={form} layout="vertical" size="small">
        <div className="ce-section">
          <div className="ce-section-title">基本信息</div>
          <Form.Item name="title" label="节点标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="node_type" label="节点类型" style={{ width: 150 }}>
              <Select
                options={[
                  { label: '分支（目录）', value: 'branch' },
                  { label: '叶子（内容）', value: 'leaf' }
                ]}
              />
            </Form.Item>
            <Form.Item name="sort_order" label="排序" style={{ width: 100 }}>
              <Input type="number" />
            </Form.Item>
          </Space>
        </div>

        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.node_type !== cur.node_type}>
          {({ getFieldValue }) =>
            getFieldValue('node_type') === 'leaf' ? (
              <>
                <div className="ce-section">
                  <div className="ce-section-title">通用信息</div>
                  <Form.Item name="content_type" label="内容类型">
                    <Select
                      onChange={handleContentTypeChange}
                      options={[
                        { label: '区块内容（推荐）', value: 'blocks' },
                        { label: '链接', value: 'link' },
                        { label: '结构化信息', value: 'info' },
                        { label: '富文本', value: 'richtext' }
                      ]}
                    />
                  </Form.Item>

                  <Form.Item name="summary" label="摘要">
                    <Input />
                  </Form.Item>
                  <Form.Item name="department" label="牵头单位/提供部门">
                    <Input />
                  </Form.Item>
                  <Form.Item name="remark" label="备注">
                    <TextArea rows={2} />
                  </Form.Item>
                </div>

                {contentType === 'link' && (
                  <div className="ce-section">
                    <div className="ce-section-title">链接设置</div>
                    <Form.Item name="link_label" label="链接文本">
                      <Input />
                    </Form.Item>
                    <Form.Item name="link_url" label="链接地址">
                      <Input placeholder="https://..." />
                    </Form.Item>
                    <Form.Item name="link_target" label="打开方式">
                      <Select
                        options={[
                          { label: '新窗口', value: '_blank' },
                          { label: '当前窗口', value: '_self' }
                        ]}
                      />
                    </Form.Item>
                  </div>
                )}

                {contentType === 'info' && (
                  <div className="ce-section">
                    <div className="ce-section-title">结构化信息编辑</div>
                    <div className="ce-block-info-fields">
                      {legacyFields.map((field, index) => (
                        <div key={index} className="ce-block-info-row">
                          <Input
                            value={field.field_label}
                            onChange={e => {
                              const newFields = [...legacyFields]
                              newFields[index] = { ...newFields[index], field_label: e.target.value }
                              setLegacyFields(newFields)
                            }}
                            placeholder="标签"
                            size="small"
                            style={{ width: 120 }}
                          />
                          <Input
                            value={field.field_value}
                            onChange={e => {
                              const newFields = [...legacyFields]
                              newFields[index] = { ...newFields[index], field_value: e.target.value }
                              setLegacyFields(newFields)
                            }}
                            placeholder="内容"
                            size="small"
                            style={{ flex: 1 }}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={() => setLegacyFields(legacyFields.filter((_, i) => i !== index))}
                            danger
                          />
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => setLegacyFields([...legacyFields, { field_key: '', field_label: '', field_value: '' }])}
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ alignSelf: 'flex-start' }}
                      >
                        添加字段
                      </Button>
                    </div>
                  </div>
                )}

                {contentType === 'richtext' && (
                  <div className="ce-section">
                    <div className="ce-section-title">富文本内容</div>
                    <Form.Item name="body" label="内容">
                      <TextArea rows={6} placeholder="输入内容..." />
                    </Form.Item>
                  </div>
                )}

                {contentType === 'blocks' && (
                  <div className="ce-section">
                    <div className="ce-section-title">区块内容编辑</div>
                    <div className="ce-block-list">
                      {blocks.map((block, index) => (
                        <BlockEditor
                          key={block.id}
                          block={block}
                          onChange={(newBlock) => updateBlock(index, newBlock)}
                          onMoveUp={() => moveBlock(index, -1)}
                          onMoveDown={() => moveBlock(index, 1)}
                          onDelete={() => removeBlock(index)}
                          isFirst={index === 0}
                          isLast={index === blocks.length - 1}
                        />
                      ))}
                    </div>
                    <Divider style={{ margin: '12px 0' }}>添加区块</Divider>
                    <div className="ce-block-toolbar">
                      {BLOCK_TYPE_OPTIONS.map(opt => (
                        <Button
                          key={opt.key}
                          icon={opt.icon}
                          onClick={() => addBlock(opt.key)}
                          size="small"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null
          }
        </Form.Item>
      </Form>

      {node && (
        <div className="ce-section" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <div className="ce-section-title">节点信息</div>
          <div className="ce-meta-grid">
            <div className="ce-meta-item">
              <span className="ce-meta-label">节点ID:</span>
              <span className="ce-meta-value">{node.id}</span>
            </div>
            <div className="ce-meta-item">
              <span className="ce-meta-label">节点类型:</span>
              <span className="ce-meta-value">{node.node_type === 'leaf' ? '叶子' : '分支'}</span>
            </div>
            <div className="ce-meta-item">
              <span className="ce-meta-label">内容类型:</span>
              <span className="ce-meta-value">{{ blocks: '区块内容', link: '链接', info: '结构化信息', richtext: '富文本' }[contentType] || contentType || '-'}</span>
            </div>
            <div className="ce-meta-item">
              <span className="ce-meta-label">创建时间:</span>
              <span className="ce-meta-value">{node.created_at || '-'}</span>
            </div>
            <div className="ce-meta-item">
              <span className="ce-meta-label">更新时间:</span>
              <span className="ce-meta-value">{node.updated_at || node.content?.updated_at || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
