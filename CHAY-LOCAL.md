# Cách chạy trên VS Code (tránh Failed to fetch)

`Failed to fetch` = **trình duyệt không gọi được API** (port 3001). Thường vì chỉ mở frontend hoặc API crash.

## Làm đúng

1. Cài **Node.js 22+** (bắt buộc — dùng SQLite có sẵn trong Node, không cần `better-sqlite3`)
2. Trong thư mục project:

```bash
npm install
npm run dev
```

Phải thấy **cả hai** dòng:

- `ATM66 API (SQLite local) http://127.0.0.1:3001`
- `Local: http://127.0.0.1:5173/`

3. Mở đúng: **http://127.0.0.1:5173** (không mở file `index.html` trực tiếp)

## Admin / Danh mục

- http://127.0.0.1:5173/admin/login  
- Set `ATM66_ADMIN_USER` / `ATM66_ADMIN_PASS`, hoặc xem console lần seed đầu (dev) — không còn file `.admin-credentials`.

Nếu vẫn lỗi: xem terminal có đỏ không; tắt hết `node` cũ rồi chạy lại `npm run dev`.
