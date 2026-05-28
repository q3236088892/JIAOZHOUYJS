import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Select, Tag, Card, Space, Modal, message } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getEvents, deleteEvent } from '../api'

const { Search } = Input

function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await getEvents()
      if (res.data.code === 200) {
        setEvents(res.data.data)
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row) => {
    navigate(`/events/edit/${row.id}`)
  }

  const handleView = (row) => {
    navigate(`/events/${row.id}`)
  }

  const handleDelete = (row) => {
    Modal.confirm({
      title: '确定删除该事件吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteEvent(row.id)
          message.success('删除成功')
          fetchEvents()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const filteredEvents = events.filter(e => {
    const matchSearch = !searchText || e.title.includes(searchText) || e.content?.includes(searchText)
    const matchType = !filterType || e.eventType === filterType
    const matchStatus = !filterStatus || e.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case '待处理': return 'warning'
      case '已受理': return 'processing'
      case '已办结': return 'success'
      default: return 'default'
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

      {/* 主容器 */}
      <div className="main-container">
        {/* 搜索栏 */}
        <Card className="search-bar" data-testid="search-bar">
          <Space wrap size="middle">
            <Search
              placeholder="搜索事件标题或内容"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
              prefix={<SearchOutlined />}
              data-testid="search-input"
            />
            <Select
              placeholder="事件类型"
              value={filterType || undefined}
              onChange={setFilterType}
              style={{ width: 160 }}
              allowClear
              data-testid="filter-type"
            >
              <Select.Option value="一类事">一类事</Select.Option>
              <Select.Option value="二类事">二类事</Select.Option>
              <Select.Option value="三类事">三类事</Select.Option>
            </Select>
            <Select
              placeholder="状态"
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              style={{ width: 140 }}
              allowClear
              data-testid="filter-status"
            >
              <Select.Option value="待处理">待处理</Select.Option>
              <Select.Option value="已受理">已受理</Select.Option>
              <Select.Option value="已办结">已办结</Select.Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/events/new')}
              data-testid="add-event-btn"
            >
              新增事件
            </Button>
          </Space>
        </Card>

        {/* 事件列表 */}
        <div className="event-list">
          {filteredEvents.map(event => (
            <Card
              key={event.id}
              className="event-card"
              data-testid={`event-card-${event.id}`}
              hoverable
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span className="event-type">{event.eventType}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                  <p className="event-content">{event.content}</p>
                  <div className="event-meta">
                    <span>创建时间：{event.createTime}</span>
                    <span>更新时间：{event.updateTime}</span>
                  </div>
                </div>
                <Space align="center">
                  <Tag color={getStatusColor(event.status)} data-testid={`status-${event.id}`}>
                    {event.status}
                  </Tag>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handleView(event)}
                    data-testid={`view-btn-${event.id}`}
                  >
                    查看
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(event)}
                    data-testid={`edit-btn-${event.id}`}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(event)}
                    data-testid={`delete-btn-${event.id}`}
                  >
                    删除
                  </Button>
                </Space>
              </div>
            </Card>
          ))}

          {filteredEvents.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventList