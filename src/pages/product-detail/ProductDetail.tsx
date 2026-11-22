import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatVnd } from '../../lib/api'
import {
  isContactPrice,
  mapProductRow,
  type Product,
  type ProductImage,
} from '../../lib/types'
import { ZaloContactButton } from '../../components/ZaloContactButton'
import './ProductDetail.css'

export function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [active, setActive] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api<{ product: Record<string, unknown>; images: ProductImage[] }>(
      `/api/products/${id}`,
    )
      .then((d) => {
        setProduct(mapProductRow(d.product))
        const imgs =
          d.images?.length > 0
            ? d.images
            : [
                {
                  id: 0,
                  product_id: String(d.product.id),
                  path: String(d.product.image || ''),
                  sort_order: 0,
                  is_cover: 1,
                },
              ]
        setImages(imgs)
        setActive(0)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <div className="container">Đang tải sản phẩm…</div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page">
        <div className="container">
          <h1>Không tìm thấy sản phẩm</h1>
          <p style={{ margin: '1rem 0', color: 'var(--muted)' }}>{error}</p>
          <Link to="/san-pham" className="btn btn-primary">
            Quay lại sản phẩm
          </Link>
        </div>
      </div>
    )
  }

  const mainSrc = images[active]?.path || product.image
  const contact = isContactPrice(product)

  return (
    <div className="page">
      <div className="container detail">
        <Link to="/san-pham" className="detail__back">
          ← Tất cả sản phẩm
        </Link>
        <div className="detail__grid">
          <div className="detail__gallery">
            <div className="detail__media">
              <img src={mainSrc} alt={product.name} />
            </div>
            {images.length > 1 && (
              <div className="detail__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    type="button"
                    className={`detail__thumb${i === active ? ' is-active' : ''}`}
                    onClick={() => setActive(i)}
                  >
                    <img src={img.path} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="detail__info">
            <div className="detail__meta">
              {product.hotMonth && (
                <span className="badge badge-warm">Hot tháng</span>
              )}
              {product.condition && (
                <span className="badge badge-teal">{product.condition}</span>
              )}
            </div>
            <h1>{product.name}</h1>
            <p className="detail__brand">{product.brand}</p>
            <div className="detail__price">
              {contact ? (
                <strong>Liên hệ Zalo</strong>
              ) : (
                <>
                  <strong>{formatVnd(product.price)}</strong>
                  {product.originalPrice && (
                    <span>{formatVnd(product.originalPrice)}</span>
                  )}
                </>
              )}
            </div>
            <p className="detail__desc">{product.description}</p>
            <dl className="detail__specs">
              {product.storage && (
                <>
                  <dt>Bộ nhớ</dt>
                  <dd>{product.storage}</dd>
                </>
              )}
              {product.color && (
                <>
                  <dt>Màu</dt>
                  <dd>{product.color}</dd>
                </>
              )}
              {images.length > 1 && (
                <>
                  <dt>Ảnh</dt>
                  <dd>{images.length} ảnh</dd>
                </>
              )}
            </dl>
            <div className="detail__actions">
              <ZaloContactButton productName={product.name}>
                Liên hệ Zalo
              </ZaloContactButton>
              <Link to="/sua-may" className="btn btn-ghost">
                Sửa máy / Zalo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
