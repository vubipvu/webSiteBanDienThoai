import { Link } from 'react-router-dom'
import { useAppearance } from '../context/AppearanceContext'
import './Footer.css'

export function Footer() {
  const { appearance } = useAppearance()

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__brand">
            <span>ATM</span>
            <span className="footer__brand-num">66</span>
          </div>
          <p className="footer__tag">
            {appearance.shopName} — thu mua máy cũ giá cao · bán máy Zin · sửa chữa uy tín (điện
            thoại, iPad, laptop).
          </p>
        </div>
        <div>
          <h3>Mua sắm</h3>
          <Link to="/san-pham">Sản phẩm</Link>
          <Link to="/may-moi">Máy mới về</Link>
          <Link to="/khuyen-mai">Khuyến mãi</Link>
          <Link to="/sua-may">Sửa máy</Link>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <Link to="/sua-may">Sửa máy (Zalo)</Link>
          <Link to="/bao-hanh">Chính sách bảo hành</Link>
          <Link to="/lien-he">Liên hệ</Link>
          <Link to="/gioi-thieu">Giới thiệu</Link>
          <Link to="/quy-trinh-thu-mua">Quy trình thu mua</Link>
        </div>
        <div>
          <h3>Cửa hàng</h3>
          <p>{appearance.shopAddress}</p>
          <p>
            Hotline: {appearance.zaloPhone}
            {appearance.contactName ? ` (${appearance.contactName})` : ''}
          </p>
          <p>8:30 – 21:00 · Mỗi ngày</p>
        </div>
      </div>
    </footer>
  )
}
