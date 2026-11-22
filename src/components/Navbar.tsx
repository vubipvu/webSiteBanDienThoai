import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAppearance } from '../context/AppearanceContext'
import { api } from '../lib/api'
import './Navbar.css'

type NavPage = { slug: string; nav_label: string }

const fallbackLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/san-pham', label: 'Sản phẩm' },
  { to: '/may-moi', label: 'Máy mới về' },
  { to: '/sua-may', label: 'Sửa máy' },
  { to: '/khuyen-mai', label: 'Khuyến mãi' },
  { to: '/quy-trinh-thu-mua', label: 'Quy trình thu mua' },
  { to: '/bao-hanh', label: 'Bảo hành' },
  { to: '/gioi-thieu', label: 'Giới thiệu' },
  { to: '/lien-he', label: 'Liên hệ' },
]

export function Navbar() {
  const { appearance } = useAppearance()
  const [links, setLinks] = useState(fallbackLinks)

  useEffect(() => {
    api<{ pages: NavPage[] }>('/api/pages')
      .then((d) => {
        const bySlug = new Map(d.pages.map((p) => [p.slug, p.nav_label]))
        setLinks([
          { to: '/', label: 'Home', end: true },
          { to: '/san-pham', label: 'Sản phẩm' },
          { to: '/may-moi', label: 'Máy mới về' },
          { to: '/sua-may', label: 'Sửa máy' },
          { to: '/khuyen-mai', label: 'Khuyến mãi' },
          {
            to: '/quy-trinh-thu-mua',
            label: bySlug.get('quy-trinh-thu-mua') || 'Quy trình thu mua',
          },
          { to: '/bao-hanh', label: 'Bảo hành' },
          {
            to: '/gioi-thieu',
            label: bySlug.get('gioi-thieu') || 'Giới thiệu',
          },
          { to: '/lien-he', label: 'Liên hệ' },
        ])
      })
      .catch(() => setLinks(fallbackLinks))
  }, [])

  return (
    <header className="nav">
      <div className="nav__inner container">
        <Link to="/" className="nav__brand" aria-label={`${appearance.shopName} trang chủ`}>
          {appearance.logoUrl ? (
            <img src={appearance.logoUrl} alt={appearance.shopName} className="nav__logo-img" />
          ) : (
            <>
              <span className="nav__mark">ATM</span>
              <span className="nav__mark-num">66</span>
            </>
          )}
        </Link>

        <nav className="nav__links" aria-label="Điều hướng chính">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav__actions">
          <Link to="/sua-may" className="nav__cta nav__cta--zalo">
            Zalo
          </Link>
        </div>
      </div>
    </header>
  )
}
