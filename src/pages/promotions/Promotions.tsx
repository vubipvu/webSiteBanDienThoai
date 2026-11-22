import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatVnd } from '../../lib/api'
import { mapProductRow, type Product } from '../../lib/types'
import './Promotions.css'

export function Promotions() {
  const [deals, setDeals] = useState<Product[]>([])

  useEffect(() => {
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
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Khuyến mãi</h1>
          <p>Ưu đãi lấy từ giá trong database — còn hàng có hạn.</p>
        </div>

        <div className="promo-banner">
          <div>
            <h2>Tặng kính 9H khi mua máy</h2>
            <p>Áp dụng điện thoại mới &amp; cũ. Dán miễn phí tại quầy.</p>
          </div>
          <Link to="/san-pham" className="btn btn-accent">
            Chọn máy ngay
          </Link>
        </div>

        <div className="promo-list">
          {deals.map((p) => {
            const save = (p.originalPrice ?? 0) - p.price
            return (
              <article key={p.id} className="promo-item">
                <img src={p.image} alt="" />
                <div>
                  <h3>{p.name}</h3>
                  <p>
                    {formatVnd(p.price)}{' '}
                    <span className="promo-old">{formatVnd(p.originalPrice!)}</span>
                  </p>
                  <span className="badge badge-warm">Tiết kiệm {formatVnd(save)}</span>
                </div>
                <Link to={`/san-pham/${p.id}`} className="btn btn-ghost">
                  Xem
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
