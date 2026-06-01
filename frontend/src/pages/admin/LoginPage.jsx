import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { login } from '../../api/auth'
import '../../styles/admin.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      message.warning('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await login(username.trim(), password)
      if (res.data.code === 200) {
        localStorage.setItem('admin_token', res.data.data.token)
        localStorage.setItem('admin_user', res.data.data.username)
        message.success('登录成功')
        navigate('/admin/cd', { replace: true })
      }
    } catch (e) {
      const msg = e.response?.data?.msg || '登录失败'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow--1" />
      <div className="login-glow login-glow--2" />
      <div className="login-glow login-glow--3" />

      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo">
            <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#1677ff" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#1677ff" opacity="0.6" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#1677ff" opacity="0.6" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#1677ff" opacity="0.3" />
            </svg>
          </div>
          <h1>后台管理系统</h1>
          <p>胶州市家居产业服务"一类事"</p>
        </div>

        <div className="login-card__form">
          <Input
            size="large"
            prefix={<UserOutlined style={{ color: '#999' }} />}
            placeholder="用户名"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <Input.Password
            size="large"
            prefix={<LockOutlined style={{ color: '#999' }} />}
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleLogin}
          >
            登 录
          </Button>
        </div>
      </div>
    </div>
  )
}
