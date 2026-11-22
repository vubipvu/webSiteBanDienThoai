import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, initDb } from './db.ts'
import {
  login,
  optionalAuth,
  requireAdmin,
  signToken,
  type AuthedRequest,
} from './auth.ts'
import {
  articleUpload,
  brandUpload,
  pageUpload,
  productUpload,
  publicPath,
  unlinkUpload,
  uploadsRoot,
} from './media.ts'

const EDITABLE_PAGE_SLUGS = new Set([
  'gioi-thieu',
  'quy-trinh-thu-mua',
  'sua-may',
  'khuyen-mai',
  'bao-hanh',
  'lien-he',
])

initDb()

const app = express()
const isProd = process.env.NODE_ENV === 'production'
const PORT = Number(process.env.ATM66_API_PORT || 3001)
const HOST = process.env.ATM66_HOST || (isProd ? '0.0.0.0' : '127.0.0.1')
const CORS_ORIGIN = process.env.ATM66_CORS_ORIGIN || (isProd ? false : true)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distRoot = path.join(__dirname, '..', 'dist')

const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function clientIp(req: express.Request) {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.trim()) return xf.split(',')[0].trim()
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function tooManyLogins(ip: string) {
  const now = Date.now()
  const row = loginAttempts.get(ip)
  if (!row || row.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return false
  }
  row.count += 1
  return row.count > 20
}

app.disable('x-powered-by')
app.use(
  cors({
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }
  // Không cache HTML admin / API
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) {
    res.setHeader('Cache-Control', 'no-store')
  }
  next()
})
app.use('/uploads', express.static(uploadsRoot, { fallthrough: false, maxAge: isProd ? '7d' : 0 }))

function setting(key: string, fallback = '') {
  const row = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
    | { value: string }
    | undefined
  return row?.value ?? fallback
}

function setSetting(key: string, value: string) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value)
}

function productImages(productId: string) {
  return db
    .prepare(
      `SELECT id, product_id, path, sort_order, is_cover FROM product_images
       WHERE product_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC`,
    )
    .all(productId) as Array<{
    id: number
    product_id: string
    path: string
    sort_order: number
    is_cover: number
  }>
}

function coverPath(productId: string, fallback: string) {
  const cover = db
    .prepare(
      `SELECT path FROM product_images WHERE product_id = ? ORDER BY is_cover DESC, sort_order ASC, id ASC LIMIT 1`,
    )
    .get(productId) as { path: string } | undefined
  return cover?.path || fallback
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: 'sqlite', mode: 'local-test' })
})

app.get('/api/settings/public', (_req, res) => {
  const zalo = setting('zalo_phone', '0901339616')
  const logo = setting('logo_path', '')
  res.json({
    zaloPhone: zalo,
    zaloUrl: `https://zalo.me/${zalo.replace(/\s+/g, '')}`,
    shopName: setting('shop_name', 'ATM66 Mobile'),
    slogan: setting(
      'slogan',
      'Thu mua giá cao · Bán máy Zin · Sửa chữa uy tín',
    ),
    announcement: setting(
      'announcement',
      'ATM66 Mobile — Thu mua máy cũ giá cao · Bán máy Zin · Sửa chữa: điện thoại, iPad, laptop',
    ),
    heroHeadline: setting('hero_headline', 'Thu mua · Bán Zin.\nSửa uy tín.'),
    heroSupport: setting('hero_support', ''),
    featuredProductId: setting('featured_product_id', 'iphone-13-pro-campaign'),
    accentColor: setting('accent_color', '#00b89a'),
    inkColor: setting('ink_color', '#0b1220'),
    mistColor: setting('mist_color', '#e8eef5'),
    logoUrl: logo || null,
    shopAddress: setting(
      'shop_address',
      '180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh, Việt Nam',
    ),
    contactName: setting('contact_name', 'Cô Long'),
    mapsEmbedUrl: setting(
      'maps_embed_url',
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0445537580244!2d106.70073577586874!3d10.807899658610246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752900770e229b%3A0x63b084c96d6faf7a!2sATM66%20Mobile!5e0!3m2!1svi!2s!4v1795343450554!5m2!1svi!2s',
    ),
  })
})

