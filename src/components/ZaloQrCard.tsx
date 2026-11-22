import { useAppearance } from '../context/AppearanceContext'
import './ZaloQrCard.css'

const ZALO_QR = '/brand/zalo-qr-co-long.png'
const ZALO_AVATAR = '/brand/zalo-icon.svg'
const DISPLAY_NAME = 'Cô Long'

type Props = {
  className?: string
  message?: string
}

export function ZaloQrCard({ className = '', message }: Props) {
  const { appearance } = useAppearance()
  const zaloHref = `${appearance.zaloUrl}?text=${encodeURIComponent(
    message || `Xin chào ATM66 Mobile, mình muốn liên hệ cô Long.`,
  )}`

  return (
    <aside className={`zalo-qr-card ${className}`.trim()}>
      <a className="zalo-qr-card__qr-link" href={zaloHref} target="_blank" rel="noopener noreferrer">
        <img
          className="zalo-qr-card__qr"
          src={ZALO_QR}
          alt={`Mã QR Zalo ${DISPLAY_NAME} — ATM66 Mobile`}
          width={480}
          height={520}
        />
      </a>

      <div className="zalo-qr-card__person">
        <span className="zalo-qr-card__avatar" aria-hidden="true">
          <img src={ZALO_AVATAR} alt="" width={44} height={44} />
        </span>
        <div>
          <p className="zalo-qr-card__name">{DISPLAY_NAME}</p>
          <p className="zalo-qr-card__hint">Quét QR hoặc nhắn Zalo</p>
        </div>
      </div>

      <a className="zalo-qr-card__btn" href={zaloHref} target="_blank" rel="noopener noreferrer">
        Nhắn tin Zalo
      </a>
    </aside>
  )
}
