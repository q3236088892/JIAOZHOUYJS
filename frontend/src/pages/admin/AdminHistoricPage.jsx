import { useEffect, useState } from 'react'
import { Button, Form, Input, Modal, Space, Table, message } from 'antd'
import {
  getAdminNavItems,
  createAdminNavItem,
  updateAdminNavItem,
  deleteAdminNavItem
} from '../../api/historic'
import '../../styles/admin.css'

export default function AdminHistoricPage() {
  const [rows, setRows] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    const navRes = await getAdminNavItems()
    if (navRes.data.code === 200) setRows(navRes.data.data)
  }

  useEffect(() => {
    load().catch(() => {
      message.error('\u52a0\u8f7d\u540e\u53f0\u6570\u636e\u5931\u8d25')
    })
  }, [])

  const resetModal = () => {
    setOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const onCreate = () => {
    setEditing(null)
    form.setFieldsValue({
      title: '',
      link_type: 'internal',
      link_target: '/historicDistrict',
      open_mode: '_self'
    })
    setOpen(true)
  }

  const onEdit = (row) => {
    setEditing(row)
    form.setFieldsValue({
      title: row.title,
      link_type: row.link_type,
      link_target: row.link_target,
      open_mode: row.open_mode || '_self'
    })
    setOpen(true)
  }

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      const values = await form.validateFields()
      if (editing) {
        await updateAdminNavItem(editing.id, values)
      } else {
        await createAdminNavItem(values)
      }
      message.success('\u4fdd\u5b58\u6210\u529f')
      resetModal()
      await load()
    } catch (error) {
      if (error?.errorFields) return
      message.error('\u4fdd\u5b58\u5931\u8d25')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = (row) => {
    Modal.confirm({
      title: `\u786e\u8ba4\u5220\u9664\uff1a${row.title}\uff1f`,
      okText: '\u786e\u8ba4',
      cancelText: '\u53d6\u6d88',
      onOk: async () => {
        try {
          await deleteAdminNavItem(row.id)
          message.success('\u5220\u9664\u6210\u529f')
          await load()
        } catch {
          message.error('\u5220\u9664\u5931\u8d25')
        }
      }
    })
  }

  return (
    <div className="admin-page">
      <h1>{'\u5386\u53f2\u57ce\u533a\u5185\u5bb9\u7ba1\u7406'}</h1>

      <div className="admin-card">
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={onCreate}>{'\u65b0\u589e\u5bfc\u822a'}</Button>
        </Space>

        <Table
          rowKey="id"
          dataSource={rows}
          pagination={false}
          columns={[
            { title: '\u6807\u9898', dataIndex: 'title' },
            { title: '\u94fe\u63a5\u7c7b\u578b', dataIndex: 'link_type' },
            { title: '\u94fe\u63a5\u5730\u5740', dataIndex: 'link_target' },
            { title: '\u6253\u5f00\u65b9\u5f0f', dataIndex: 'open_mode' },
            {
              title: '\u64cd\u4f5c',
              render: (_, row) => (
                <Space>
                  <Button onClick={() => onEdit(row)}>{'\u7f16\u8f91'}</Button>
                  <Button danger onClick={() => onDelete(row)}>{'\u5220\u9664'}</Button>
                </Space>
              )
            }
          ]}
        />
      </div>

      <Modal
        open={open}
        onOk={onSubmit}
        onCancel={resetModal}
        confirmLoading={submitting}
        title={editing ? '\u7f16\u8f91\u5bfc\u822a' : '\u65b0\u589e\u5bfc\u822a'}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="\u6807\u9898" rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u6807\u9898' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="link_type"
            label="\u94fe\u63a5\u7c7b\u578b"
            rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u94fe\u63a5\u7c7b\u578b\uff08internal/external\uff09' }]}
          >
            <Input placeholder="internal \u6216 external" />
          </Form.Item>
          <Form.Item name="link_target" label="\u94fe\u63a5\u5730\u5740" rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u94fe\u63a5\u5730\u5740' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="open_mode" label="\u6253\u5f00\u65b9\u5f0f" rules={[{ required: true, message: '\u8bf7\u8f93\u5165\u6253\u5f00\u65b9\u5f0f\uff08_self/_blank\uff09' }]}>
            <Input placeholder="_self \u6216 _blank" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
