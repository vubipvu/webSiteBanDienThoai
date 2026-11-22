import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatVnd } from '../../lib/api'
import type { Article } from '../../lib/types'
import './Articles.css'

export function Articles() {
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    api<{ articles: Article[] }>('/api/articles')
      .then((d) => setArticles(d.articles))
      .catch(() => setArticles([]))
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1>Máy mới về</h1>
          <p>
            Bài đăng máy nổi bật (mới / cũ) — xem nhanh rồi mở chi tiết sản phẩm để hỏi Zalo.
          </p>
        </div>
        <div className="articles-list">
          {articles.map((a) => {
            const thumb = a.cover || a.product_image || ''
            return (
              <article key={a.id} className="articles-item">
                {thumb ? <img src={thumb} alt="" /> : <div className="articles-item__ph" />}
                <div>
                  <h2>
                    <Link to={`/may-moi/${a.slug}`}>{a.title}</Link>
                  </h2>
                  <p>{a.excerpt}</p>
                  <div className="articles-item__meta">
                    <span>{a.created_at}</span>
                    {a.product_id && (
                      <Link to={`/san-pham/${a.product_id}`} className="articles-item__product">
                        Xem chi tiết sản phẩm
                        {a.product_price_mode === 'contact'
                          ? ' · Liên hệ'
                          : a.product_price != null
                            ? ` · ${formatVnd(a.product_price)}`
                            : ''}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
          {articles.length === 0 && (
            <p style={{ color: 'var(--muted)' }}>Chưa có máy đăng mới.</p>
          )}
        </div>
      </div>
    </div>
  )
}
