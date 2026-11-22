import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, formatVnd, getToken } from '../../../lib/api'
import type { ProductImage } from '../../../lib/types'
import './AdminProducts.css'

type ProductRow = {
  id: string
  name: string
  brand: string
  category: string
  price: number
  original_price?: number | null
  stock: number
  popular: number
  hot_month: number
  price_mode?: string
  image: string
  condition?: string | null
  storage?: string | null
  color?: string | null
  description?: string
}

type Cat = { id: string; name: string }

type DetailForm = {
  name: string
  brand: string
  category: string
  price: string
  original_price: string
  stock: string
  hot_month: boolean
  price_mode: 'price' | 'contact'
  condition: string
  storage: string
  color: string
  description: string
}

const emptyCreate = {
  id: '',
  name: '',
  brand: 'ATM66',
  category: 'phu-kien',
  price: '',
  stock: '10',
  hot_month: false,
  price_mode: 'price' as 'price' | 'contact',
  condition: '',
  storage: '',
  color: '',
  description: '',
}

function toDetailForm(p: ProductRow): DetailForm {
  return {
    name: p.name || '',
    brand: p.brand || 'ATM66',
    category: p.category || 'phu-kien',
    price: String(p.price ?? 0),
    original_price: p.original_price != null ? String(p.original_price) : '',
    stock: String(p.stock ?? 0),
    hot_month: Boolean(p.hot_month),
    price_mode: p.price_mode === 'contact' ? 'contact' : 'price',
    condition: p.condition || '',
    storage: p.storage || '',
    color: p.color || '',
    description: p.description || '',
  }
}

