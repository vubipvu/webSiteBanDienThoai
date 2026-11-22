import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatVnd } from '../../lib/api'
import type { Article } from '../../lib/types'
import { ZaloContactButton } from '../../components/ZaloContactButton'
import './Articles.css'

export function ArticleDetail() {
  const { slug } = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    api<{ article: Article }>(`/api/articles/${slug}`)
      .then((d) => setArticle(d.article))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))
  }, [slug])

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <p>{error}</p>
          <Link to="/may-moi">← Máy mới về</Link>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="page">
        <div className="container">Đang tải…</div>
      </div>
    )
  }

  const cover = article.cover || article.product_image || ''

  return (
    <div className="page">
      <div className="container article-detail">
        <Link to="/may-moi" className="articles-back">
          ← Máy mới về
        </Link>
        <h1>{article.title}</h1>
        <p className="articles-date">{article.created_at}</p>
        {cover && <img className="article-detail__cover" src={cover} alt="" />}

        {article.product_id && (
          <div className="article-detail__product">
            <div>
              <strong>{article.product_name || article.title}</strong>
              <p>
                {article.product_brand ? `${article.product_brand} · ` : ''}
                {article.product_price_mode === 'contact'
                  ? 'Liên hệ Zalo'
                  : article.product_price != null
                    ? formatVnd(article.product_price)
                    : ''}
              </p>
            </div>
            <div className="article-detail__product-actions">
              <Link to={`/san-pham/${article.product_id}`} className="btn btn-accent">
                Xem trang chi tiết sản phẩm
              </Link>
              <ZaloContactButton productName={article.product_name || article.title}>
                Nhắn Zalo
              </ZaloContactButton>
            </div>
          </div>
        )}

        <div className="article-detail__body">
          {article.content.split('\n').map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
