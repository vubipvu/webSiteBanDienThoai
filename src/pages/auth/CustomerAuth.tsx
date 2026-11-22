import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './CustomerAuth.css'

export function CustomerAuth() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '',
    password: '',
    displayName: '',
    phone: '',
  })

  if (user) {
    return (
      <div className="page">
        <div className="container auth-box">
          <h1>Xin chào, {user.displayName}</h1>
          <p>Bạn đang đăng nhập ({user.role}). Có thể tiếp tục mua mà không bắt buộc.</p>
          <div className="auth-actions">
            <Link to="/san-pham" className="btn btn-accent">
              Mua sắm
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-ghost">
                Vào admin
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') {
        const u = await login(form.username, form.password)
        navigate(u.role === 'admin' ? '/admin' : '/san-pham')
      } else {
        await register({
          username: form.username,
          password: form.password,
          displayName: form.displayName || form.username,
          phone: form.phone,
        })
        navigate('/san-pham')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thất bại')
    }
  }

  return (
    <div className="page">
      <div className="container auth-box">
        <h1>{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p>
          Tùy chọn — bạn vẫn mua được khi chưa đăng nhập. Admin dùng nick riêng tại{' '}
          <Link to="/admin/login">/admin/login</Link>.
        </p>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => setMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => setMode('register')}
          >
            Đăng ký
          </button>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <label>
                Họ tên
                <input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  required
                />
              </label>
              <label>
                Số điện thoại
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
            </>
          )}
          <label>
            Tài khoản
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn btn-accent">
            {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-skip">
          <Link to="/san-pham">Bỏ qua — tiếp tục xem máy</Link>
        </p>
      </div>
    </div>
  )
}
