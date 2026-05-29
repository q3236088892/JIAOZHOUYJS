import { useEffect, useState } from 'react'
import { Button, Form, Input, Select, Space, Divider, message, Popconfirm } from 'antd'
import { PlusOutlined, MinusCircleOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getAdminCdModules,
  updateAdminCdNode,
  updateAdminCdContent
} from '../../api/homeIndustry'

const { TextArea } = Input

export default function ContentEditor({ node, onRefresh }) {
  const [form] = Form.useForm()
  const [contentType, setContentType] = useState('info')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!node) return
    const content = node.content || {}
    setContentType(content.content_type || 'info')

    form.setFieldsValue({
      title: node.title,
      node_type: node.node_type,
      sort_order: node.sort_order ?? 0,
      content_type: content.content_type || 'info',
      summary: content.summary || '',
      link_url: content.link_url || '',
      link_label: content.link_label || '',
      link_target: content.link_target || '_blank',
      body: content.body || '',
      department: content.department || '',
      remark: content.remark || '',
      fields: (content.fields || []).map((f) => ({
        field_key: f.field_key,
        field_label: f.field_label,
        field_value: f.field_value
      }))
    })
  }, [node, form])

  const handleSave = async () => {
    setSaving(true)
    try {
      const values = await form.validateFields()

      // Update node basic info
      await updateAdminCdNode(node.id, {
        title: values.title,
        node_type: values.node_type,
        sort_order: values.sort_order ?? 0
      })

      // Update content if leaf node
      if (values.node_type === 'leaf') {
        const contentData = {
          content_type: values.content_type,
          summary: values.summary || null,
          department: values.department || null,
          remark: values.remark || null
        }

        if (values.content_type === 'link') {
          contentData.link_url = values.link_url || null
          contentData.link_label = values.link_label || null
          contentData.link_target = values.link_target || '_blank'
        } else if (values.content_type === 'richtext') {
          contentData.body = values.body || null
        }

        const fields = values.content_type === 'info'
          ? (values.fields || []).filter((f) => f.field_label && f.field_value).map((f, i) => ({
            field_key: f.field_key || `field_${i}`,
            field_label: f.field_label,
            field_value: f.field_value
          }))
          : []

        await updateAdminCdContent(node.id, contentData, fields)
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
        <h3>{node.title}</h3>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存
        </Button>
      </div>

      <Form form={form} layout="vertical" size="small">
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

        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.node_type !== cur.node_type}>
          {({ getFieldValue }) =>
            getFieldValue('node_type') === 'leaf' ? (
              <>
                <Divider>内容设置</Divider>

                <Form.Item name="content_type" label="内容类型">
                  <Select
                    onChange={setContentType}
                    options={[
                      { label: '链接', value: 'link' },
                      { label: '结构化信息', value: 'info' },
                      { label: '富文本', value: 'richtext' }
                    ]}
                  />
                </Form.Item>

                {contentType === 'link' && (
                  <>
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
                  </>
                )}

                {contentType === 'info' && (
                  <>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>信息字段</div>
                    <Form.List name="fields">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field) => (
                            <Space key={field.key} align="baseline" style={{ marginBottom: 8 }}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'field_label']}
                                style={{ width: 120 }}
                              >
                                <Input placeholder="标签" />
                              </Form.Item>
                              <Form.Item
                                {...field}
                                name={[field.name, 'field_value']}
                                style={{ width: 300 }}
                              >
                                <Input placeholder="内容" />
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => remove(field.name)} />
                            </Space>
                          ))}
                          <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                            添加字段
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </>
                )}

                {contentType === 'richtext' && (
                  <Form.Item name="body" label="内容">
                    <TextArea rows={6} placeholder="输入内容..." />
                  </Form.Item>
                )}

                <Divider>通用信息</Divider>
                <Form.Item name="department" label="牵头单位/提供部门">
                  <Input />
                </Form.Item>
                <Form.Item name="remark" label="备注">
                  <TextArea rows={2} />
                </Form.Item>
                <Form.Item name="summary" label="摘要">
                  <Input />
                </Form.Item>
              </>
            ) : null
          }
        </Form.Item>
      </Form>
    </div>
  )
}
