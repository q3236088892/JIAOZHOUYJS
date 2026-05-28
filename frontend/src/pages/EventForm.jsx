import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Form, Input, Select, Button, message } from 'antd'
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons'
import { getEvent, createEvent, updateEvent } from '../api'

const { TextArea } = Input

function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      fetchEvent()
    }
  }, [id])

  const fetchEvent = async () => {
    try {
      const res = await getEvent(id)
      if (res.data.code === 200) {
        const { title, content, eventType, status } = res.data.data
        form.setFieldsValue({ title, content, eventType, status })
      }
    } catch (error) {
      message.error('获取数据失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      if (isEdit) {
        await updateEvent(id, values)
        message.success('更新成功')
      } else {
        await createEvent(values)
        message.success('创建成功')
      }
      navigate('/events')
    } catch (error) {
      if (error.errorFields) return
      message.error(isEdit ? '更新失败' : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* 顶部导航 */}
      <div className="header">
        <div className="logo">
          <div className="logo-icon">政</div>
          <span>一类事服务平台</span>
        </div>
      </div>

      <div className="main-container">
        {/* 面包屑 */}
        <Card className="breadcrumb" data-testid="breadcrumb">
          <Form.Item shouldUpdate>
            {() => (
              <Breadcrumb
                items={[
                  { title: <span onClick={() => navigate('/events')} style={{ cursor: 'pointer' }} data-testid="breadcrumb-home">首页</span> },
                  { title: isEdit ? '编辑事件' : '新增事件' }
                ]}
              />
            )}
          </Form.Item>
        </Card>

        {/* 表单 */}
        <Card className="form-container">
          <h2>{isEdit ? '编辑事件' : '新增事件'}</h2>

          <Form
            form={form}
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 700 }}
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
              data-testid="form-item-title"
            >
              <Input placeholder="请输入事件标题" data-testid="input-title" />
            </Form.Item>

            <Form.Item
              name="eventType"
              label="事件类型"
              initialValue="一类事"
              data-testid="form-item-type"
            >
              <Select data-testid="select-type">
                <Select.Option value="一类事">一类事</Select.Option>
                <Select.Option value="二类事">二类事</Select.Option>
                <Select.Option value="三类事">三类事</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              initialValue="待处理"
              data-testid="form-item-status"
            >
              <Select data-testid="select-status">
                <Select.Option value="待处理">待处理</Select.Option>
                <Select.Option value="已受理">已受理</Select.Option>
                <Select.Option value="已办结">已办结</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="content"
              label="内容"
              data-testid="form-item-content"
            >
              <TextArea
                rows={6}
                placeholder="请输入事件内容"
                data-testid="input-content"
              />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 4 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleSubmit}
                  loading={loading}
                  data-testid="submit-btn"
                >
                  {isEdit ? '保存' : '创建'}
                </Button>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/events')}
                  data-testid="cancel-btn"
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default EventForm