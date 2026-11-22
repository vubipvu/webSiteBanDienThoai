export type ProductCategory = 'moi' | 'cu' | 'phu-kien'

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
  stock: number
}

export const categoryLabels: Record<ProductCategory, string> = {
  moi: 'Điện thoại mới',
  cu: 'Điện thoại cũ',
  'phu-kien': 'Phụ kiện',
}

export const products: Product[] = [
  {
    id: 'iphone-16-pro',
    name: 'iPhone 16 Pro 256GB',
    brand: 'Apple',
    category: 'moi',
    price: 29990000,
    originalPrice: 31990000,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
    storage: '256GB',
    color: 'Titanium Đen',
    description: 'Chip A18 Pro, camera 48MP, khung titanium nhẹ — máy mới nguyên seal, bảo hành chính hãng 12 tháng.',
    popular: true,
    stock: 18,
  },
  {
    id: 'samsung-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 512GB',
    brand: 'Samsung',
    category: 'moi',
    price: 27990000,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
    storage: '512GB',
    color: 'Titanium Xám',
    description: 'S Pen tích hợp, zoom 100x, màn hình Dynamic AMOLED 2X 120Hz — hàng mới, VAT đầy đủ.',
    popular: true,
    stock: 12,
  },
  {
    id: 'xiaomi-14t',
    name: 'Xiaomi 14T 256GB',
    brand: 'Xiaomi',
    category: 'moi',
    price: 10990000,
    originalPrice: 11990000,
    image: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
    storage: '256GB',
    color: 'Xanh dương',
    description: 'Leica Optics, Dimensity 8300-Ultra, sạc nhanh 67W — lựa chọn hiệu năng/giá tốt cho năm 2026.',
    stock: 24,
  },
  {
    id: 'oppo-reno12',
    name: 'OPPO Reno12 5G 256GB',
    brand: 'OPPO',
    category: 'moi',
    price: 8990000,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    storage: '256GB',
    color: 'Tím sương',
    description: 'Thiết kế mỏng nhẹ, AI Portrait, sạc SUPERVOOC 80W — máy mới chính hãng.',
    stock: 15,
  },
  {
    id: 'vivo-v30',
    name: 'vivo V30 5G 256GB',
    brand: 'vivo',
    category: 'moi',
    price: 9490000,
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80',
    storage: '256GB',
    color: 'Đen bóng',
    description: 'Aura Light Portrait, màn cong 120Hz, pin 5000mAh — phù hợp chụp ảnh và dùng lâu.',
    stock: 10,
  },
  {
    id: 'iphone-13-pro-campaign',
    name: 'iPhone 13 Pro 128GB (Đã kiểm tra)',
    brand: 'Apple',
    category: 'cu',
    price: 12990000,
    originalPrice: 14990000,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=1200&q=85',
    condition: 'Like new — 99%',
    storage: '128GB',
    color: 'Graphite',
    description:
      'Máy cũ chọn kỹ tại ATM66: pin thật, Face ID ổn, khung đẹp. Kiểm tra 25 điểm, bảo hành đổi máy 7 ngày.',
    popular: true,
    stock: 6,
  },
  {
    id: 'iphone-13-refurb',
    name: 'iPhone 13 128GB (Cũ đẹp)',
    brand: 'Apple',
    category: 'cu',
    price: 8990000,
    originalPrice: 10990000,
    image: 'https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80',
    condition: '99% — như mới',
    storage: '128GB',
    color: 'Midnight',
    description: 'Máy cũ đã kiểm tra kỹ, pin trên 88%, kèm bảo hành ATM66 6 tháng. Không trầy cảm ứng.',
    popular: true,
    stock: 7,
  },
  {
    id: 'samsung-a54-refurb',
    name: 'Samsung Galaxy A54 128GB (Cũ)',
    brand: 'Samsung',
    category: 'cu',
    price: 4990000,
    image: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80',
    condition: '95% — đẹp',
    storage: '128GB',
    color: 'Đen',
    description: 'Máy cũ chính hãng, màn AMOLED 120Hz còn đẹp, đã thay ốp bảo vệ khi trưng bày.',
    stock: 9,
  },
  {
    id: 'iphone-12-refurb',
    name: 'iPhone 12 64GB (Cũ)',
    brand: 'Apple',
    category: 'cu',
    price: 5990000,
    originalPrice: 6990000,
    image: 'https://images.unsplash.com/photo-1603921326210-6edd2d60ca68?w=800&q=80',
    condition: '90% — tốt',
    storage: '64GB',
    color: 'Xanh dương',
    description: 'Giá dễ tiếp cận, Face ID hoạt động tốt, pin thay mới tại ATM66 nếu dưới 85%.',
    stock: 11,
  },
  {
    id: 'pixel-7-refurb',
    name: 'Google Pixel 7 128GB (Cũ)',
    brand: 'Google',
    category: 'cu',
    price: 5490000,
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
    condition: '97% — đẹp',
    storage: '128GB',
    color: 'Snow',
    description: 'Camera Google Tensor nổi tiếng, cập nhật phần mềm dài hạn — máy cũ chọn lọc.',
    stock: 5,
  },
  {
    id: 'case-clear-magsafe',
    name: 'Ốp trong suốt MagSafe',
    brand: 'ATM66',
    category: 'phu-kien',
    price: 249000,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    description: 'Ốp TPU chống ố vàng, hỗ trợ MagSafe, tương thích iPhone 14/15/16.',
    popular: true,
    stock: 80,
  },
  {
    id: 'charger-gan-65',
    name: 'Củ sạc GaN 65W USB-C',
    brand: 'Anker',
    category: 'phu-kien',
    price: 690000,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
    description: 'Sạc nhanh đa thiết bị, nhỏ gọn, bảo vệ quá nhiệt — phù hợp laptop & điện thoại.',
    stock: 40,
  },
  {
    id: 'earbuds-airpods-pro2',
    name: 'AirPods Pro 2 (USB-C)',
    brand: 'Apple',
    category: 'phu-kien',
    price: 5490000,
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80',
    description: 'Chống ồn chủ động, Adaptive Audio, hộp sạc USB-C — hàng mới chính hãng.',
    popular: true,
    stock: 22,
  },
  {
    id: 'glass-9h',
    name: 'Kính cường lực 9H full màn',
    brand: 'ATM66',
    category: 'phu-kien',
    price: 99000,
    image: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&q=80',
    description: 'Dán miễn phí tại cửa hàng, chống trầy xước, cảm ứng mượt.',
    stock: 200,
  },
  {
    id: 'cable-usb-c-2m',
    name: 'Cáp USB-C 2m 100W',
    brand: 'Baseus',
    category: 'phu-kien',
    price: 189000,
    image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80',
    description: 'Cáp bện nylon, truyền dữ liệu nhanh, sạc PD 100W cho điện thoại và laptop.',
    stock: 60,
  },
  {
    id: 'powerbank-20k',
    name: 'Pin dự phòng 20.000mAh',
    brand: 'Xiaomi',
    category: 'phu-kien',
    price: 549000,
    image: 'https://images.unsplash.com/photo-1609091839311-b48b16d6669e?w=800&q=80',
    description: 'Sạc nhanh 33W, 2 cổng ra, nhỏ gọn mang theo hàng ngày.',
    stock: 35,
  },
]

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export const dashboardOrders = [
  { id: 'DH-2401', customer: 'Nguyễn Minh Anh', total: 29990000, status: 'Đang giao', items: 1 },
  { id: 'DH-2402', customer: 'Trần Quốc Bảo', total: 918000, status: 'Đã thanh toán', items: 3 },
  { id: 'DH-2403', customer: 'Lê Thu Hà', total: 8990000, status: 'Chờ xác nhận', items: 1 },
  { id: 'DH-2404', customer: 'Phạm Đức Huy', total: 5490000, status: 'Hoàn tất', items: 1 },
  { id: 'DH-2405', customer: 'Võ Ngọc Lan', total: 10990000, status: 'Đang giao', items: 1 },
]
