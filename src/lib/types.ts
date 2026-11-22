export type ProductCategory = string

export type ProductImage = {
  id: number
  product_id: string
  path: string
  sort_order: number
  is_cover: number
}

export type Product = {
  id: string
  name: string
  brand: string
  category: ProductCategory
  price: number
  originalPrice?: number
  image: string
  condition?: string
  storage?: string
  color?: string
  description: string
  popular?: boolean
  hotMonth?: boolean
  /** `price` = hiện VND; `contact` = nút Liên hệ Zalo */
  priceMode?: 'price' | 'contact'
  stock: number
  images?: ProductImage[]
}

export type Appearance = {
  shopName: string
  slogan: string
  announcement: string
  heroHeadline: string
  heroSupport: string
  featuredProductId: string
  accentColor: string
  inkColor: string
  mistColor: string
  logoUrl: string | null
  zaloPhone: string
  zaloUrl: string
  shopAddress: string
  contactName: string
  mapsEmbedUrl: string
}

export type Category = {
  id: string
  name: string
  description: string
}

export type Article = {
  id: number
  title: string
  slug: string
  excerpt: string
  content: string
  cover: string
  published: boolean
  created_at: string
  product_id?: string | null
  product_name?: string | null
  product_category?: string | null
  product_image?: string | null
  product_price?: number | null
  product_price_mode?: string | null
  product_brand?: string | null
}

export const categoryLabelsFallback: Record<string, string> = {
  moi: 'Điện thoại mới',
  cu: 'Điện thoại cũ',
  'phu-kien': 'Phụ kiện',
}

export function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    brand: String(row.brand),
    category: String(row.category),
    price: Number(row.price),
    originalPrice:
      row.original_price != null ? Number(row.original_price) : undefined,
    image: String(row.image),
    condition: row.condition ? String(row.condition) : undefined,
    storage: row.storage ? String(row.storage) : undefined,
    color: row.color ? String(row.color) : undefined,
    description: String(row.description),
    popular: Boolean(row.popular),
    hotMonth: Boolean(row.hot_month),
    priceMode: row.price_mode === 'contact' ? 'contact' : 'price',
    stock: Number(row.stock),
  }
}

export function isContactPrice(product: { priceMode?: string }): boolean {
  return product.priceMode === 'contact'
}
