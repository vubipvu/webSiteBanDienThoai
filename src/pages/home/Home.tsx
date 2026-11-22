import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatVnd } from '../../lib/api'
import { isContactPrice, mapProductRow, type Product } from '../../lib/types'
import { useAppearance } from '../../context/AppearanceContext'
import { ZaloContactButton } from '../../components/ZaloContactButton'
import './Home.css'

const TICKER = [
  'Đã kiểm định',
  'Pin thật',
  'Giá rõ',
  'Bảo hành 7 ngày',
  'Face ID ổn',
  'Nguồn gốc rõ',
  'Máy cũ chọn kỹ',
]

export function Home() {
  const { appearance } = useAppearance()
  const galleryRef = useRef<HTMLDivElement>(null)
  const [hot, setHot] = useState<Product[]>([])
  const [featured, setFeatured] = useState<Product | null>(null)

  useEffect(() => {
    api<{ products: Record<string, unknown>[] }>('/api/products?hot=1')
      .then((d) => {
        const list = d.products.map(mapProductRow)
        setHot(list)
        const hero =
          list.find((p) => p.id === appearance.featuredProductId) ||
          list.find((p) => p.id === 'iphone-13-pro-campaign') ||
          list[0] ||
          null
        setFeatured(hero)
      })
      .catch(() => {
        setHot([])
        setFeatured(null)
      })
  }, [appearance.featuredProductId])

  const dragGallery = (dir: number) => {
    galleryRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <div className="campaign">
      <section className="camp-hero" aria-label="ATM66 chiến dịch máy cũ">
        <div className="camp-hero__media" aria-hidden="true">
          <img
            className="camp-hero__photo"
            src={
              featured?.image ||
              'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=1800&q=85'
            }
            alt=""
          />
          <div className="camp-hero__veil" />
        </div>
        <div className="camp-hero__content">
          <p className="camp-hero__brand fade-up">{appearance.shopName}</p>
          <h1 className="fade-up fade-up-delay-1">
            {appearance.heroHeadline.split('\n').map((line, i, arr) => (
              <span key={i}>
                {i === arr.length - 1 ? <em>{line}</em> : line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="camp-hero__support fade-up fade-up-delay-2">
            {appearance.heroSupport ||
              (featured
                ? isContactPrice(featured)
                  ? `${featured.name} — Liên hệ Zalo`
                  : `${featured.name} — ${formatVnd(featured.price)}`
                : appearance.slogan)}
          </p>
          <div className="camp-hero__cta fade-up fade-up-delay-3">
            <Link to="/san-pham?hot=1" className="btn btn-accent">
              Xem máy hot
            </Link>
            <Link to="/sua-may" className="btn btn-ghost camp-hero__ghost">
              Sửa máy / Zalo
            </Link>
          </div>
          <a href="#gallery" className="camp-hero__scroll fade-up fade-up-delay-3">
            Kéo xuống
          </a>
        </div>
      </section>

      <div className="camp-ticker" aria-hidden="true">
        <div className="camp-ticker__track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={`${t}-${i}`}>
              {t}
              <i>·</i>
            </span>
          ))}
        </div>
      </div>

      <section id="gallery" className="camp-section camp-gallery">
        <div className="container camp-section__head">
          <h2>Máy hot tháng</h2>
          <p>Máy đang nổi bật tại shop — kéo ngang để xem.</p>
          <div className="camp-gallery__controls">
            <button type="button" onClick={() => dragGallery(-1)} aria-label="Trước">
              ←
            </button>
            <button type="button" onClick={() => dragGallery(1)} aria-label="Sau">
              →
            </button>
          </div>
        </div>
        <div className="camp-gallery__rail" ref={galleryRef}>
          {hot.map((p) => (
            <article key={p.id} className="camp-gallery__item">
              <Link to={`/san-pham/${p.id}`} className="camp-gallery__media">
                <img src={p.image} alt={p.name} loading="lazy" />
              </Link>
              <h3>{p.name}</h3>
              <p>{isContactPrice(p) ? 'Liên hệ' : formatVnd(p.price)}</p>
              <ZaloContactButton productName={p.name} className="btn btn-ghost">
                Liên hệ Zalo
              </ZaloContactButton>
            </article>
          ))}
          {hot.length === 0 && (
            <p className="camp-empty">Chưa có máy hot tháng này — liên hệ Zalo để hỏi máy mới về.</p>
          )}
        </div>
      </section>

      <section id="kiem-tra" className="camp-section camp-process">
        <div className="container camp-process__panel">
          <div>
            <h2>Quy trình thu mua &amp; kiểm định</h2>
            <p>
              Không “máy đẹp trên ảnh” — ATM66 Mobile kiểm tra rồi mới lên kệ. Muốn bán máy
              hoặc xem máy đang bán, nhắn cô Long qua Zalo.
            </p>
          </div>
          <div className="camp-process__actions">
            <Link to="/quy-trinh-thu-mua" className="btn btn-primary">
              Xem quy trình thu mua
            </Link>
            <Link to="/san-pham" className="btn btn-ghost">
              Catalogue
            </Link>
          </div>
        </div>
      </section>

      <section className="camp-life">
        <div className="camp-life__media" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80"
            alt=""
          />
        </div>
        <div className="camp-life__copy">
          <p className="camp-life__eyebrow">ATM66</p>
          <h2>Mua máy cũ cũng phải thấy yên.</h2>
          <p>
            Thu mua máy cũ giá cao · bán máy zin · sửa chữa uy tín (điện thoại, iPad, laptop).
            Nhắn Zalo cô Long hoặc ghé 180 Bùi Đình Tuý.
          </p>
          <div className="camp-life__actions">
            <Link to="/gioi-thieu" className="btn btn-accent">
              Giới thiệu
            </Link>
            <Link to="/sua-may" className="btn btn-ghost">
              Chat Zalo
            </Link>
          </div>
        </div>
      </section>

      <section className="camp-section camp-buy">
        <div className="container camp-buy__panel">
          <div>
            <h2>Sẵn sàng chọn máy?</h2>
            <p>
              {featured
                ? isContactPrice(featured)
                  ? `Nổi bật: ${featured.name} — Liên hệ Zalo`
                  : `Nổi bật: ${featured.name} — ${formatVnd(featured.price)}`
                : 'Duyệt máy hot tháng hoặc toàn bộ catalogue.'}
            </p>
          </div>
          <div className="camp-buy__actions">
            {featured && (
              <ZaloContactButton productName={featured.name}>
                Liên hệ máy nổi bật
              </ZaloContactButton>
            )}
            <Link to="/san-pham" className="btn btn-primary">
              Catalogue
            </Link>
            <Link to="/sua-may" className="btn btn-ghost">
              Chat Zalo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