app.post('/api/auth/login', (req, res) => {
  const ip = clientIp(req)
  if (tooManyLogins(ip)) {
    res.status(429).json({ error: 'Thử đăng nhập quá nhiều. Đợi 15 phút rồi thử lại.' })
    return
  }
  const { username, password } = req.body as {
    username?: string
    password?: string
  }
  if (!username || !password) {
    res.status(400).json({ error: 'Thiếu username hoặc password' })
    return
  }
  // Chỉ cho phép tài khoản admin (storefront không còn đăng ký khách)
  const user = login(username, password)
  if (!user || user.role !== 'admin') {
    res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' })
    return
  }
  loginAttempts.delete(ip)
  res.json({ token: signToken(user), user })
})

app.post('/api/auth/register', (_req, res) => {
  res.status(403).json({
    error: 'Đăng ký khách đã tắt — liên hệ Zalo cửa hàng. Admin dùng /admin/login.',
  })
})

app.get('/api/auth/me', optionalAuth, (req, res) => {
  res.json({ user: (req as AuthedRequest).user ?? null })
})

app.get('/api/categories', (_req, res) => {
  const categories = db
    .prepare(`SELECT id, name, description, sort_order FROM categories ORDER BY sort_order, name`)
    .all()
  res.json({ categories })
})

app.get('/api/products', (req, res) => {
  const { category, hot, q } = req.query
  let sql = `SELECT * FROM products WHERE 1=1`
  const params: unknown[] = []
  if (typeof category === 'string' && category && category !== 'all') {
    sql += ` AND category = ?`
    params.push(category)
  }
  if (hot === '1' || hot === 'true') {
    sql += ` AND hot_month = 1`
  }
  if (typeof q === 'string' && q.trim()) {
    sql += ` AND (lower(name) LIKE ? OR lower(brand) LIKE ?)`
    const like = `%${q.trim().toLowerCase()}%`
    params.push(like, like)
  }
  sql += ` ORDER BY hot_month DESC, popular DESC, updated_at DESC`
  const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>
  res.json({
    products: rows.map((p) => ({
      ...p,
      image: coverPath(String(p.id), String(p.image || '')),
    })),
  })
})

app.get('/api/products/:id', (req, res) => {
  const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(req.params.id) as
    | Record<string, unknown>
    | undefined
  if (!product) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
    return
  }
  const images = productImages(String(product.id))
  res.json({
    product: {
      ...product,
      image: coverPath(String(product.id), String(product.image || '')),
    },
    images,
  })
})

app.get('/api/pages', (_req, res) => {
  res.json({
    pages: db
      .prepare(
        `SELECT slug, nav_label, title, subtitle, cover, updated_at FROM site_pages ORDER BY slug`,
      )
      .all(),
  })
})

app.get('/api/pages/:slug', (req, res) => {
  const page = db
    .prepare(`SELECT * FROM site_pages WHERE slug = ?`)
    .get(req.params.slug) as Record<string, unknown> | undefined
  if (!page) {
    res.status(404).json({ error: 'Không tìm thấy trang' })
    return
  }
  res.json({ page })
})

app.get('/api/admin/pages', requireAdmin, (_req, res) => {
  res.json({
    pages: db.prepare(`SELECT * FROM site_pages ORDER BY slug`).all(),
  })
})

