import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import './Login.css'

export function AdminLogin() {
  const navigate = useNavigate()
  const { login, loading, isAdmin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && isAdmin) return <Navigate to="/admin" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const u = await login(username.trim(), password)
      if (u.role !== 'admin') {
        setError('Tài khoản này không phải admin')
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={onSubmit} autoComplete="on">
        <div className="admin-login__brand" aria-label="ATM66">
          ATM<span>66</span>
        </div>
        <h1>Đăng nhập quản trị</h1>
        <p>Chỉ dành cho quản lý cửa hàng ATM66 Mobile.</p>

        <label>
          Tài khoản
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            placeholder="Tên đăng nhập"
          />
        </label>

        <label>
          Mật khẩu
          <div className="admin-login__password">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Nhập mật khẩu"
            />
            <button
              type="button"
              className="admin-login__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
        </label>

        {error && (
          <p className="admin-login__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-accent admin-login__submit" disabled={busy || loading}>
          {busy ? 'Đang vào…' : 'Đăng nhập'}
        </button>

        <Link to="/" className="admin-login__back">
          ← Về trang cửa hàng
        </Link>
      </form>
    </div>
  )
}
