import { Link } from 'react-router-dom'
import { isContactPrice, type Product } from '../lib/types'
import { formatVnd } from '../lib/api'
import { ZaloContactButton } from './ZaloContactButton'
import './ProductCard.css'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  const contact = isContactPrice(product)

  return (
    <article className="product-card">
      <Link to={`/san-pham/${product.id}`} className="product-card__media">
        <img src={product.image} alt={product.name} loading="lazy" />
      </Link>
      <div className="product-card__body">
        <div className="product-card__meta">
          {product.hotMonth && <span className="badge badge-warm">Hot tháng</span>}
          {product.condition && (
            <span className="badge badge-teal">{product.condition}</span>
          )}
        </div>
        <Link to={`/san-pham/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <p className="product-card__brand">{product.brand}</p>
        <div className="product-card__price-row">
          {contact ? (
            <strong>Liên hệ</strong>
          ) : (
            <>
              <strong>{formatVnd(product.price)}</strong>
              {product.originalPrice && (
                <span className="product-card__old">
                  {formatVnd(product.originalPrice)}
                </span>
              )}
            </>
          )}
        </div>
        <div className="product-card__actions">
          <Link to={`/san-pham/${product.id}`} className="btn btn-ghost">
            Chi tiết
          </Link>
          <ZaloContactButton productName={product.name}>
            Liên hệ Zalo
          </ZaloContactButton>
        </div>
      </div>
    </article>
  )
}