app.patch('/api/admin/pages/:slug', requireAdmin, (req, res) => {
  const slug = req.params.slug
  if (!EDITABLE_PAGE_SLUGS.has(slug)) {
    res.status(400).json({ error: 'Slug trang không hợp lệ' })
    return
  }
  const body = req.body as {
    nav_label?: string
    title?: string
    subtitle?: string
    content?: string
  }
  const existing = db.prepare(`SELECT slug FROM site_pages WHERE slug = ?`).get(slug)
  if (!existing) {
    res.status(404).json({ error: 'Không tìm thấy trang' })
    return
  }
  db.prepare(
    `UPDATE site_pages SET
      nav_label = COALESCE(@nav_label, nav_label),
      title = COALESCE(@title, title),
      subtitle = COALESCE(@subtitle, subtitle),
      content = COALESCE(@content, content),
      updated_at = datetime('now')
    WHERE slug = @slug`,
  ).run({
    slug,
    nav_label: body.nav_label != null ? String(body.nav_label) : null,
    title: body.title != null ? String(body.title) : null,
    subtitle: body.subtitle != null ? String(body.subtitle) : null,
    content: body.content != null ? String(body.content) : null,
  })
  res.json({
    ok: true,
    page: db.prepare(`SELECT * FROM site_pages WHERE slug = ?`).get(slug),
  })
})

app.put(
  '/api/admin/pages/:slug/cover',
  requireAdmin,
  (req, res, next) => {
    pageUpload.single('cover')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message || 'Upload thất bại' })
        return
      }
      next()
    })
  },
  (req, res) => {
    const slug = req.params.slug
    if (!EDITABLE_PAGE_SLUGS.has(slug)) {
      res.status(400).json({ error: 'Slug trang không hợp lệ' })
      return
    }
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Thiếu file ảnh' })
      return
    }
    const row = db.prepare(`SELECT cover FROM site_pages WHERE slug = ?`).get(slug) as
      | { cover: string }
      | undefined
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy trang' })
      return
    }
    const url = publicPath(file.path)
    if (row.cover) unlinkUpload(row.cover)
    db.prepare(
      `UPDATE site_pages SET cover = ?, updated_at = datetime('now') WHERE slug = ?`,
    ).run(url, slug)
    res.json({
      ok: true,
      page: db.prepare(`SELECT * FROM site_pages WHERE slug = ?`).get(slug),
    })
  },
)

app.get('/api/articles', (req, res) => {
  const all = req.query.all === '1'
  const articles = all
    ? db
        .prepare(
          `SELECT a.*, p.name AS product_name, p.category AS product_category, p.image AS product_image, p.price AS product_price, p.price_mode AS product_price_mode
           FROM articles a
           LEFT JOIN products p ON p.id = a.product_id
           ORDER BY a.created_at DESC`,
        )
        .all()
    : db
        .prepare(
          `SELECT a.id, a.title, a.slug, a.excerpt, a.cover, a.created_at, a.product_id,
                  p.name AS product_name, p.category AS product_category, p.image AS product_image,
                  p.price AS product_price, p.price_mode AS product_price_mode
           FROM articles a
           LEFT JOIN products p ON p.id = a.product_id
           WHERE a.published = 1
           ORDER BY a.created_at DESC`,
        )
        .all()
  res.json({ articles })
})

app.get('/api/articles/:slug', (req, res) => {
  const article = db
    .prepare(
      `SELECT a.*, p.name AS product_name, p.category AS product_category, p.image AS product_image,
              p.price AS product_price, p.price_mode AS product_price_mode, p.brand AS product_brand
       FROM articles a
       LEFT JOIN products p ON p.id = a.product_id
       WHERE a.slug = ? AND a.published = 1`,
    )
    .get(req.params.slug)
  if (!article) {
    res.status(404).json({ error: 'Không tìm thấy bài đăng máy' })
    return
  }
  res.json({ article })
})

app.post('/api/orders', optionalAuth, (req, res) => {
  const body = req.body as {
    customer?: string
    phone?: string
    items?: Array<{ productId: string; quantity: number }>
  }
  const user = (req as AuthedRequest).user
  const lines = body.items || []
  if (!lines.length) {
    res.status(400).json({ error: 'Giỏ trống' })
    return
  }
  const customer =
    body.customer?.trim() || user?.displayName || user?.username || 'Khách vãng lai'
  let total = 0
  let count = 0
  for (const line of lines) {
    const p = db.prepare(`SELECT price, stock FROM products WHERE id = ?`).get(
      line.productId,
    ) as { price: number; stock: number } | undefined
    if (!p) {
      res.status(400).json({ error: `SP không tồn tại: ${line.productId}` })
      return
    }
    total += p.price * line.quantity
    count += line.quantity
  }
  const id = `DH-${Date.now().toString().slice(-6)}`
  db.prepare(
    `INSERT INTO orders (id, customer, user_id, phone, total, status, items)
     VALUES (?, ?, ?, ?, ?, 'Chờ xác nhận', ?)`,
  ).run(
    id,
    customer,
    user?.id ?? null,
    body.phone || user?.phone || null,
    total,
    count,
  )
  res.status(201).json({ ok: true, id, total })
})

