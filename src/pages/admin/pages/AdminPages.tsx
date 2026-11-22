import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, getToken } from '../../../lib/api'
import './AdminPages.css'

type PageRow = {
  slug: string
  nav_label: string
  title: string
  subtitle: string
  content: string
  cover: string
  updated_at: string
}

const PAGE_ORDER = [
  'gioi-thieu',
  'quy-trinh-thu-mua',
  'sua-may',
  'khuyen-mai',
  'bao-hanh',
  'lien-he',
]

const PAGE_META: Record<string, { path: string; hint: string }> = {
  'gioi-thieu': {
    path: '/gioi-thieu',
    hint: 'Giới thiệu shop + bản đồ Google Maps',
  },
  'quy-trinh-thu-mua': {
    path: '/quy-trinh-thu-mua',
    hint: 'Quy trình thu mua & kiểm định máy',
  },
  'sua-may': {
    path: '/sua-may',
    hint: 'Trang sửa máy + thẻ QR Zalo Cô Long',
  },
  'khuyen-mai': {
    path: '/khuyen-mai',
    hint: 'Nội dung khuyến mãi + danh sách máy giảm giá (từ Sản phẩm)',
  },
  'bao-hanh': {
    path: '/bao-hanh',
    hint: 'Chính sách bảo hành',
  },
  'lien-he': {
    path: '/lien-he',
    hint: 'Nội dung liên hệ + QR Zalo (SĐT/địa chỉ sửa ở Giao diện)',
  },
}

export function AdminPages() {
  const [pages, setPages] = useState<PageRow[]>([])
  const [active, setActive] = useState('gioi-thieu')
  const [form, setForm] = useState({
    nav_label: '',
    title: '',
    subtitle: '',
    content: '',
    cover: '',
  })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const orderedPages = [...pages].sort((a, b) => {
    const ia = PAGE_ORDER.indexOf(a.slug)
    const ib = PAGE_ORDER.indexOf(b.slug)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  const load = () =>
    api<{ pages: PageRow[] }>('/api/admin/pages')
      .then((d) => {
        setPages(d.pages)
        const cur =
          d.pages.find((p) => p.slug === active) ||
          d.pages.find((p) => p.slug === 'gioi-thieu') ||
          d.pages[0]
        if (cur) {
          setActive(cur.slug)
          setForm({
            nav_label: cur.nav_label,
            title: cur.title,
            subtitle: cur.subtitle,
            content: cur.content,
            cover: cur.cover,
          })
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = (slug: string) => {
    const p = pages.find((x) => x.slug === slug)
    if (!p) return
    setActive(slug)
    setForm({
      nav_label: p.nav_label,
      title: p.title,
      subtitle: p.subtitle,
      content: p.content,
      cover: p.cover,
    })
    setMsg('')
    setError('')
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      const d = await api<{ page: PageRow }>(`/api/admin/pages/${active}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nav_label: form.nav_label,
          title: form.title,
          subtitle: form.subtitle,
          content: form.content,
        }),
      })
      setPages((prev) => prev.map((p) => (p.slug === active ? d.page : p)))
      setForm((f) => ({ ...f, cover: d.page.cover }))
      setMsg('Đã lưu trang.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được')
    }
  }

  const uploadCover = async (file: File | null) => {
    if (!file) return
    setError('')
    const fd = new FormData()
    fd.append('cover', file)
    const res = await fetch(`/api/admin/pages/${active}/cover`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    const data = (await res.json()) as { error?: string; page?: PageRow }
    if (!res.ok || !data.page) {
      setError(data.error || 'Upload ảnh thất bại')
      return
    }
    setPages((prev) => prev.map((p) => (p.slug === active ? data.page! : p)))
    setForm((f) => ({ ...f, cover: data.page!.cover }))
    setMsg('Đã cập nhật ảnh bìa.')
  }

  const meta = PAGE_META[active]

  return (
    <div className="admin-pages">
      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Trang nội dung storefront</h2>
        </div>
        <p className="admin-pages__hint">
          Sửa các trang trên menu khách (trừ Home / Sản phẩm / Tin tức — dùng mục riêng). Mỗi đoạn
          cách nhau bằng dòng trống; dòng dạng <code>01 · Tiêu đề</code> hiện thành mục đánh số.
          SĐT &amp; địa chỉ sửa ở <Link to="/admin/giao-dien">Giao diện</Link>.
        </p>

        <div className="admin-pages__tabs">
          {orderedPages.map((p) => (
            <button
              key={p.slug}
              type="button"
              className={`admin-pages__tab${active === p.slug ? ' is-active' : ''}`}
              onClick={() => select(p.slug)}
            >
              {p.nav_label || PAGE_META[p.slug]?.path || p.slug}
            </button>
          ))}
        </div>

        {meta && (
          <p className="admin-pages__meta">
            {meta.hint} ·{' '}
            <Link to={meta.path} target="_blank" rel="noreferrer">
              Xem {meta.path}
            </Link>
          </p>
        )}

        <form className="admin-pages__form" onSubmit={onSave}>
          <label>
            Nhãn menu
            <input
              value={form.nav_label}
              onChange={(e) => setForm({ ...form, nav_label: e.target.value })}
              required
            />
          </label>
          <label>
            Tiêu đề trang
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Mô tả ngắn (dưới tiêu đề)
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </label>
          <label>
            Nội dung
            <textarea
              rows={14}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </label>
          <label className="admin-upload">
            Ảnh bìa (tuỳ chọn)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void uploadCover(e.target.files?.[0] || null)}
            />
          </label>
          {form.cover ? <img className="admin-pages__cover" src={form.cover} alt="" /> : null}
          <button type="submit" className="btn btn-accent">
            Lưu trang
          </button>
        </form>
        {msg && <p className="admin-ok">{msg}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>
    </div>
  )
}
