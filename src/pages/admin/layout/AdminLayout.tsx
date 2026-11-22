import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import './AdminLayout.css'

const links = [
  { to: '/admin', label: 'Dashboard', end: true, icon: '▦' },
  { to: '/admin/danh-muc', label: 'Danh mục', icon: '▣' },
  { to: '/admin/san-pham', label: 'Sản phẩm', icon: '☰' },
  { to: '/admin/bai-viet', label: 'Đăng máy', icon: '✎' },
  { to: '/admin/trang', label: 'Trang nội dung', icon: '◫' },
  { to: '/admin/don-hang', label: 'Đơn hàng', icon: '☑' },
  { to: '/admin/giao-dien', label: 'Giao diện', icon: '◈' },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const { user, loading, logout, isAdmin } = useAuth()

  if (loading) return <div className="admin-loading">Đang kiểm tra phiên…</div>
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  const onLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-side__brand">
          <span className="admin-side__logo">A66</span>
          <strong>ATM66 Admin</strong>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `admin-side__link${isActive ? ' is-active' : ''}`
              }
            >
              <span aria-hidden="true">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Link className="admin-side__store" to="/">
          ← Về cửa hàng
        </Link>
      </aside>

      <div className="admin-main">
        <header className="admin-top">
          <div className="admin-top__search" aria-hidden="true">
            ⌕
          </div>
          <div className="admin-top__right">
            <span className="admin-top__bell" title="Thông báo demo">
              🔔<span>3</span>
            </span>
            <div className="admin-top__user">
              <span className="admin-top__avatar">QT</span>
              <span>{user.displayName}</span>
            </div>
            <button type="button" className="admin-top__logout" onClick={onLogout}>
              Thoát
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