/* -------- admin -------- */

app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const orders = db
    .prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(total), 0) AS revenue FROM orders`)
    .get() as { c: number; revenue: number }
  const products = db.prepare(`SELECT COUNT(*) AS c FROM products`).get() as {
    c: number
  }
  const inventory = db
    .prepare(`SELECT COALESCE(SUM(price * stock), 0) AS value FROM products`)
    .get() as { value: number }
  const lowStock = db
    .prepare(
      `SELECT id, name, stock FROM products WHERE stock < 12 ORDER BY stock ASC LIMIT 6`,
    )
    .all()
  const recentOrders = db
    .prepare(
      `SELECT id, customer, total, status, items, created_at FROM orders ORDER BY created_at DESC LIMIT 8`,
    )
    .all()
  const popular = db
    .prepare(
      `SELECT id, name, price, image, stock FROM products WHERE popular = 1 OR hot_month = 1 LIMIT 6`,
    )
    .all()
  const salesByCategory = db
    .prepare(
      `SELECT category, COUNT(*) AS skus, SUM(stock) AS units FROM products GROUP BY category`,
    )
    .all()
  const articleCount = db.prepare(`SELECT COUNT(*) AS c FROM articles`).get() as {
    c: number
  }

  res.json({
    ordersToday: orders.c,
    revenue: orders.revenue,
    skuCount: products.c,
    inventoryValue: inventory.value,
    articleCount: articleCount.c,
    lowStock,
    recentOrders,
    popular,
    salesByCategory,
  })
})

app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  res.json({
    categories: db
      .prepare(`SELECT * FROM categories ORDER BY sort_order, name`)
      .all(),
  })
})

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { id, name, description, sort_order } = req.body as {
    id?: string
    name?: string
    description?: string
    sort_order?: number
  }
  if (!id?.trim() || !name?.trim()) {
    res.status(400).json({ error: 'Thiếu id hoặc tên danh mục' })
    return
  }
  try {
    db.prepare(
      `INSERT INTO categories (id, name, description, sort_order) VALUES (?, ?, ?, ?)`,
    ).run(id.trim(), name.trim(), description || '', Number(sort_order || 0))
    res.status(201).json({ ok: true })
  } catch {
    res.status(400).json({ error: 'ID danh mục đã tồn tại' })
  }
})

app.patch('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const body = req.body as {
    name?: string
    description?: string
    sort_order?: number
  }
  const info = db
    .prepare(
      `UPDATE categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        sort_order = COALESCE(?, sort_order)
       WHERE id = ?`,
    )
    .run(
      body.name ?? null,
      body.description ?? null,
      body.sort_order ?? null,
      req.params.id,
    )
  if (!info.changes) {
    res.status(404).json({ error: 'Không tìm thấy danh mục' })
    return
  }
  res.json({ ok: true })
})

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const used = db
    .prepare(`SELECT COUNT(*) AS c FROM products WHERE category = ?`)
    .get(req.params.id) as { c: number }
  if (used.c > 0) {
    res.status(400).json({ error: 'Còn sản phẩm trong danh mục này' })
    return
  }
  const info = db.prepare(`DELETE FROM categories WHERE id = ?`).run(req.params.id)
  if (!info.changes) {
    res.status(404).json({ error: 'Không tìm thấy danh mục' })
    return
  }
  res.json({ ok: true })
})

app.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json({
    products: db.prepare(`SELECT * FROM products ORDER BY updated_at DESC`).all(),
  })
})

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const body = req.body as Record<string, unknown>
  const id = String(body.id || '').trim()
  const name = String(body.name || '').trim()
  if (!id || !name) {
    res.status(400).json({ error: 'Thiếu id hoặc tên' })
    return
  }
  try {
    db.prepare(`
      INSERT INTO products (
        id, name, brand, category, price, original_price, image,
        condition, storage, color, description, popular, hot_month, price_mode, stock
      ) VALUES (
        @id, @name, @brand, @category, @price, @original_price, @image,
        @condition, @storage, @color, @description, @popular, @hot_month, @price_mode, @stock
      )
    `).run({
      id,
      name,
      brand: String(body.brand || 'ATM66'),
      category: String(body.category || 'phu-kien'),
      price: Number(body.price || 0),
      original_price: body.original_price != null ? Number(body.original_price) : null,
      image: String(
        body.image ||
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      ),
      condition: body.condition ? String(body.condition) : null,
      storage: body.storage ? String(body.storage) : null,
      color: body.color ? String(body.color) : null,
      description: String(body.description || ''),
      popular: body.popular ? 1 : 0,
      hot_month: body.hot_month ? 1 : 0,
      price_mode: body.price_mode === 'contact' ? 'contact' : 'price',
      stock: Number(body.stock ?? 0),
    })
    res.status(201).json({ ok: true, id })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Lỗi tạo SP' })
  }
})

app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
  const { id } = req.params
  const body = req.body as Record<string, unknown>
  const existing = db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined
  if (!existing) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
    return
  }

  const strOr = (key: string, fallback: unknown) =>
    Object.prototype.hasOwnProperty.call(body, key)
      ? body[key] == null || body[key] === ''
        ? null
        : String(body[key])
      : fallback

  const numOr = (key: string, fallback: unknown) =>
    Object.prototype.hasOwnProperty.call(body, key)
      ? body[key] == null || body[key] === ''
        ? null
        : Number(body[key])
      : fallback

  const bool01Or = (key: string, fallback: unknown) =>
    Object.prototype.hasOwnProperty.call(body, key) ? (body[key] ? 1 : 0) : fallback

  const nextPriceMode = Object.prototype.hasOwnProperty.call(body, 'price_mode')
    ? body.price_mode === 'contact'
      ? 'contact'
      : 'price'
    : existing.price_mode

  db.prepare(`
    UPDATE products SET
      name = @name,
      brand = @brand,
      category = @category,
      price = @price,
      original_price = @original_price,
      image = @image,
      condition = @condition,
      storage = @storage,
      color = @color,
      description = @description,
      popular = @popular,
      hot_month = @hot_month,
      price_mode = @price_mode,
      stock = @stock,
      updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id,
    name: strOr('name', existing.name) ?? existing.name,
    brand: strOr('brand', existing.brand) ?? existing.brand,
    category: strOr('category', existing.category) ?? existing.category,
    price: numOr('price', existing.price) ?? existing.price,
    original_price: numOr('original_price', existing.original_price),
    image: strOr('image', existing.image) ?? existing.image,
    condition: strOr('condition', existing.condition),
    storage: strOr('storage', existing.storage),
    color: strOr('color', existing.color),
    description: strOr('description', existing.description) ?? '',
    popular: bool01Or('popular', existing.popular),
    hot_month: bool01Or('hot_month', existing.hot_month),
    price_mode: nextPriceMode,
    stock: numOr('stock', existing.stock) ?? existing.stock,
  })
  res.json({ ok: true })
})

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(req.params.id)
  if (!info.changes) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
    return
  }
  res.json({ ok: true })
})

