import { Link } from 'react-router-dom'
import { ZaloQrCard } from '../../components/ZaloQrCard'
import { useAppearance } from '../../context/AppearanceContext'
import './Contact.css'

export function Contact() {
  const { appearance } = useAppearance()
  const phone = appearance.zaloPhone
  const contact = appearance.contactName || 'Cô Long'
  const zaloHref = `${appearance.zaloUrl}?text=${encodeURIComponent(
    `Xin chào ATM66 Mobile, mình muốn liên hệ.`,
  )}`

  return (
    <div className="page">
      <div className="container contact">
        <div className="page-header">
          <h1>Liên hệ</h1>
          <p>
            Quét QR Zalo {contact} hoặc nhắn tin — {appearance.shopName} phản hồi trong giờ làm
            việc.
          </p>
        </div>

        <div className="contact-grid">
          <section className="contact-info">
            <h2>Cửa hàng</h2>
            <p>
              <strong>Địa chỉ</strong>
              {appearance.shopAddress}
            </p>
            <p>
              <strong>Hotline / Zalo</strong>
              {phone}
              {` (${contact})`}
            </p>
            <p>
              <strong>Giờ mở cửa</strong>
              8:30 – 21:00 · Mỗi ngày (kể cả lễ)
            </p>
            <p className="contact-map-link">
              Xem bản đồ trên trang{' '}
              <Link to="/gioi-thieu">Giới thiệu</Link>.
            </p>
            <div className="contact-actions">
              <a className="btn btn-accent" href={zaloHref} target="_blank" rel="noopener noreferrer">
                Nhắn tin Zalo
              </a>
              <a className="btn btn-ghost" href={`tel:${phone.replace(/\s+/g, '')}`}>
                Gọi {phone}
              </a>
            </div>
          </section>

          <ZaloQrCard />
        </div>
      </div>
    </div>
  )
}
