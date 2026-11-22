# ATM66 Mobile

Website cửa hàng **ATM66 Mobile** (Bình Thạnh, TP.HCM): thu mua máy cũ, bán máy Zin, sửa chữa điện thoại / iPad / laptop. Khách xem máy và nhắn **Zalo**; quản lý nội dung qua trang admin.

## Stack

| Phần | Công nghệ |
|------|-----------|
| Frontend | Vite + React 19 + TypeScript + React Router |
| Backend | Express 5 (`tsx`) |
| Database | SQLite (`node:sqlite`, Node **≥ 22**) |
| Auth admin | JWT + bcrypt |
| Media | Multer → thư mục `uploads/` |

Không dùng giỏ hàng / thanh toán online — bán qua Zalo.

## Yêu cầu

- **Node.js ≥ 22**
- npm

## Chạy nhanh (local)

```bash
npm install
npm run dev
```

| Dịch vụ | URL |
|---------|-----|
| Cửa hàng | http://127.0.0.1:5173 |
| API | http://127.0.0.1:3001/api/health |
| Admin | http://127.0.0.1:5173/admin/login |

Lần đầu chạy, SQLite tự tạo tại `data/` và seed dữ liệu mẫu.

### Tài khoản admin

- Set `ATM66_ADMIN_USER` + `ATM66_ADMIN_PASS` trước lần seed đầu (khuyến nghị khi deploy).
- Nếu không set, server **sinh ngẫu nhiên** và ghi vào `data/.admin-credentials` (không commit file này).
- Khi đã có admin trong DB, chỉ cập nhật lại nếu cả hai biến env đều được set.

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | API + Vite (dev) |
| `npm run dev:api` | Chỉ API |
| `npm run dev:web` | Chỉ frontend |
| `npm run build` | Build production → `dist/` |
| `npm start` | Chạy production (`NODE_ENV=production`, phục vụ `dist` + API) |
| `npm run lint` | Oxlint |

## Biến môi trường

Copy `.env.example` → `.env` trên server:

```bash
cp .env.example .env
```

| Biến | Ý nghĩa |
|------|---------|
| `NODE_ENV` | `production` khi lên thật |
| `ATM66_API_PORT` | Cổng API (mặc định `3001`) |
| `ATM66_HOST` | Host listen (`127.0.0.1` local; prod mặc định `0.0.0.0`) |
| `ATM66_JWT_SECRET` | **Bắt buộc** khi production — chuỗi dài ngẫu nhiên |
| `ATM66_CORS_ORIGIN` | Origin frontend nếu API tách domain |

Production **không chạy** nếu thiếu / dùng JWT secret mặc định.

## Trang cửa hàng (khách)

| Menu | Đường dẫn | Ghi chú |
|------|-----------|---------|
| Home | `/` | Hero, máy hot, CTA Zalo |
| Sản phẩm | `/san-pham` | Catalog đầy đủ |
| Chi tiết SP | `/san-pham/:id` | Gallery, mô tả, Zalo |
| Máy mới về | `/may-moi` | Bài đăng máy (gắn SP) |
| Chi tiết bài | `/may-moi/:slug` | Link sang chi tiết sản phẩm |
| Sửa máy | `/sua-may` | Nội dung CMS + QR Zalo |
| Khuyến mãi | `/khuyen-mai` | Banner CMS + máy giảm giá |
| Quy trình thu mua | `/quy-trinh-thu-mua` | CMS |
| Bảo hành | `/bao-hanh` | CMS |
| Giới thiệu | `/gioi-thieu` | CMS + Google Maps |
| Liên hệ | `/lien-he` | CMS + QR Zalo + SĐT |

`/tin-tuc` redirect → `/may-moi`. Admin **không** hiện trên menu khách.

## Admin (nội bộ)

Vào `/admin/login` (không link công khai trên storefront).

| Mục | Đường dẫn | Việc làm |
|-----|-----------|----------|
| Dashboard | `/admin` | Tổng quan + shortcut |
| Danh mục | `/admin/danh-muc` | CRUD danh mục |
| Sản phẩm | `/admin/san-pham` | Thêm/sửa SP, giá/Zalo, hot, gallery, **chi tiết trang khách** |
| Đăng máy | `/admin/bai-viet` | Soạn bài kiểu Zalo, chọn **danh mục → sản phẩm**, checklist tick + kéo thả |
| Trang nội dung | `/admin/trang` | Sửa máy, KM, bảo hành, giới thiệu, liên hệ, quy trình… |
| Đơn hàng | `/admin/don-hang` | Theo dõi (legacy/demo) |
| Giao diện | `/admin/giao-dien` | Tên shop, slogan, SĐT Zalo, địa chỉ, map, màu, logo |

### Luồng “Đăng máy” vs “Sản phẩm”

- **Sản phẩm** = kho máy đầy đủ trên `/san-pham`.
- **Đăng máy** = bài ngắn trên `/may-moi`, bắt buộc gắn 1 sản phẩm → khách bấm sang `/san-pham/:id`.

## Cấu trúc thư mục

```
/agent
├── public/                 # static (robots.txt, brand QR…)
├── src/                    # React storefront + admin UI
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── lib/
├── server/                 # Express API
│   ├── index.ts
│   ├── db.ts               # SQLite schema + seed
│   ├── auth.ts
│   └── media.ts            # upload ảnh
├── data/                   # SQLite (không commit secret/prod DB)
├── uploads/                # ảnh upload
├── .env.example
└── package.json
```

## Production ngắn

```bash
cp .env.example .env
# điền ATM66_JWT_SECRET, đổi mật khẩu admin trong DB/UI khi đã login

npm install
npm run build
npm start
```

Khuyến nghị:

1. Host **Node dài hạn** (Railway / Render / Fly / VPS) — SQLite + `uploads/` cần disk bền. **Không** chạy full stack trên Vercel serverless.
2. Reverse proxy (Nginx/Caddy) + **HTTPS** (nếu VPS)
3. Proxy `/` → app; đảm bảo `/api` và `/uploads` tới cùng process
4. **Backup** định kỳ: thư mục `data/` (`.db`) + `uploads/`
5. Firewall chỉ mở 80/443; cập nhật `robots.txt` (Sitemap) khi có domain

Vercel (chỉ static FE, giới hạn SQLite/uploads): xem **[VERCEL.md](./VERCEL.md)**.

## Bảo mật đã có

- JWT bắt buộc khi `NODE_ENV=production`
- Login chỉ tài khoản **admin**; giới hạn thử sai theo IP
- Đăng ký khách **tắt**
- Header: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, HSTS (prod)
- Upload chỉ file ảnh, giới hạn dung lượng
- `robots.txt` Disallow `/admin`, `/api`
- Trang login admin: không prefill mật khẩu, có nút hiện/ẩn mật khẩu

## Zalo / liên hệ

- Số Zalo / địa chỉ / tên liên hệ: **Admin → Giao diện**
- QR Cô Long: `public/brand/zalo-qr-co-long.png` (hiện trên Sửa máy & Liên hệ)

## License / quyền sở hữu

Private — dùng nội bộ ATM66 Mobile. Không phân phối công khai trừ khi chủ cửa hàng cho phép.
