import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { api, getToken } from '../../../lib/api'
import { useAppearance } from '../../../context/AppearanceContext'
import './AdminArticles.css'

type Article = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover: string
  published: number
  product_id?: string | null
  product_name?: string | null
  product_category?: string | null
}

type Cat = { id: string; name: string }
type ProductOpt = {
  id: string
  name: string
  category: string
  image: string
  price: number
  price_mode?: string
}

type SpecItem = {
  id: string
  text: string
  enabled: boolean
}

type PostDraft = {
  hook: string
  productName: string
  offer: string
  gifts: string
  specs: SpecItem[]
  cta: string
  categoryId: string
  productId: string
}

let specSeq = 0
const makeSpec = (text: string, enabled = true): SpecItem => ({
  id: `spec-${Date.now()}-${++specSeq}`,
  text,
  enabled,
})

const defaultSpecs = (): SpecItem[] =>
  [
    'Máy zin nguyên bản, full chức năng',
    'RAM 8GB (+4GB)',
    'Chip Snapdragon',
    'Bộ nhớ 128GB',
    'Pin khỏe, sạc nhanh',
    'Camera chính sắc nét, lấy nét nhanh',
    'Màn AMOLED mượt',
    'Loa kép sống động',
    'Thiết kế thời trang, cao cấp',
    'Chiến game thả ga',
  ].map((text) => makeSpec(text, true))

function buildZaloPost(
  draft: PostDraft,
  shop: { shopName: string; zaloPhone: string; shopAddress: string; contactName: string },
) {
  const lines: string[] = []
  if (draft.hook.trim()) lines.push(draft.hook.trim(), '')
  if (draft.productName.trim()) {
    lines.push(`💎 ${draft.productName.trim().toUpperCase()} 💎`, '')
  }
  if (draft.offer.trim()) lines.push(`🆘 ${draft.offer.trim()}`, '')
  if (draft.gifts.trim()) lines.push(`🎁 ${draft.gifts.trim()}`, '')
  const specs = draft.specs
    .filter((s) => s.enabled)
    .map((s) => s.text.trim())
    .filter(Boolean)
  for (const s of specs) lines.push(`✅ ${s}`)
  if (specs.length) lines.push('')
  const who = shop.contactName || 'shop'
  lines.push(draft.cta.trim() || `Gọi ${who} ngay nhé! 💛`)
  lines.push(shop.zaloPhone.replace(/\s+/g, ''))
  lines.push(`#${shop.shopName.replace(/\s+/g, '')}`)
  lines.push(shop.shopAddress)
  return lines.join('\n')
}

const emptyDraft = (contactName: string): PostDraft => ({
  hook: '🍀 MỎNG NHẸ · màn hình cong · chụp hình đẹp xuất sắc',
  productName: '',
  offer: 'Máy Zin Nguyên bản giá SIÊU TIẾT KIỆM',
  gifts: 'Tặng kính cường lực + ốp lưng + cáp sạc nhanh',
  specs: defaultSpecs(),
  cta: `Gọi ${contactName || 'cô Long'} ngay nhé! 💛`,
  categoryId: '',
  productId: '',
})