app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  res.json({
    orders: db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all(),
  })
})

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const status = String((req.body as { status?: string }).status || '')
  if (!status) {
    res.status(400).json({ error: 'Thiếu trạng thái' })
    return
  }
  const info = db
    .prepare(`UPDATE orders SET status = ? WHERE id = ?`)
    .run(status, req.params.id)
  if (!info.changes) {
    res.status(404).json({ error: 'Không tìm thấy đơn' })
    return
  }
  res.json({ ok: true })
})

app.get('/api/admin/articles', requireAdmin, (_req, res) => {
  res.json({
    articles: db
      .prepare(
        `SELECT a.*, p.name AS product_name, p.category AS product_category
         FROM articles a
         LEFT JOIN products p ON p.id = a.product_id
         ORDER BY a.created_at DESC`,
      )
      .all(),
  })
})

app.post(
  '/api/admin/articles',
  requireAdmin,
  (req, res, next) => {
    articleUpload.single('cover')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload lỗi' })
        return
      }
      next()
    })
  },
  (req, res) => {
    const body = req.body as {
      title?: string
      slug?: string
      excerpt?: string
      content?: string
      product_id?: string
      published?: string | boolean
    }
    const title = String(body.title || '').trim()
    const slug = String(body.slug || '').trim()
    const content = String(body.content || '').trim()
    const productId = String(body.product_id || '').trim() || null
    if (!title || !slug || !content) {
      res.status(400).json({ error: 'Thiếu tiêu đề, slug hoặc nội dung' })
      return
    }
    if (productId) {
      const p = db.prepare(`SELECT id FROM products WHERE id = ?`).get(productId)
      if (!p) {
        res.status(400).json({ error: 'Sản phẩm liên kết không tồn tại' })
        return
      }
    }
    const cover = req.file ? publicPath(req.file.path) : ''
    const published =
      body.published === false || body.published === 'false' || body.published === '0'
        ? 0
        : 1
    try {
      const info = db
        .prepare(
          `INSERT INTO articles (title, slug, excerpt, content, cover, published, product_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(title, slug, String(body.excerpt || ''), content, cover, published, productId)
      res.status(201).json({ ok: true, id: Number(info.lastInsertRowid), cover })
    } catch {
      if (req.file) unlinkUpload(publicPath(req.file.path))
      res.status(400).json({ error: 'Slug đã tồn tại' })
    }
  },
)

app.patch('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const body = req.body as Record<string, unknown>
  const info = db
    .prepare(
      `UPDATE articles SET
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        excerpt = COALESCE(?, excerpt),
        content = COALESCE(?, content),
        published = COALESCE(?, published),
        product_id = CASE WHEN ? = 1 THEN ? ELSE product_id END,
        updated_at = datetime('now')
       WHERE id = ?`,
    )
    .run(
      body.title != null ? String(body.title) : null,
      body.slug != null ? String(body.slug) : null,
      body.excerpt != null ? String(body.excerpt) : null,
      body.content != null ? String(body.content) : null,
      body.published != null ? (body.published ? 1 : 0) : null,
      Object.prototype.hasOwnProperty.call(body, 'product_id') ? 1 : 0,
      Object.prototype.hasOwnProperty.call(body, 'product_id')
        ? body.product_id
          ? String(body.product_id)
          : null
        : null,
      Number(req.params.id),
    )
  if (!info.changes) {
    res.status(404).json({ error: 'Không tìm thấy bài' })
    return
  }
  res.json({ ok: true })
})

app.put(
  '/api/admin/articles/:id/cover',
  requireAdmin,
  (req, res, next) => {
    articleUpload.single('cover')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload lỗi' })
        return
      }
      next()
    })
  },
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Chưa chọn file ảnh bìa' })
      return
    }
    const id = Number(req.params.id)
    const row = db.prepare(`SELECT id, cover FROM articles WHERE id = ?`).get(id) as
      | { id: number; cover: string }
      | undefined
    if (!row) {
      unlinkUpload(publicPath(req.file.path))
      res.status(404).json({ error: 'Không tìm thấy bài' })
      return
    }
    const cover = publicPath(req.file.path)
    db.prepare(
      `UPDATE articles SET cover = ?, updated_at = datetime('now') WHERE id = ?`,
    ).run(cover, id)
    if (row.cover) unlinkUpload(row.cover)
    res.json({ ok: true, cover })
  },
)

app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id)
  const row = db.prepare(`SELECT cover FROM articles WHERE id = ?`).get(id) as
    | { cover: string }
    | undefined
  const info = db.prepare(`DELETE FROM articles WHERE id = ?`).run(id)
  if (!info.changes) {
    res.status(404).json({ error: 'Không tìm thấy bài' })
    return
  }
  if (row?.cover) unlinkUpload(row.cover)
  res.json({ ok: true })
})

app.patch('/api/admin/settings/zalo', requireAdmin, (req, res) => {
  const phone = String((req.body as { phone?: string }).phone || '').trim()
  if (!phone) {
    res.status(400).json({ error: 'Thiếu số Zalo' })
    return
  }
  setSetting('zalo_phone', phone)
  res.json({ ok: true, zaloPhone: phone })
})

app.get('/api/admin/products/:id/images', requireAdmin, (req, res) => {
  const product = db.prepare(`SELECT id FROM products WHERE id = ?`).get(req.params.id)
  if (!product) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
    return
  }
  res.json({ images: productImages(req.params.id) })
})

app.post(
  '/api/admin/products/:id/images',
  requireAdmin,
  (req, res, next) => {
    productUpload.array('images', 12)(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload lỗi' })
        return
      }
      next()
    })
  },
  (req, res) => {
    const productId = req.params.id
    const product = db.prepare(`SELECT id, image FROM products WHERE id = ?`).get(productId) as
      | { id: string; image: string }
      | undefined
    if (!product) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' })
      return
    }
    const files = (req.files as Express.Multer.File[]) || []
    if (!files.length) {
      res.status(400).json({ error: 'Chưa chọn file ảnh' })
      return
    }
    const maxSort = db
      .prepare(
        `SELECT COALESCE(MAX(sort_order), -1) AS m FROM product_images WHERE product_id = ?`,
      )
      .get(productId) as { m: number }
    const hasCover = db
      .prepare(
        `SELECT COUNT(*) AS c FROM product_images WHERE product_id = ? AND is_cover = 1`,
      )
      .get(productId) as { c: number }
    const insert = db.prepare(
      `INSERT INTO product_images (product_id, path, sort_order, is_cover) VALUES (?, ?, ?, ?)`,
    )
    let order = maxSort.m + 1
    const created: number[] = []
    files.forEach((f, idx) => {
      const url = publicPath(f.path)
      const isCover = hasCover.c === 0 && idx === 0 ? 1 : 0
      const info = insert.run(productId, url, order++, isCover)
      created.push(Number(info.lastInsertRowid))
      if (isCover) {
        db.prepare(`UPDATE products SET image = ?, updated_at = datetime('now') WHERE id = ?`).run(
          url,
          productId,
        )
      }
    })
    res.status(201).json({ ok: true, images: productImages(productId), created })
  },
)

app.patch('/api/admin/products/:id/images/:imageId', requireAdmin, (req, res) => {
  const productId = req.params.id
  const imageId = Number(req.params.imageId)
  const body = req.body as { is_cover?: boolean; sort_order?: number }
  const row = db
    .prepare(`SELECT * FROM product_images WHERE id = ? AND product_id = ?`)
    .get(imageId, productId) as { id: number; path: string } | undefined
  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy ảnh' })
    return
  }
  if (body.is_cover) {
    db.prepare(`UPDATE product_images SET is_cover = 0 WHERE product_id = ?`).run(productId)
    db.prepare(`UPDATE product_images SET is_cover = 1 WHERE id = ?`).run(imageId)
    db.prepare(`UPDATE products SET image = ?, updated_at = datetime('now') WHERE id = ?`).run(
      row.path,
      productId,
    )
  }
  if (body.sort_order != null) {
    db.prepare(`UPDATE product_images SET sort_order = ? WHERE id = ?`).run(
      Number(body.sort_order),
      imageId,
    )
  }
  res.json({ ok: true, images: productImages(productId) })
})

app.delete('/api/admin/products/:id/images/:imageId', requireAdmin, (req, res) => {
  const productId = req.params.id
  const imageId = Number(req.params.imageId)
  const row = db
    .prepare(`SELECT * FROM product_images WHERE id = ? AND product_id = ?`)
    .get(imageId, productId) as { id: number; path: string; is_cover: number } | undefined
  if (!row) {
    res.status(404).json({ error: 'Không tìm thấy ảnh' })
    return
  }
  db.prepare(`DELETE FROM product_images WHERE id = ?`).run(imageId)
  unlinkUpload(row.path)
  if (row.is_cover) {
    const next = db
      .prepare(
        `SELECT id, path FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1`,
      )
      .get(productId) as { id: number; path: string } | undefined
    if (next) {
      db.prepare(`UPDATE product_images SET is_cover = 1 WHERE id = ?`).run(next.id)
      db.prepare(`UPDATE products SET image = ?, updated_at = datetime('now') WHERE id = ?`).run(
        next.path,
        productId,
      )
    }
  }
  res.json({ ok: true, images: productImages(productId) })
})

app.put(
  '/api/admin/products/:id/images/:imageId/replace',
  requireAdmin,
  (req, res, next) => {
    productUpload.single('image')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload lỗi' })
        return
      }
      next()
    })
  },
  (req, res) => {
    const productId = req.params.id
    const imageId = Number(req.params.imageId)
    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'Chưa chọn file' })
      return
    }
    const row = db
      .prepare(`SELECT * FROM product_images WHERE id = ? AND product_id = ?`)
      .get(imageId, productId) as { id: number; path: string; is_cover: number } | undefined
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy ảnh' })
      return
    }
    const url = publicPath(file.path)
    unlinkUpload(row.path)
    db.prepare(`UPDATE product_images SET path = ? WHERE id = ?`).run(url, imageId)
    if (row.is_cover) {
      db.prepare(`UPDATE products SET image = ?, updated_at = datetime('now') WHERE id = ?`).run(
        url,
        productId,
      )
    }
    res.json({ ok: true, images: productImages(productId) })
  },
)

app.get('/api/admin/appearance', requireAdmin, (_req, res) => {
  const keys = [
    'shop_name',
    'slogan',
    'announcement',
    'hero_headline',
    'hero_support',
    'featured_product_id',
    'accent_color',
    'ink_color',
    'mist_color',
    'logo_path',
    'zalo_phone',
    'shop_address',
    'contact_name',
    'maps_embed_url',
  ]
  const appearance: Record<string, string> = {}
  for (const k of keys) appearance[k] = setting(k, '')
  res.json({ appearance })
})

app.patch('/api/admin/appearance', requireAdmin, (req, res) => {
  const body = req.body as Record<string, string>
  const allowed = [
    'shop_name',
    'slogan',
    'announcement',
    'hero_headline',
    'hero_support',
    'featured_product_id',
    'accent_color',
    'ink_color',
    'mist_color',
    'zalo_phone',
    'shop_address',
    'contact_name',
    'maps_embed_url',
  ]
  for (const k of allowed) {
    if (body[k] != null) setSetting(k, String(body[k]))
  }
  res.json({ ok: true })
})

app.post(
  '/api/admin/appearance/logo',
  requireAdmin,
  (req, res, next) => {
    brandUpload.single('logo')(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'Upload lỗi' })
        return
      }
      next()
    })
  },
  (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Chưa chọn logo' })
      return
    }
    const prev = setting('logo_path', '')
    const url = publicPath(req.file.path)
    setSetting('logo_path', url)
    if (prev) unlinkUpload(prev)
    res.json({ ok: true, logoUrl: url })
  },
)

// Production: phục vụ SPA đã build (vite dist)
if (isProd) {
  app.use(express.static(distRoot, { index: false, maxAge: '1h' }))
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      next()
      return
    }
    res.sendFile(path.join(distRoot, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, HOST, () => {
  console.log(`ATM66 API ${isProd ? '(prod)' : '(SQLite local)'} http://${HOST}:${PORT}`)
  console.log(`Uploads: ${path.join(uploadsRoot)}`)
  if (isProd) console.log(`Static: ${distRoot}`)
})
