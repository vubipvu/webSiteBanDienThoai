import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { api } from '../../lib/api'
import { mapProductRow, type Category, type Product } from '../../lib/types'
import './Products.css'

export function Products() {
  const [searchParams] = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('category') || 'all')
  const [hotOnly, setHotOnly] = useState(searchParams.get('hot') === '1')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'popular' | 'price-asc' | 'price-desc'>('popular')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    setFilter(searchParams.get('category') || 'all')
    setHotOnly(searchParams.get('hot') === '1')
  }, [searchParams])

  useEffect(() => {
    let cancelled = false
    const qs = hotOnly ? '?hot=1' : ''
    setLoading(true)
    setError('')

    const timer = window.setTimeout(() => {
      if (!cancelled) {
        setError(
          'Không tải được sản phẩm — kiểm tra API (npm run dev, Node 22+).',
        )
        setLoading(false)
      }
    }, 12000)

    Promise.all([
      api<{ categories: Category[] }>('/api/categories'),
      api<{ products: Record<string, unknown>[] }>(`/api/products${qs}`),
    ])
      .then(([c, p]) => {
        if (cancelled) return
        setCategories(c.categories || [])
        setProducts((p.products || []).map(mapProductRow))
        setError('')
      })
      .catch((e) => {
        if (cancelled) return
        setCategories([])
        setProducts([])
        setError(e instanceof Error ? e.message : 'Không tải được sản phẩm')
      })
      .finally(() => {
        window.clearTimeout(timer)
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [hotOnly, reloadKey])

  const list = useMemo(() => {
    let next = [...products]
    if (filter !== 'all') next = next.filter((p) => p.category === filter)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      next = next.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q),
      )
    }
    if (sort === 'price-asc') next.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') next.sort((a, b) => b.price - a.price)
    if (sort === 'popular') {
      next.sort(
        (a, b) =>
          Number(b.hotMonth) - Number(a.hotMonth) ||
          Number(b.popular) - Number(a.popular),
      )
    }
    return next
  }, [products, filter, query, sort])

  const reload = () => setReloadKey((k) => k + 1)

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Sản phẩm</h1>
          <p>Máy và phụ kiện tại ATM66 — chọn máy rồi liên hệ Zalo.</p>
        </div>

        <div className="products-toolbar">
          <div className="products-filters" role="tablist" aria-label="Lọc danh mục">
            <button
              type="button"
              className={`products-filter${filter === 'all' ? ' is-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`products-filter${filter === c.id ? ' is-active' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="products-search">
            <input
              type="search"
              placeholder="Tìm iPhone, Samsung, ốp..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="popular">Nổi bật</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="products-count">Đang tải sản phẩm…</p>
        ) : error ? (
          <div className="products-empty">
            <p>{error}</p>
            <button type="button" className="btn btn-accent" onClick={reload}>
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <p className="products-count">{list.length} sản phẩm</p>
            {list.length === 0 ? (
              <p className="products-empty">Không tìm thấy sản phẩm phù hợp.</p>
            ) : (
              <div className="product-grid">
                {list.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