export function AdminArticles() {
  const { appearance } = useAppearance()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Cat[]>([])
  const [products, setProducts] = useState<ProductOpt[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<PostDraft>(() =>
    emptyDraft(appearance.contactName || 'cô Long'),
  )
  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const shop = useMemo(
    () => ({
      shopName: appearance.shopName || 'ATM66 Mobile',
      zaloPhone: appearance.zaloPhone || '0901339616',
      shopAddress:
        appearance.shopAddress ||
        '180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh, Việt Nam',
      contactName: appearance.contactName || 'Cô Long',
    }),
    [appearance],
  )

  const preview = useMemo(() => buildZaloPost(draft, shop), [draft, shop])

  const filteredProducts = useMemo(() => {
    if (!draft.categoryId) return products
    return products.filter((p) => p.category === draft.categoryId)
  }, [products, draft.categoryId])

  const load = () =>
    Promise.all([
      api<{ articles: Article[] }>('/api/admin/articles'),
      api<{ categories: Cat[] }>('/api/admin/categories'),
      api<{ products: ProductOpt[] }>('/api/admin/products'),
    ])
      .then(([a, c, p]) => {
        setArticles(a.articles)
        setCategories(c.categories)
        setProducts(p.products)
        setDraft((d) => ({
          ...d,
          categoryId: d.categoryId || c.categories[0]?.id || '',
        }))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'))

  useEffect(() => {
    void load()
  }, [])

  const slugify = (title: string) =>
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

  const onPickProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    setDraft((d) => ({
      ...d,
      productId,
      categoryId: p?.category || d.categoryId,
      productName: p?.name || d.productName,
    }))
  }

  const onPickCategory = (categoryId: string) => {
    setDraft((d) => {
      const stillValid = products.some(
        (p) => p.id === d.productId && p.category === categoryId,
      )
      return {
        ...d,
        categoryId,
        productId: stillValid ? d.productId : '',
        productName: stillValid ? d.productName : '',
      }
    })
  }

  const setSpecText = (index: number, value: string) => {
    setDraft((d) => {
      const specs = [...d.specs]
      specs[index] = { ...specs[index], text: value }
      return { ...d, specs }
    })
  }

  const toggleSpec = (index: number) => {
    setDraft((d) => {
      const specs = [...d.specs]
      specs[index] = { ...specs[index], enabled: !specs[index].enabled }
      return { ...d, specs }
    })
  }

  const addSpec = () =>
    setDraft((d) => ({ ...d, specs: [...d.specs, makeSpec('', true)] }))

  const removeSpec = (index: number) =>
    setDraft((d) => ({ ...d, specs: d.specs.filter((_, i) => i !== index) }))

  const onDragStart = (index: number) => (e: DragEvent) => {
    dragFrom.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const onDragOverRow = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver !== index) setDragOver(index)
  }

  const onDropRow = (index: number) => (e: DragEvent) => {
    e.preventDefault()
    const from = dragFrom.current
    dragFrom.current = null
    setDragOver(null)
    if (from == null || from === index) return
    setDraft((d) => {
      const specs = [...d.specs]
      const [item] = specs.splice(from, 1)
      specs.splice(index, 0, item)
      return { ...d, specs }
    })
  }

  const onDragEnd = () => {
    dragFrom.current = null
    setDragOver(null)
  }

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(preview)
      setMsg('Đã copy nội dung — dán lên Zalo được luôn.')
      setError('')
    } catch {
      setError('Không copy được — chọn ô xem trước rồi Ctrl+C.')
    }
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    if (!draft.productId) {
      setError('Chọn sản phẩm trong danh mục để liên kết bài đăng')
      return
    }
    if (!draft.productName.trim()) {
      setError('Nhập / chọn tên máy')
      return
    }
    try {
      const title = draft.productName.trim()
      const excerpt =
        draft.offer.trim() || draft.hook.trim() || `${title} — ${shop.shopName}`
      const fd = new FormData()
      fd.append('title', title)
      fd.append('slug', slugify(title) || `may-${Date.now()}`)
      fd.append('excerpt', excerpt)
      fd.append('content', preview)
      fd.append('product_id', draft.productId)
      fd.append('published', 'true')
      if (coverFile) fd.append('cover', coverFile)

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Không đăng được')

      setDraft(emptyDraft(shop.contactName))
      setCoverFile(null)
      setMsg('Đã đăng máy lên trang Máy mới về (có liên kết chi tiết sản phẩm).')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đăng được')
    }
  }

  const togglePublish = async (a: Article) => {
    await api(`/api/admin/articles/${a.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ published: !a.published }),
    })
    await load()
  }

  const replaceCover = async (id: number, file: File | null) => {
    if (!file) return
    setError('')
    const fd = new FormData()
    fd.append('cover', file)
    const res = await fetch(`/api/admin/articles/${id}/cover`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setError(data.error || 'Đổi ảnh bìa thất bại')
      return
    }
    await load()
  }

  const remove = async (id: number) => {
    if (!confirm('Xóa bài đăng máy này?')) return
    await api(`/api/admin/articles/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="admin-articles">
      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Đăng máy (kiểu Zalo)</h2>
        </div>
        <p className="admin-articles__hint">
          Đây là đăng <strong>máy mới / máy cũ</strong> — không phải tin tức. Chọn{' '}
          <strong>danh mục → sản phẩm</strong> để bài gắn với trang chi tiết{' '}
          <code>/san-pham/:id</code>. Trang khách <strong>Máy mới về</strong> hiện các bài này;
          trang <strong>Sản phẩm</strong> vẫn là danh sách đầy đủ.
        </p>

        <form className="admin-zalo-form" onSubmit={onCreate}>
          <div className="admin-zalo-form__grid">
            <label>
              Danh mục
              <select
                value={draft.categoryId}
                onChange={(e) => onPickCategory(e.target.value)}
                required
              >
                <option value="">— Chọn danh mục —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sản phẩm liên kết
              <select
                value={draft.productId}
                onChange={(e) => onPickProduct(e.target.value)}
                required
              >
                <option value="">— Chọn máy trong danh mục —</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            {draft.productId && (
              <p className="admin-articles__link-hint">
                Liên kết chi tiết:{' '}
                <Link to={`/san-pham/${draft.productId}`} target="_blank" rel="noreferrer">
                  /san-pham/{draft.productId}
                </Link>
                {' · '}
                <Link to="/admin/san-pham">Sửa sản phẩm</Link>
                {' · '}
                <Link to="/admin/danh-muc">Danh mục</Link>
              </p>
            )}
            <label>
              Hook mở đầu
              <input
                value={draft.hook}
                onChange={(e) => setDraft({ ...draft, hook: e.target.value })}
                placeholder="🍀 MỎNG NHẸ · màn hình cong…"
              />
            </label>
            <label>
              Tên máy (trên bài)
              <input
                value={draft.productName}
                onChange={(e) => setDraft({ ...draft, productName: e.target.value })}
                placeholder="XIAOMI REDMI NOTE 15"
                required
              />
            </label>
            <label>
              Dòng ưu đãi
              <input
                value={draft.offer}
                onChange={(e) => setDraft({ ...draft, offer: e.target.value })}
                placeholder="Máy Zin Nguyên bản giá SIÊU TIẾT KIỆM"
              />
            </label>
            <label>
              Quà tặng
              <input
                value={draft.gifts}
                onChange={(e) => setDraft({ ...draft, gifts: e.target.value })}
                placeholder="Tặng kính + ốp + cáp sạc nhanh"
              />
            </label>
          </div>

          <div className="admin-zalo-specs">
            <div className="admin-zalo-specs__head">
              <h3>Checklist thông số (✅)</h3>
              <button type="button" className="admin-link-btn" onClick={addSpec}>
                + Thêm dòng
              </button>
            </div>
            <p className="admin-zalo-specs__hint">
              Tick để chọn dòng đưa vào bài · kéo ⋮⋮ để sắp thứ tự · sửa chữ hoặc thêm dòng mới.
            </p>
            {draft.specs.map((spec, i) => (
              <div
                key={spec.id}
                className={`admin-zalo-specs__row${spec.enabled ? '' : ' is-off'}${
                  dragOver === i ? ' is-drag-over' : ''
                }`}
                onDragOver={onDragOverRow(i)}
                onDrop={onDropRow(i)}
              >
                <button
                  type="button"
                  className="admin-zalo-specs__handle"
                  title="Kéo thả sắp xếp"
                  aria-label="Kéo để sắp xếp"
                  draggable
                  onDragStart={onDragStart(i)}
                  onDragEnd={onDragEnd}
                >
                  ⋮⋮
                </button>
                <label className="admin-zalo-specs__check" title="Chọn / bỏ chọn">
                  <input
                    type="checkbox"
                    checked={spec.enabled}
                    onChange={() => toggleSpec(i)}
                  />
                  <span aria-hidden="true">{spec.enabled ? '✅' : '⬜'}</span>
                </label>
                <input
                  value={spec.text}
                  onChange={(e) => setSpecText(i, e.target.value)}
                  placeholder="Thông số / điểm bán"
                />
                <button type="button" onClick={() => removeSpec(i)} aria-label="Xóa dòng">
                  ×
                </button>
              </div>
            ))}
          </div>

          <label>
            Câu gọi liên hệ
            <input
              value={draft.cta}
              onChange={(e) => setDraft({ ...draft, cta: e.target.value })}
            />
          </label>

          <label className="admin-article-cover">
            Ảnh máy (upload — hiện trên bài Máy mới về)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
            {coverFile && (
              <span className="admin-article-cover__name">{coverFile.name}</span>
            )}
          </label>

          <div className="admin-zalo-preview">
            <div className="admin-zalo-preview__head">
              <h3>Xem trước (copy lên Zalo)</h3>
              <button type="button" className="btn btn-ghost" onClick={() => void copyPreview()}>
                Copy Zalo
              </button>
            </div>
            <pre>{preview}</pre>
            <p className="admin-articles__footer-note">
              Footer tự gắn: {shop.zaloPhone} · #{shop.shopName.replace(/\s+/g, '')} ·{' '}
              {shop.shopAddress}
            </p>
          </div>

          <div className="admin-zalo-actions">
            <button type="submit" className="btn btn-accent">
              Đăng máy lên website
            </button>
          </div>
        </form>
        {msg && <p className="admin-ok">{msg}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-panel">
        <div className="admin-panel__head">
          <h2>Máy đã đăng ({articles.length})</h2>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Máy</th>
                <th>Sản phẩm</th>
                <th>TT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.cover ? (
                      <img className="admin-article-thumb" src={a.cover} alt="" />
                    ) : (
                      <span className="admin-article-nocover">—</span>
                    )}
                  </td>
                  <td>
                    {a.title}
                    <div className="admin-articles__meta">/may-moi/{a.slug}</div>
                  </td>
                  <td>
                    {a.product_id ? (
                      <Link to={`/san-pham/${a.product_id}`} target="_blank" rel="noreferrer">
                        {a.product_name || a.product_id}
                      </Link>
                    ) : (
                      <span className="admin-article-nocover">Chưa gắn</span>
                    )}
                  </td>
                  <td>{a.published ? 'Hiện' : 'Ẩn'}</td>
                  <td className="admin-articles__actions">
                    <label className="admin-articles__file">
                      Đổi ảnh
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) =>
                          void replaceCover(a.id, e.target.files?.[0] || null)
                        }
                      />
                    </label>
                    <button type="button" onClick={() => void togglePublish(a)}>
                      {a.published ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button type="button" onClick={() => void remove(a.id)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
