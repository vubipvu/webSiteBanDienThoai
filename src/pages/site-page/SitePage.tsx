import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatVnd } from '../../lib/api'
import { mapProductRow, type Product } from '../../lib/types'
import { useAppearance } from '../../context/AppearanceContext'
import { ZaloQrCard } from '../../components/ZaloQrCard'
import './SitePage.css'

export type SitePageData = {
  slug: string
  nav_label: string
  title: string
  subtitle: string
  content: string
  cover: string
  updated_at: string
}

type Props = {
  slug: string
}

function isSafeMapsEmbedUrl(raw: string) {
  const value = raw.trim()
  if (!value) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    const allowedHost =
      host === 'google.com' ||
      host === 'www.google.com' ||
      host === 'maps.google.com' ||
      host.endsWith('.google.com') ||
      host === 'google.com.vn' ||
      host === 'www.google.com.vn'
    return allowedHost && url.pathname.includes('/maps/embed')
  } catch {
    return false
  }
}

export function SitePage({ slug }: Props) {
  const { appearance } = useAppearance()
  const [page, setPage] = useState<SitePageData | null>(null)
  const [deals, setDeals] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const safeMapUrl = isSafeMapsEmbedUrl(appearance.mapsEmbedUrl)
    ? appearance.mapsEmbedUrl
    : ''
  const showMap = slug === 'gioi-thieu' && Boolean(safeMapUrl)
  const showQr = slug === 'sua-may' || slug === 'lien-he'
  const showDeals = slug === 'khuyen-mai'
  const showShop = slug === 'lien-he'

  useEffect(() => {
    setLoading(true)
    setError('')
    api<{ page: SitePageData }>(`/api/pages/${slug}`)
      .then((d) => setPage(d.page))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải trang'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!showDeals) {
      setDeals([])
      return
    }
    api<{ products: Record<string, unknown>[] }>('/api/products')
      .then((d) =>
        setDeals(
          d.products
            .map(mapProductRow)
            .filter(
              (p) =>
                p.priceMode !== 'contact' &&
                p.originalPrice &&
                p.originalPrice > p.price,
            ),
        ),
      )
      .catch(() => setDeals([]))
  }, [showDeals])

  if (loading) {
    return (
      <div className="page">
        <div className="container">Đang tải nội dung…</div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="page">
        <div className="container">
          <h1>Không tải được trang</h1>
          <p style={{ color: 'var(--muted)', margin: '0.75rem 0 1.25rem' }}>{error}</p>
          <Link to="/" className="btn btn-primary">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  const blocks = page.content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  const zaloMsg =
    slug === 'sua-may'
      ? 'Xin chào ATM66 Mobile, mình cần hỗ trợ sửa máy / tư vấn.'
      : 'Xin chào ATM66 Mobile, mình muốn liên hệ.'

  return (
    <div className="page site-page">
      {page.cover && (
        <div className="site-page__hero" aria-hidden={!page.cover}>
          <img src={page.cover} alt="" />
          <div className="site-page__veil" />
          <div className="container site-page__hero-copy">
            <p className="site-page__eyebrow">{page.nav_label}</p>
            <h1>{page.title}</h1>
            {page.subtitle && <p className="site-page__subtitle">{page.subtitle}</p>}
          </div>
        </div>
      )}

      <div className="container site-page__body">
        <div className={`site-page__layout${showQr ? ' site-page__layout--split' : ''}`}>
          <div className="site-page__main">
            {!page.cover && (
              <div className="page-header">
                <p className="site-page__eyebrow site-page__eyebrow--ink">{page.nav_label}</p>
                <h1>{page.title}</h1>
                {page.subtitle && <p>{page.subtitle}</p>}
              </div>
            )}

            {showShop && (
              <section className="site-page__shop">
                <p>
                  <strong>Địa chỉ</strong>
                  {appearance.shopAddress}
                </p>
                <p>
                  <strong>Hotline / Zalo</strong>
                  {appearance.zaloPhone}
                  {appearance.contactName ? ` (${appearance.contactName})` : ''}
                </p>
                <div className="site-page__shop-actions">
                  <a
                    className="btn btn-accent"
                    href={`${appearance.zaloUrl}?text=${encodeURIComponent(zaloMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Nhắn tin Zalo
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={`tel:${appearance.zaloPhone.replace(/\s+/g, '')}`}
                  >
                    Gọi {appearance.zaloPhone}
                  </a>
                </div>
              </section>
            )}

            <article className="site-page__article">
              {blocks.map((block, i) => {
                const lines = block.split('\n')
                const head = lines[0]
                const rest = lines.slice(1).join(' ').trim()
                const numbered = /^(\d{2})\s*[·.]\s*(.+)$/.exec(head)
                if (numbered) {
                  return (
                    <div key={i} className="site-page__point">
                      <span>{numbered[1]}</span>
                      <div>
                        <h2>{numbered[2]}</h2>
                        {rest && <p>{rest}</p>}
                      </div>
                    </div>
                  )
                }
                return (
                  <p key={i} className="site-page__para">
                    {block.replace(/\n/g, ' ')}
                  </p>
                )
              })}
            </article>

            {showDeals && (
              <section className="site-page__deals">
                <h2>Máy đang giảm giá</h2>
                {deals.length === 0 ? (
                  <p className="site-page__muted">
                    Chưa có máy giảm giá — chỉnh giá gốc &gt; giá bán ở mục Sản phẩm (admin).
                  </p>
                ) : (
                  <div className="site-page__deal-list">
                    {deals.map((p) => {
                      const save = (p.originalPrice ?? 0) - p.price
                      return (
                        <article key={p.id} className="site-page__deal">
                          <img src={p.image} alt="" />
                          <div>
                            <h3>{p.name}</h3>
                            <p>
                              {formatVnd(p.price)}{' '}
                              <span>{formatVnd(p.originalPrice!)}</span>
                            </p>
                            <em>Tiết kiệm {formatVnd(save)}</em>
                          </div>
                          <Link to={`/san-pham/${p.id}`} className="btn btn-ghost">
                            Xem
                          </Link>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )}
          </div>

          {showQr && (
            <aside className="site-page__aside">
              <ZaloQrCard message={zaloMsg} />
            </aside>
          )}
        </div>

        {showMap && (
          <section className="site-page__map" aria-label="Bản đồ ATM66 Mobile">
            <h2>Đến cửa hàng</h2>
            <p className="site-page__map-addr">{appearance.shopAddress}</p>
            <div className="site-page__map-frame">
              <iframe
                title="ATM66 Mobile trên Google Maps"
                src={safeMapUrl}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>
        )}

        <div className="site-page__cta">
          <Link to="/san-pham" className="btn btn-accent">
            Xem sản phẩm
          </Link>
          <Link to="/lien-he" className="btn btn-ghost">
            Liên hệ
          </Link>
          <Link to="/sua-may" className="btn btn-ghost">
            Chat Zalo
          </Link>
        </div>
      </div>
    </div>
  )
}
