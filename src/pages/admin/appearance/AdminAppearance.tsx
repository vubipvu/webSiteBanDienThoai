import { useEffect, useState, type FormEvent } from 'react'
import { api, getToken } from '../../../lib/api'
import { useAppearance } from '../../../context/AppearanceContext'
import './AdminAppearance.css'

type FormState = {
  shop_name: string
  slogan: string
  announcement: string
  hero_headline: string
  hero_support: string
  featured_product_id: string
  accent_color: string
  ink_color: string
  mist_color: string
  zalo_phone: string
  shop_address: string
  contact_name: string
  maps_embed_url: string
  logo_path: string
}

const empty: FormState = {
  shop_name: 'ATM66 Mobile',
  slogan: '',
  announcement: '',
  hero_headline: '',
  hero_support: '',
  featured_product_id: '',
  accent_color: '#00b89a',
  ink_color: '#0b1220',
  mist_color: '#e8eef5',
  zalo_phone: '0901339616',
  shop_address: '180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh, Việt Nam',
  contact_name: 'Cô Long',
  maps_embed_url: '',
  logo_path: '',
}

export function AdminAppearance() {
  const { reload } = useAppearance()
  const [form, setForm] = useState<FormState>(empty)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api<{ appearance: Record<string, string> }>('/api/admin/appearance')
      .then((d) => setForm({ ...empty, ...d.appearance }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))
  }, [])

  const onSave = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await api('/api/admin/appearance', {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
      reload()
      setMsg('Đã lưu giao diện cửa hàng.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được')
    }
  }

  const uploadLogo = async (file: File | null) => {
    if (!file) return
    const fd = new FormData()
    fd.append('logo', file)
    const res = await fetch('/api/admin/appearance/logo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    const data = (await res.json()) as { error?: string; logoUrl?: string }
    if (!res.ok) {
      setError(data.error || 'Upload logo thất bại')
      return
    }
    setForm((f) => ({ ...f, logo_path: data.logoUrl || '' }))
    reload()
    setMsg('Đã cập nhật logo.')
  }

  return (
    <div className="admin-appear">
      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Giao diện cửa hàng</h2>
        </div>
        <p className="admin-appear__hint">
          Đổi màu, slogan, announcement, hero, logo — trang chủ đọc từ database (không hard-code).
        </p>
        <form className="admin-appear__form" onSubmit={onSave}>
          <label>
            Tên shop
            <input
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
            />
          </label>
          <label>
            Slogan
            <input
              value={form.slogan}
              onChange={(e) => setForm({ ...form, slogan: e.target.value })}
            />
          </label>
          <label>
            Announcement bar
            <input
              value={form.announcement}
              onChange={(e) => setForm({ ...form, announcement: e.target.value })}
            />
          </label>
          <label>
            Hero headline (xuống dòng = `\n`)
            <textarea
              rows={3}
              value={form.hero_headline}
              onChange={(e) => setForm({ ...form, hero_headline: e.target.value })}
            />
          </label>
          <label>
            Hero support (để trống = hiện tên/giá máy featured)
            <input
              value={form.hero_support}
              onChange={(e) => setForm({ ...form, hero_support: e.target.value })}
            />
          </label>
          <label>
            Featured product id
            <input
              value={form.featured_product_id}
              onChange={(e) =>
                setForm({ ...form, featured_product_id: e.target.value })
              }
            />
          </label>
          <div className="admin-appear__colors">
            <label>
              Accent
              <input
                type="color"
                value={form.accent_color || '#00b89a'}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
              />
            </label>
            <label>
              Ink
              <input
                type="color"
                value={form.ink_color || '#0b1220'}
                onChange={(e) => setForm({ ...form, ink_color: e.target.value })}
              />
            </label>
            <label>
              Mist
              <input
                type="color"
                value={form.mist_color || '#e8eef5'}
                onChange={(e) => setForm({ ...form, mist_color: e.target.value })}
              />
            </label>
          </div>
          <label>
            Zalo / hotline
            <input
              value={form.zalo_phone}
              onChange={(e) => setForm({ ...form, zalo_phone: e.target.value })}
            />
          </label>
          <label>
            Người liên hệ
            <input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              placeholder="Cô Long"
            />
          </label>
          <label>
            Địa chỉ cửa hàng
            <input
              value={form.shop_address}
              onChange={(e) => setForm({ ...form, shop_address: e.target.value })}
            />
          </label>
          <label>
            Google Maps embed URL (src trong iframe)
            <textarea
              rows={3}
              value={form.maps_embed_url}
              onChange={(e) => setForm({ ...form, maps_embed_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </label>
          <label className="admin-upload">
            Logo (upload file)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void uploadLogo(e.target.files?.[0] || null)}
            />
          </label>
          {form.logo_path && (
            <img className="admin-appear__logo" src={form.logo_path} alt="logo" />
          )}
          <button type="submit" className="btn btn-accent">
            Lưu giao diện
          </button>
        </form>
        {msg && <p className="admin-appear__ok">{msg}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>
    </div>
  )
}
