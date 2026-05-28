import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Tag, Button, Breadcrumb, Space, message } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { getEvent } from '../api'

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    setLoading(true)
    try {
      const res = await getEvent(id)
      if (res.data.code === 200) {
        setEvent(res.data.data)
      } else {
        message.error('获取详情失败')
        navigate('/events')
      }
    } catch (error) {
      message.error('获取详情失败')
      navigate('/events')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case '待处理': return 'warning'
      case '已受理': return 'processing'
      case '已办结': return 'success'
      default: return 'default'
    }
  }

  if (loading) {
    return <div className="main-container" style={{ textAlign: 'center', padding: '60px' }}>加载中...</div>
  }

  if (!event) return null

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
          <Breadcrumb
            items={[
              { title: <span onClick={() => navigate('/events')} style={{ cursor: 'pointer' }} data-testid="breadcrumb-home">首页</span> },
              { title: '事件详情' }
            ]}
          />
        </Card>

        {/* 详情内容 */}
        <Card className="detail-container">
          <h2 data-testid="detail-title">{event.title}</h2>

          <div style={{ marginBottom: '20px' }}>
            <Space>
              <Tag color="blue" data-testid="detail-type">{event.eventType}</Tag>
              <Tag color={getStatusColor(event.status)} data-testid="detail-status">{event.status}</Tag>
            </Space>
          </div>

          <div style={{ lineHeight: '1.8', color: '#333' }}>
            <p style={{ marginBottom: '16px' }} data-testid="detail-content">{event.content || '暂无内容'}</p>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee', color: '#999', fontSize: '14px' }}>
            <p data-testid="detail-create-time">创建时间：{event.createTime}</p>
            <p style={{ marginTop: '8px' }} data-testid="detail-update-time">更新时间：{event.updateTime}</p>
          </div>

          <div className="action-buttons">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/events')}
              data-testid="back-btn"
            >
              返回列表
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/events/edit/${event.id}`)}
              data-testid="edit-btn"
            >
              编辑
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default EventDetail