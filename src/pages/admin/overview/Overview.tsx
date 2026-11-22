import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatVnd } from '../../../lib/api'
import './Overview.css'

type Stats = {
  ordersToday: number
  revenue: number
  skuCount: number
  inventoryValue: number
  lowStock: Array<{ id: string; name: string; stock: number }>
  recentOrders: Array<{
    id: string
    customer: string
    total: number
    status: string
    items: number
  }>
  popular: Array<{ id: string; name: string; price: number; image: string }>
  salesByCategory: Array<{ category: string; skus: number; units: number }>
}

const categoryLabel: Record<string, string> = {
  moi: 'Máy mới',
  cu: 'Máy cũ',
  'phu-kien': 'Phụ kiện',
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Stats>('/api/admin/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải'))
  }, [])

  if (error) return <p className="admin-error">{error}</p>
  if (!stats) return <p className="admin-muted">Đang tải dashboard…</p>

  const maxUnits = Math.max(...stats.salesByCategory.map((c) => c.units), 1)

  return (
    <div className="admin-overview">
      <div className="admin-kpi-row">
        <article className="admin-kpi">
          <span>Doanh thu đơn</span>
          <strong>{formatVnd(stats.revenue)}</strong>
          <div className="admin-kpi__spark admin-kpi__spark--up" />
          <small>Tổng đơn mẫu trong DB</small>
        </article>
        <article className="admin-kpi">
          <span>Đơn hàng</span>
          <strong>{stats.ordersToday}</strong>
          <div className="admin-kpi__spark admin-kpi__spark--mix" />
          <small>Đang theo dõi</small>
        </article>
        <article className="admin-kpi">
          <span>SKU đang bán</span>
          <strong>{stats.skuCount}</strong>
          <div className="admin-kpi__bars">
            {[40, 70, 55, 85, 60, 90].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
          <small>Từ SQLite local</small>
        </article>
        <article className="admin-kpi admin-kpi--gauge">
          <span>Giá trị tồn</span>
          <div className="admin-gauge">
            <strong>{Math.min(99, Math.round(stats.inventoryValue / 20_000_000))}%</strong>
          </div>
          <small>{formatVnd(stats.inventoryValue)}</small>
        </article>
      </div>

      <div className="admin-panel-row">
        <section className="admin-panel admin-panel--wide">
          <div className="admin-panel__head">
            <h2>Trang nội dung (chỉnh trên web)</h2>
          </div>
          <div className="admin-page-shortcuts">
            <Link to="/admin/giao-dien" className="admin-page-shortcut">
              <strong>Home / Giao diện</strong>
              <span>Slogan, hero, SĐT, địa chỉ, map</span>
            </Link>
            <Link to="/admin/san-pham" className="admin-page-shortcut">
              <strong>Sản phẩm</strong>
              <span>/san-pham — danh sách + chi tiết</span>
            </Link>
            <Link to="/admin/bai-viet" className="admin-page-shortcut">
              <strong>Đăng máy</strong>
              <span>/may-moi — gắn danh mục + sản phẩm</span>
            </Link>
            <Link to="/admin/trang" className="admin-page-shortcut">
              <strong>Sửa máy</strong>
              <span>/sua-may — nội dung + QR</span>
            </Link>
            <Link to="/admin/trang" className="admin-page-shortcut">
              <strong>Khuyến mãi</strong>
              <span>/khuyen-mai — banner + máy giảm</span>
            </Link>
            <Link to="/admin/trang" className="admin-page-shortcut">
              <strong>Quy trình thu mua</strong>
              <span>/quy-trinh-thu-mua</span>
            </Link>
            <Link to="/admin/trang" className="admin-page-shortcut">
              <strong>Bảo hành</strong>
              <span>/bao-hanh</span>
            </Link>
            <Link to="/admin/trang" className="admin-page-shortcut">
              <strong>Giới thiệu</strong>
              <span>/gioi-thieu + map</span>
            </Link>
            <Link to="/admin/trang" className="admin-page-shortcut">
              <strong>Liên hệ</strong>
              <span>/lien-he — chữ + QR (SĐT ở Giao diện)</span>
            </Link>
          </div>
        </section>
      </div>

      <div className="admin-panel-row">
        <section className="admin-panel admin-panel--wide">
          <div className="admin-panel__head">
            <h2>Xu hướng tồn theo danh mục</h2>
            <span className="admin-chip">Năm test</span>
          </div>
          <div className="admin-bars">
            {stats.salesByCategory.map((c) => (
              <div key={c.category} className="admin-bars__col">
                <div
                  className="admin-bars__fill"
                  style={{ height: `${(c.units / maxUnits) * 100}%` }}
                  title={`${c.units} sp`}
                />
                <span>{categoryLabel[c.category] || c.category}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>Tồn thấp</h2>
          </div>
          <ol className="admin-rank">
            {stats.lowStock.map((p, idx) => (
              <li key={p.id}>
                <span className={idx < 3 ? 'is-top' : ''}>{idx + 1}</span>
                <em>{p.name}</em>
                <strong>{p.stock}</strong>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="admin-panel-row">
        <section className="admin-panel admin-panel--wide">
          <div className="admin-panel__head">
            <h2>Đơn gần đây</h2>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách</th>
                  <th>SP</th>
                  <th>Tổng</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer}</td>
                    <td>{o.items}</td>
                    <td>{formatVnd(o.total)}</td>
                    <td>
                      <span className="admin-status">{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
