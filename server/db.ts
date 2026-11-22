import { DatabaseSync } from 'node:sqlite'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dashboardOrders, products } from '../src/data/products.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'atm66.db')

fs.mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(dbPath)

function ensureColumn(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string
  }>
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

function tx(fn: () => void) {
  db.exec('BEGIN')
  try {
    fn()
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      display_name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      original_price INTEGER,
      image TEXT NOT NULL,
      condition TEXT,
      storage TEXT,
      color TEXT,
      description TEXT NOT NULL,
      popular INTEGER NOT NULL DEFAULT 0,
      hot_month INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      user_id INTEGER,
      phone TEXT,
      total INTEGER NOT NULL,
      status TEXT NOT NULL,
      items INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      cover TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS site_pages (
      slug TEXT PRIMARY KEY,
      nav_label TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      cover TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      path TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_cover INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `)

  ensureColumn('products', 'hot_month', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn('products', "price_mode", "TEXT NOT NULL DEFAULT 'price'")
  ensureColumn('articles', 'product_id', 'TEXT')
  ensureColumn('users', 'phone', 'TEXT')
  ensureColumn('orders', 'user_id', 'INTEGER')
  ensureColumn('orders', 'phone', 'TEXT')

  // Admin: chỉ tạo khi chưa có. Username/password lấy từ env hoặc sinh ngẫu nhiên (không hardcode trong source).
  const adminRow = db
    .prepare(`SELECT id, username FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1`)
    .get() as { id: number; username: string } | undefined
  if (!adminRow) {
    const envUser = process.env.ATM66_ADMIN_USER?.trim()
    const envPass = process.env.ATM66_ADMIN_PASS?.trim()
    const fromEnv = Boolean(envUser && envPass)
    // Production/hosted: never bootstrap from random + plaintext file.
    if (!fromEnv && process.env.NODE_ENV !== 'development') {
      console.error(
        '[ATM66] Seed admin lần đầu cần ATM66_ADMIN_USER và ATM66_ADMIN_PASS (không ghi plaintext ra disk).',
      )
      process.exit(1)
    }
    const ADMIN_USER = envUser || `atm66_${crypto.randomBytes(3).toString('hex')}`
    const ADMIN_PASS =
      envPass || `${crypto.randomBytes(12).toString('base64url')}Aa1!`
    const adminHash = bcrypt.hashSync(ADMIN_PASS, 10)
    db.prepare(
      `INSERT INTO users (username, password_hash, role, display_name, phone)
       VALUES (?, ?, 'admin', ?, ?)`,
    ).run(ADMIN_USER, adminHash, 'Quản trị ATM66', '0901339616')
    if (fromEnv) {
      console.log(`[ATM66] Admin created from env: user=${ADMIN_USER}`)
    } else {
      // Local development only — never write credentials to a file.
      console.log(
        `[ATM66] Admin created (dev only): user=${ADMIN_USER} pass=${ADMIN_PASS}`,
      )
    }
  } else if (process.env.ATM66_ADMIN_USER && process.env.ATM66_ADMIN_PASS) {
    const adminHash = bcrypt.hashSync(process.env.ATM66_ADMIN_PASS, 10)
    db.prepare(
      `UPDATE users SET username = ?, password_hash = ?, display_name = 'Quản trị ATM66'
       WHERE id = ?`,
    ).run(process.env.ATM66_ADMIN_USER.trim(), adminHash, adminRow.id)
  }

  const catCount = db.prepare('SELECT COUNT(*) AS c FROM categories').get() as {
    c: number
  }
  if (catCount.c === 0) {
    const insert = db.prepare(
      `INSERT INTO categories (id, name, description, sort_order) VALUES (?, ?, ?, ?)`,
    )
    tx(() => {
      insert.run('moi', 'Điện thoại mới', 'Máy mới chính hãng, seal', 1)
      insert.run('cu', 'Điện thoại cũ', 'Máy cũ đã kiểm tra tại ATM66', 2)
      insert.run('phu-kien', 'Phụ kiện', 'Ốp, sạc, kính, tai nghe…', 3)
    })
  }

  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get() as {
    c: number
  }
  if (productCount.c === 0) {
    const insert = db.prepare(`
      INSERT INTO products (
        id, name, brand, category, price, original_price, image,
        condition, storage, color, description, popular, hot_month, stock
      ) VALUES (
        @id, @name, @brand, @category, @price, @original_price, @image,
        @condition, @storage, @color, @description, @popular, @hot_month, @stock
      )
    `)
    tx(() => {
      for (const p of products) {
        insert.run({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          price: p.price,
          original_price: p.originalPrice ?? null,
          image: p.image,
          condition: p.condition ?? null,
          storage: p.storage ?? null,
          color: p.color ?? null,
          description: p.description,
          popular: p.popular ? 1 : 0,
          hot_month: p.popular ? 1 : 0,
          stock: p.stock,
        })
      }
    })
  }

  const orderCount = db.prepare('SELECT COUNT(*) AS c FROM orders').get() as {
    c: number
  }
  if (orderCount.c === 0) {
    const insert = db.prepare(
      `INSERT INTO orders (id, customer, total, status, items) VALUES (?, ?, ?, ?, ?)`,
    )
    tx(() => {
      for (const o of dashboardOrders) {
        insert.run(o.id, o.customer, o.total, o.status, o.items)
      }
    })
  }

  const articleCount = db.prepare('SELECT COUNT(*) AS c FROM articles').get() as {
    c: number
  }
  if (articleCount.c === 0) {
    db.prepare(
      `INSERT INTO articles (title, slug, excerpt, content, cover, published)
       VALUES (?, ?, ?, ?, ?, 1)`,
    ).run(
      'Cách chọn điện thoại cũ an toàn tại ATM66',
      'cach-chon-dien-thoai-cu',
      'Checklist nhanh trước khi xuống tiền máy cũ.',
      'Tại ATM66, máy cũ đều qua kiểm tra pin, Face ID/cảm biến và tình trạng thân máy. Bạn nên xem báo cáo tình trạng và hỏi rõ thời hạn bảo hành shop trước khi mua.',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=80',
    )
  }

  const pageCount = db.prepare(`SELECT COUNT(*) AS c FROM site_pages`).get() as {
    c: number
  }
  if (pageCount.c === 0) {
    const insertPage = db.prepare(
      `INSERT INTO site_pages (slug, nav_label, title, subtitle, content, cover)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    insertPage.run(
      'gioi-thieu',
      'Giới thiệu',
      'Giới thiệu ATM66 Mobile',
      'Cửa hàng máy của cô Long tại Bình Thạnh — nói thật về tình trạng, giá rõ, hỗ trợ Zalo.',
      [
        'ATM66 Mobile tại 180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh.',
        'Chúng tôi bán điện thoại mới, máy cũ đã kiểm tra và phụ kiện dùng thật mỗi ngày.',
        'Cách làm đơn giản: kiểm định trước khi lên kệ, ghi rõ grade, tư vấn đúng nhu cầu — không ép lên đời.',
        'Liên hệ cô Long: 0901339616 (Zalo / gọi trực tiếp). Ghé quầy hoặc nhắn trước khi đến.',
      ].join('\n\n'),
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
    )
    insertPage.run(
      'quy-trinh-thu-mua',
      'Quy trình thu mua',
      'Quy trình thu mua & kiểm định máy',
      'ATM66 Mobile nhận máy / kiểm định trước khi lên kệ — nói rõ tình trạng, giá rõ ràng.',
      [
        '01 · Tiếp nhận máy\nKhách mang máy hoặc shop thu mua — ghi nhận nguồn gốc, phụ kiện kèm theo.',
        '02 · Kiểm tra ngoại thất & màn\nTrầy xước, lõm cạnh, dead pixel, cảm ứng — ghi rõ trước khi định giá.',
        '03 · Pin, Face ID & phần mềm\nPin thật, cảm biến, iCloud sạch, cập nhật ổn định.',
        '04 · Định giá & lên kệ\nThống nhất giá thu / giá bán, gắn grade Like new · Đẹp · Tốt.',
        'Liên hệ cô Long (0901339616) để được tư vấn thu mua hoặc xem máy đang bán.',
      ].join('\n\n'),
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1400&q=80',
    )
  }

  // Đổi tên trang cũ kiem-dinh → quy-trinh-thu-mua (nếu còn)
  const oldKiem = db
    .prepare(`SELECT slug FROM site_pages WHERE slug = 'kiem-dinh'`)
    .get() as { slug: string } | undefined
  const newQuy = db
    .prepare(`SELECT slug FROM site_pages WHERE slug = 'quy-trinh-thu-mua'`)
    .get() as { slug: string } | undefined
  if (oldKiem && !newQuy) {
    db.prepare(
      `UPDATE site_pages SET
        slug = 'quy-trinh-thu-mua',
        nav_label = 'Quy trình thu mua',
        title = 'Quy trình thu mua & kiểm định máy',
        subtitle = 'ATM66 Mobile nhận máy / kiểm định trước khi lên kệ — nói rõ tình trạng, giá rõ ràng.',
        updated_at = datetime('now')
      WHERE slug = 'kiem-dinh'`,
    ).run()
  } else if (oldKiem && newQuy) {
    db.prepare(`DELETE FROM site_pages WHERE slug = 'kiem-dinh'`).run()
  } else if (newQuy) {
    db.prepare(
      `UPDATE site_pages SET nav_label = 'Quy trình thu mua', updated_at = datetime('now')
       WHERE slug = 'quy-trinh-thu-mua' AND nav_label != 'Quy trình thu mua'`,
    ).run()
  }

  // Bổ sung trang storefront còn thiếu (idempotent)
  const ensurePage = db.prepare(
    `INSERT INTO site_pages (slug, nav_label, title, subtitle, content, cover)
     SELECT ?, ?, ?, ?, ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM site_pages WHERE slug = ?)`,
  )
  ensurePage.run(
    'sua-may',
    'Sửa máy',
    'Sửa chữa uy tín — điện thoại, iPad, laptop',
    'Không đặt lịch online. Quét QR hoặc nhắn Zalo Cô Long.',
    [
      '📱 ATM66 Mobile — THU MUA máy cũ giá cao + BÁN máy Zin + SỬA CHỮA uy tín: điện thoại, iPad, laptop…',
      '01 · Báo giá trước khi sửa\nKiểm tra máy, nói rõ lỗi và chi phí — bạn đồng ý rồi mới làm.',
      '02 · Linh kiện rõ nguồn\nƯu tiên linh kiện tương thích tốt; ghi nhận loại thay thế trước khi lắp.',
      '03 · Không phí ẩn\nKhông phát sinh ngoài báo giá đã thống nhất.',
      '04 · Bảo hành sau sửa\nHạng mục đã sửa được bảo hành theo thỏa thuận tại quầy.',
      '05 · Quy trình\nQuét QR / nhắn Zalo → Kiểm tra & báo giá → Sửa & bàn giao.',
    ].join('\n\n'),
    '',
    'sua-may',
  )
  ensurePage.run(
    'khuyen-mai',
    'Khuyến mãi',
    'Khuyến mãi',
    'Ưu đãi lấy từ giá trong database — còn hàng có hạn.',
    [
      'Tặng kính 9H khi mua máy — áp dụng điện thoại mới & cũ. Dán miễn phí tại quầy.',
      'Máy có giá gốc cao hơn giá bán sẽ tự hiện trong danh sách bên dưới (chỉnh giá ở mục Sản phẩm).',
    ].join('\n\n'),
    '',
    'khuyen-mai',
  )
  ensurePage.run(
    'bao-hanh',
    'Bảo hành',
    'Chính sách bảo hành',
    'ATM66 minh bạch thời hạn và phạm vi bảo hành theo từng loại sản phẩm. Mang máy + hóa đơn khi đến bảo hành.',
    [
      '01 · Điện thoại mới\nBảo hành chính hãng theo tem/phiếu (thường 12 tháng). Đổi mới trong 7 ngày nếu lỗi nhà sản xuất (máy chưa qua sửa chữa ngoài). Không bảo hành do vào nước, rơi vỡ, can thiệp phần mềm trái phép.',
      '02 · Điện thoại cũ\nBảo hành ATM66 3–6 tháng tùy gói (ghi trên hóa đơn). Bao gồm lỗi phần cứng phát sinh trong sử dụng bình thường. Pin: hỗ trợ kiểm tra; đổi pin tính phí ưu đãi nếu ngoài phạm vi.',
      '03 · Phụ kiện\nỐp / kính: đổi mới 7 ngày nếu lỗi sản xuất. Sạc, cáp, tai nghe: bảo hành 1–12 tháng theo hãng. Giữ hộp/tem để đối chiếu khi bảo hành.',
      '04 · Quy trình\nMang sản phẩm + hóa đơn đến ATM66 → Kỹ thuật tiếp nhận, kiểm tra 1–3 ngày → Sửa / đổi / hoàn tiền theo hóa đơn.',
    ].join('\n\n'),
    '',
    'bao-hanh',
  )
  ensurePage.run(
    'lien-he',
    'Liên hệ',
    'Liên hệ',
    'Quét QR Zalo Cô Long hoặc nhắn tin — ATM66 Mobile phản hồi trong giờ làm việc.',
    [
      'Ghé cửa hàng hoặc nhắn Zalo Cô Long.',
      'Giờ mở cửa: 8:30 – 21:00 · Mỗi ngày (kể cả lễ).',
      'Địa chỉ / hotline lấy từ mục Giao diện (có thể đổi bất cứ lúc nào).',
    ].join('\n\n'),
    '',
    'lien-he',
  )

  // Thông tin shop thật (cô Long) — luôn đồng bộ khi khởi động
  const shopIdentity: Record<string, string> = {
    shop_name: 'ATM66 Mobile',
    zalo_phone: '0901339616',
    shop_address: '180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh, Việt Nam',
    contact_name: 'Cô Long',
    slogan: 'Thu mua giá cao · Bán máy Zin · Sửa chữa uy tín',
    announcement:
      'ATM66 Mobile — Thu mua máy cũ giá cao · Bán máy Zin · Sửa chữa: điện thoại, iPad, laptop',
    hero_headline: 'Thu mua · Bán Zin.\nSửa uy tín.',
    maps_embed_url:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0445537580244!2d106.70073577586874!3d10.807899658610246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752900770e229b%3A0x63b084c96d6faf7a!2sATM66%20Mobile!5e0!3m2!1svi!2s!4v1795343450554!5m2!1svi!2s',
  }
  const upsertShop = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  )
  for (const [k, v] of Object.entries(shopIdentity)) {
    upsertShop.run(k, v)
  }

  const hotCount = db
    .prepare(`SELECT COUNT(*) AS c FROM products WHERE hot_month = 1`)
    .get() as { c: number }
  if (hotCount.c === 0) {
    db.prepare(`UPDATE products SET hot_month = 1 WHERE popular = 1`).run()
  }

  // Campaign hero SKU — upsert so redesign luôn có máy featured
  const campaign = products.find((p) => p.id === 'iphone-13-pro-campaign')
  if (campaign) {
    const exists = db
      .prepare(`SELECT id FROM products WHERE id = ?`)
      .get(campaign.id)
    if (!exists) {
      db.prepare(`
        INSERT INTO products (
          id, name, brand, category, price, original_price, image,
          condition, storage, color, description, popular, hot_month, stock
        ) VALUES (
          @id, @name, @brand, @category, @price, @original_price, @image,
          @condition, @storage, @color, @description, 1, 1, @stock
        )
      `).run({
        id: campaign.id,
        name: campaign.name,
        brand: campaign.brand,
        category: campaign.category,
        price: campaign.price,
        original_price: campaign.originalPrice ?? null,
        image: campaign.image,
        condition: campaign.condition ?? null,
        storage: campaign.storage ?? null,
        color: campaign.color ?? null,
        description: campaign.description,
        stock: campaign.stock,
      })
    } else {
      db.prepare(`
        UPDATE products SET
          name = @name, price = @price, original_price = @original_price,
          image = @image, condition = @condition, description = @description,
          popular = 1, hot_month = 1, updated_at = datetime('now')
        WHERE id = @id
      `).run({
        id: campaign.id,
        name: campaign.name,
        price: campaign.price,
        original_price: campaign.originalPrice ?? null,
        image: campaign.image,
        condition: campaign.condition ?? null,
        description: campaign.description,
      })
    }
  }

  // Migrate products.image → product_images (cover) if gallery empty
  const productsNeedingGallery = db
    .prepare(
      `SELECT p.id, p.image FROM products p
       WHERE p.image IS NOT NULL AND p.image != ''
       AND NOT EXISTS (SELECT 1 FROM product_images i WHERE i.product_id = p.id)`,
    )
    .all() as Array<{ id: string; image: string }>
  const insertImg = db.prepare(
    `INSERT INTO product_images (product_id, path, sort_order, is_cover) VALUES (?, ?, 0, 1)`,
  )
  tx(() => {
    for (const p of productsNeedingGallery) {
      insertImg.run(p.id, p.image)
    }
  })

  const appearanceDefaults: Record<string, string> = {
    shop_name: 'ATM66 Mobile',
    slogan: 'Thu mua giá cao · Bán máy Zin · Sửa chữa uy tín',
    announcement:
      'ATM66 Mobile — Thu mua máy cũ giá cao · Bán máy Zin · Sửa chữa: điện thoại, iPad, laptop',
    hero_headline: 'Thu mua · Bán Zin.\nSửa uy tín.',
    hero_support: '',
    featured_product_id: 'iphone-13-pro-campaign',
    accent_color: '#00b89a',
    ink_color: '#0b1220',
    mist_color: '#e8eef5',
    logo_path: '',
    zalo_phone: '0901339616',
    shop_address: '180 Bùi Đình Tuý, Bình Thạnh, Hồ Chí Minh, Việt Nam',
    contact_name: 'Cô Long',
    maps_embed_url:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0445537580244!2d106.70073577586874!3d10.807899658610246!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752900770e229b%3A0x63b084c96d6faf7a!2sATM66%20Mobile!5e0!3m2!1svi!2s!4v1795343450554!5m2!1svi!2s',
  }
  const upsertSetting = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO NOTHING`,
  )
  for (const [k, v] of Object.entries(appearanceDefaults)) {
    upsertSetting.run(k, v)
  }
}