export function AdminProducts() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Cat[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [form, setForm] = useState(emptyCreate)
  const [detail, setDetail] = useState<DetailForm | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () =>
    Promise.all([
      api<{ products: ProductRow[] }>('/api/admin/products'),
      api<{ categories: Cat[] }>('/api/admin/categories'),
    ])
      .then(([p, c]) => {
        setProducts(p.products)
        setCategories(c.categories)
        if (c.categories[0] && !c.categories.find((x) => x.id === form.category)) {
          setForm((f) => ({ ...f, category: c.categories[0].id }))
        }
        if (selectedId) {
          const row = p.products.find((x) => x.id === selectedId)
          if (row) setDetail(toDetailForm(row))
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))

  const loadImages = (id: string) =>
    api<{ images: ProductImage[] }>(`/api/admin/products/${id}/images`)
      .then((d) => setImages(d.images))
      .catch(() => setImages([]))

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectProduct = (id: string) => {
    setSelectedId(id)
    setMsg('')
    setError('')
    const row = products.find((p) => p.id === id)
    if (row) setDetail(toDetailForm(row))
    void loadImages(id)
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await api('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          price: form.price_mode === 'contact' ? 0 : Number(form.price),
          stock: Number(form.stock),
          hot_month: form.hot_month,
          price_mode: form.price_mode,
          condition: form.condition || null,
          storage: form.storage || null,
          color: form.color || null,
          description:
            form.description.trim() || `${form.name} — ATM66 Mobile`,
        }),
      })
      setForm({ ...emptyCreate, category: categories[0]?.id || 'phu-kien' })
      setMsg('Đã thêm sản phẩm')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được')
    }
  }

  const onSaveDetail = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedId || !detail) return
    setSaving(true)
    setError('')
    setMsg('')
    try {
      await api(`/api/admin/products/${selectedId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: detail.name.trim(),
          brand: detail.brand.trim(),
          category: detail.category,
          price: detail.price_mode === 'contact' ? 0 : Number(detail.price || 0),
          original_price: detail.original_price
            ? Number(detail.original_price)
            : null,
          stock: Number(detail.stock || 0),
          hot_month: detail.hot_month,
          price_mode: detail.price_mode,
          condition: detail.condition.trim() || null,
          storage: detail.storage.trim() || null,
          color: detail.color.trim() || null,
          description: detail.description,
        }),
      })
      setMsg('Đã lưu chi tiết sản phẩm (hiện trên trang khách)')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được')
    } finally {
      setSaving(false)
    }
  }

  const updateStock = async (id: string, stock: number) => {
    await api(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    })
    await load()
  }

  const toggleHot = async (p: ProductRow) => {
    await api(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ hot_month: !p.hot_month }),
    })
    await load()
  }

  const togglePriceMode = async (p: ProductRow) => {
    const next = p.price_mode === 'contact' ? 'price' : 'contact'
    await api(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ price_mode: next }),
    })
    await load()
  }

  const remove = async (id: string) => {
    if (!confirm(`Xóa sản phẩm ${id}?`)) return
    await api(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (selectedId === id) {
      setSelectedId(null)
      setDetail(null)
      setImages([])
    }
    await load()
  }

  const uploadFiles = async (files: FileList | null) => {
    if (!selectedId || !files?.length) return
    setError('')
    const fd = new FormData()
    Array.from(files).forEach((f) => fd.append('images', f))
    const res = await fetch(`/api/admin/products/${selectedId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    const data = (await res.json()) as { error?: string; images?: ProductImage[] }
    if (!res.ok) {
      setError(data.error || 'Upload thất bại')
      return
    }
    setImages(data.images || [])
    await load()
  }

  const setCover = async (imageId: number) => {
    if (!selectedId) return
    const d = await api<{ images: ProductImage[] }>(
      `/api/admin/products/${selectedId}/images/${imageId}`,
      { method: 'PATCH', body: JSON.stringify({ is_cover: true }) },
    )
    setImages(d.images)
    await load()
  }

  const deleteImage = async (imageId: number) => {
    if (!selectedId || !confirm('Xóa ảnh này?')) return
    const d = await api<{ images: ProductImage[] }>(
      `/api/admin/products/${selectedId}/images/${imageId}`,
      { method: 'DELETE' },
    )
    setImages(d.images)
    await load()
  }

  const replaceImage = async (imageId: number, file: File | null) => {
    if (!selectedId || !file) return
    const fd = new FormData()
    fd.append('image', file)
    const res = await fetch(
      `/api/admin/products/${selectedId}/images/${imageId}/replace`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      },
    )
    const data = (await res.json()) as { error?: string; images?: ProductImage[] }
    if (!res.ok) {
      setError(data.error || 'Thay ảnh thất bại')
      return
    }
    setImages(data.images || [])
    await load()
  }

  return (
    <div className="admin-products">
      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Thêm sản phẩm</h2>
        </div>
        <p className="admin-products__hint">
          Sau khi thêm, chọn sản phẩm trong bảng để sửa <strong>chi tiết trang khách</strong>{' '}
          (mô tả, bộ nhớ, màu, tình trạng, ảnh…).
        </p>
        <form className="admin-form" onSubmit={onCreate}>
          <input
            placeholder="id (vd: iphone-13)"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            required
          />
          <input
            placeholder="Tên"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Hãng"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <fieldset className="admin-price-mode">
            <legend>Giá bán</legend>
            <label className="admin-check">
              <input
                type="radio"
                name="price_mode_create"
                checked={form.price_mode === 'price'}
                onChange={() => setForm({ ...form, price_mode: 'price' })}
              />
              Hiện giá
            </label>
            <label className="admin-check">
              <input
                type="radio"
                name="price_mode_create"
                checked={form.price_mode === 'contact'}
                onChange={() => setForm({ ...form, price_mode: 'contact' })}
              />
              Liên hệ Zalo
            </label>
          </fieldset>
          {form.price_mode === 'price' && (
            <input
              placeholder="Giá VND"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          )}
          <input
            placeholder="Tồn"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <input
            placeholder="Tình trạng (vd: 99%)"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
          />
          <input
            placeholder="Bộ nhớ (vd: 256GB)"
            value={form.storage}
            onChange={(e) => setForm({ ...form, storage: e.target.value })}
          />
          <input
            placeholder="Màu"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <textarea
            className="admin-form__full"
            placeholder="Mô tả hiện trên trang chi tiết"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.hot_month}
              onChange={(e) => setForm({ ...form, hot_month: e.target.checked })}
            />
            Máy hot tháng
          </label>
          <button type="submit" className="btn btn-accent">
            Thêm
          </button>
        </form>
        {error && <p className="admin-error">{error}</p>}
        {msg && !selectedId && <p className="admin-ok">{msg}</p>}
      </div>

      <div className="admin-products__split">
        <div className="admin-panel">
          <div className="admin-panel__head">
            <h2>Sản phẩm ({products.length})</h2>
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Tồn</th>
                  <th>Hot</th>
                  <th>Chế độ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className={selectedId === p.id ? 'is-selected' : ''}
                    onClick={() => selectProduct(p.id)}
                  >
                    <td>
                      <img className="admin-thumb" src={p.image} alt="" />
                    </td>
                    <td>
                      {p.name}
                      <div className="admin-products__meta">
                        {p.id} · {p.category}
                      </div>
                    </td>
                    <td>
                      {p.price_mode === 'contact' ? 'Liên hệ' : formatVnd(p.price)}
                    </td>
                    <td>
                      <input
                        className="admin-stock"
                        type="number"
                        defaultValue={p.stock}
                        key={`${p.id}-${p.stock}`}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          const next = Number(e.target.value)
                          if (next !== p.stock) void updateStock(p.id, next)
                        }}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-hot-btn${p.hot_month ? ' is-on' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          void toggleHot(p)
                        }}
                      >
                        {p.hot_month ? 'Hot' : 'Chọn'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`admin-hot-btn${p.price_mode === 'contact' ? ' is-on' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          void togglePriceMode(p)
                        }}
                        title="Đổi Hiện giá / Liên hệ Zalo"
                      >
                        {p.price_mode === 'contact' ? 'Liên hệ Zalo' : 'Hiện giá'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-link-btn admin-link-btn--edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectProduct(p.id)
                        }}
                      >
                        Sửa chi tiết
                      </button>{' '}
                      <Link
                        to={`/san-pham/${p.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Xem
                      </Link>{' '}
                      <button
                        type="button"
                        className="admin-link-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          void remove(p.id)
                        }}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel__head">
            <h2>
              {selectedId ? `Chi tiết trang khách · ${selectedId}` : 'Chi tiết trang khách'}
            </h2>
            {selectedId && (
              <Link
                className="admin-chip-link"
                to={`/san-pham/${selectedId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mở /san-pham/{selectedId}
              </Link>
            )}
          </div>

          {!selectedId || !detail ? (
            <p className="admin-muted">
              Chọn một sản phẩm bên trái để sửa nội dung trang chi tiết (mô tả, thông số, ảnh
              gallery).
            </p>
          ) : (
            <>
              <form className="admin-detail-form" onSubmit={onSaveDetail}>
                <label>
                  Tên hiển thị
                  <input
                    value={detail.name}
                    onChange={(e) => setDetail({ ...detail, name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Hãng
                  <input
                    value={detail.brand}
                    onChange={(e) => setDetail({ ...detail, brand: e.target.value })}
                  />
                </label>
                <label>
                  Danh mục
                  <select
                    value={detail.category}
                    onChange={(e) => setDetail({ ...detail, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="admin-price-mode">
                  <legend>Giá trên trang chi tiết</legend>
                  <label className="admin-check">
                    <input
                      type="radio"
                      name="price_mode_detail"
                      checked={detail.price_mode === 'price'}
                      onChange={() => setDetail({ ...detail, price_mode: 'price' })}
                    />
                    Hiện giá
                  </label>
                  <label className="admin-check">
                    <input
                      type="radio"
                      name="price_mode_detail"
                      checked={detail.price_mode === 'contact'}
                      onChange={() => setDetail({ ...detail, price_mode: 'contact' })}
                    />
                    Liên hệ Zalo
                  </label>
                </fieldset>

                {detail.price_mode === 'price' && (
                  <>
                    <label>
                      Giá VND
                      <input
                        type="number"
                        value={detail.price}
                        onChange={(e) => setDetail({ ...detail, price: e.target.value })}
                      />
                    </label>
                    <label>
                      Giá gốc (gạch)
                      <input
                        type="number"
                        value={detail.original_price}
                        onChange={(e) =>
                          setDetail({ ...detail, original_price: e.target.value })
                        }
                        placeholder="Tuỳ chọn"
                      />
                    </label>
                  </>
                )}

                <label>
                  Tồn kho
                  <input
                    type="number"
                    value={detail.stock}
                    onChange={(e) => setDetail({ ...detail, stock: e.target.value })}
                  />
                </label>
                <label>
                  Tình trạng
                  <input
                    value={detail.condition}
                    onChange={(e) => setDetail({ ...detail, condition: e.target.value })}
                    placeholder="vd: Như mới 99%"
                  />
                </label>
                <label>
                  Bộ nhớ
                  <input
                    value={detail.storage}
                    onChange={(e) => setDetail({ ...detail, storage: e.target.value })}
                    placeholder="vd: 256GB"
                  />
                </label>
                <label>
                  Màu
                  <input
                    value={detail.color}
                    onChange={(e) => setDetail({ ...detail, color: e.target.value })}
                    placeholder="vd: Graphite"
                  />
                </label>
                <label className="admin-detail-form__full">
                  Mô tả (trang chi tiết)
                  <textarea
                    rows={5}
                    value={detail.description}
                    onChange={(e) => setDetail({ ...detail, description: e.target.value })}
                    placeholder="Nội dung khách đọc trên /san-pham/…"
                  />
                </label>
                <label className="admin-check admin-detail-form__full">
                  <input
                    type="checkbox"
                    checked={detail.hot_month}
                    onChange={(e) =>
                      setDetail({ ...detail, hot_month: e.target.checked })
                    }
                  />
                  Máy hot tháng (hiện gallery trang chủ)
                </label>
                <div className="admin-detail-form__actions">
                  <button type="submit" className="btn btn-accent" disabled={saving}>
                    {saving ? 'Đang lưu…' : 'Lưu chi tiết'}
                  </button>
                </div>
              </form>

              {msg && selectedId && <p className="admin-ok">{msg}</p>}
              {error && selectedId && <p className="admin-error">{error}</p>}

              <div className="admin-detail-images">
                <h3>Ảnh gallery trang chi tiết</h3>
                <label className="admin-upload">
                  <span>Thêm ảnh từ máy (nhiều file)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void uploadFiles(e.target.files)}
                  />
                </label>
                <div className="admin-imgs">
                  {images.map((img) => (
                    <figure key={img.id} className="admin-img">
                      <img src={img.path} alt="" />
                      <figcaption>{img.is_cover ? 'Cover' : `#${img.sort_order}`}</figcaption>
                      <div className="admin-img__actions">
                        {!img.is_cover && (
                          <button type="button" onClick={() => void setCover(img.id)}>
                            Đặt cover
                          </button>
                        )}
                        <label>
                          Thay
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                              void replaceImage(img.id, e.target.files?.[0] || null)
                            }
                          />
                        </label>
                        <button type="button" onClick={() => void deleteImage(img.id)}>
                          Xóa
                        </button>
                      </div>
                    </figure>
                  ))}
                </div>
                {images.length === 0 && (
                  <p className="admin-muted">Chưa có ảnh — upload để hiện gallery trên trang khách.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
