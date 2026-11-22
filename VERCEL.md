# ATM66 — Vercel (best-effort)

## Kết luận ngắn

**Vercel Free (serverless) không phù hợp để chạy full ATM66** (Express + SQLite file + thư mục `uploads/`).

| Thành phần | Trên Vercel serverless |
|------------|------------------------|
| Frontend Vite (`dist/`) | OK — static SPA |
| Express API | Không bền — không phải Node process dài hạn |
| SQLite (`data/*.db`) | **Mất dữ liệu** — filesystem ephemeral |
| Upload ảnh (`uploads/`) | **Mất file** sau mỗi deploy / cold instance |

`vercel.json` trong repo chỉ build **frontend tĩnh**. `/api` và `/uploads` **không** chạy trên Vercel trừ khi bạn host API ở chỗ khác và tự nối (rewrite / CORS) — không khuyến nghị cho shop nhỏ nếu muốn nhanh và rẻ.

**Không** migrate sang Turso trong bước này: `server/` dùng `node:sqlite` sync + Multer disk — đổi DB + object storage là refactor lớn, không “simple”.

## Khuyến nghị (site public chạy sớm, chi phí thấp)

Deploy **cả app** (`npm run build` + `npm start`) lên host Node dài hạn có disk bền:

1. **Railway** hoặc **Render** hoặc **Fly.io** (volume cho `data/` + `uploads/`)
2. Hoặc VPS nhỏ + Nginx (xem `README.md`)

Một process phục vụ cả SPA + `/api` + `/uploads` — đúng thiết kế hiện tại.

## Nếu vẫn muốn dùng Vercel dashboard

1. Vào [vercel.com](https://vercel.com) → **Add New…** → **Project**
2. **Import** GitHub repo `vubipvu/webSiteBanDienThoai` (branch `main` hoặc PR merge)
3. Framework: Vite (đọc `vercel.json`)
4. Deploy — bạn chỉ có **HTML/JS tĩnh**; catalog/admin API sẽ lỗi fetch

Env trên Vercel **không** thay thế API:

| Biến | Ghi chú |
|------|---------|
| `ATM66_JWT_SECRET` | Chỉ có ích trên **server Node** (Railway/Render/…), không phải static Vercel |
| `ATM66_ADMIN_USER` / `ATM66_ADMIN_PASS` | Cùng — seed admin trên API host |
| `NODE_ENV=production` | Set trên API host |

## Split (Vercel FE + API riêng) — chỉ khi biết rõ rủi ro

- FE: Vercel (static)
- API: Railway/Render chạy `npm start`, set `ATM66_CORS_ORIGIN=https://<vercel-domain>`
- Frontend hiện gọi `/api` và `/uploads` **cùng origin** → cần rewrite proxy hoặc sửa base URL (chưa làm trong repo)

Ưu tiên **một host Node full stack** thay vì split.

## Cursor Apps

App Cursor private (nếu đã publish) có thể giữ nguyên — không liên quan Vercel.
