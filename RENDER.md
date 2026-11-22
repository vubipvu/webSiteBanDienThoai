# ATM66 — Deploy trên Render

Full stack **Express + SQLite (`node:sqlite`) + Multer uploads** chạy bằng `npm start` (phục vụ `dist` + API cùng process).

Repo đã có Blueprint: [`render.yaml`](./render.yaml).

## Quan trọng: Free ≠ persistent disk

| | Render **Free** Web Service | **Starter** (trả phí) + Disk |
|--|--|--|
| Chi phí compute | $0 | ~$7/tháng (đổi theo bảng giá Render) |
| Spin-down khi idle ~15 phút | Có → cold start ~1 phút | Không (theo plan trả phí) |
| Filesystem | **Ephemeral** — mất `data/` + `uploads/` mỗi lần redeploy / restart / spin-down | **Persistent disk** giữ SQLite + ảnh |
| Custom domain + TLS | Có | Có |

**Kết luận thẳng:** Free chỉ phù hợp thử nghiệm hoặc chấp nhận mất DB/ảnh khi service ngủ. Muốn cửa hàng ổn định (admin upload máy thật) → nâng plan trả phí nhỏ nhất hỗ trợ disk, gắn disk, set `ATM66_PERSIST_ROOT=/var/data`.

Agent **không** tạo tài khoản Render / mua domain giúp bạn.

---

## Cách A — Dashboard (Web Service từ GitHub)

1. Đăng ký / đăng nhập [dashboard.render.com](https://dashboard.render.com).
2. **New** → **Web Service**.
3. Connect GitHub → chọn repo `vubipvu/webSiteBanDienThoai` → nhánh đã merge (thường `main`).
4. Điền:
   - **Runtime:** Node
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Instance type:** **Free** (hoặc Starter nếu cần disk)
5. **Environment** (Environment Variables):

   | Key | Value |
   |-----|--------|
   | `NODE_VERSION` | `22` |
   | `NODE_ENV` | `production` |
   | `ATM66_HOST` | `0.0.0.0` |
   | `ATM66_JWT_SECRET` | chuỗi dài ngẫu nhiên (bắt buộc) |
   | `ATM66_ADMIN_USER` | username admin lần seed đầu |
   | `ATM66_ADMIN_PASS` | password admin lần seed đầu |

   Không cần set `PORT` / `ATM66_API_PORT` — Render tự inject `PORT`; app đã đọc biến này.

6. **Create Web Service** → đợi build xanh → mở URL `*.onrender.com` và `/admin/login`.

### Persistent disk (chỉ plan trả phí)

Free **không** hiện / không gắn được disk.

1. Đổi compute plan sang **Starter** (hoặc plan trả phí khác).
2. Service → **Disk** (hoặc **Advanced** lúc tạo) → **Add disk**:
   - **Mount path:** `/var/data`
   - **Size:** `1` GB đủ khởi đầu (chỉ tăng được, không giảm)
3. Thêm env:

   | Key | Value |
   |-----|--------|
   | `ATM66_PERSIST_ROOT` | `/var/data` |

   App ghi SQLite vào `/var/data/data/` và ảnh vào `/var/data/uploads/`.

4. Redeploy. Backup định kỳ: copy thư mục trên disk (hoặc snapshot Render nếu có).

---

## Cách B — Blueprint (`render.yaml`)

1. Dashboard → **New** → **Blueprint**.
2. Chọn repo GitHub có `render.yaml`.
3. Render hỏi các biến `sync: false`: `ATM66_JWT_SECRET`, `ATM66_ADMIN_USER`, `ATM66_ADMIN_PASS`.
4. Apply → service `atm66` plan **free**.

Sau khi nâng plan + gắn disk `/var/data`, thêm thủ công `ATM66_PERSIST_ROOT=/var/data` (Blueprint free cố ý không khai báo `disk:`).

Ví dụ nâng cấp (tham khảo — chỉnh trên Dashboard hoặc sửa Blueprint rồi sync):

```yaml
plan: starter
disk:
  name: atm66-data
  mountPath: /var/data
  sizeGB: 1
envVars:
  - key: ATM66_PERSIST_ROOT
    value: /var/data
```

---

## Custom domain (mua domain riêng — làm sau)

1. Mua domain ở nhà đăng ký bất kỳ (agent không mua giúp).
2. Render → service → **Settings** → **Custom Domains** → **Add** → nhập `www.cuahang-cua-ban.com` (hoặc apex).
3. Render hiện bản ghi DNS cần thêm. Tại DNS host:
   - **Subdomain (`www`):** CNAME → `xxx.onrender.com` (đúng target Render hiện)
   - **Apex (`@`):** theo hướng dẫn Render (A/ALIAS/ANAME tùy nhà DNS)
4. Đợi DNS + TLS (Let's Encrypt do Render cấp) → xanh.
5. Cập nhật Zalo / Google Maps / `robots.txt` Sitemap khi có domain thật.

Cùng origin FE+API → **không** cần `ATM66_CORS_ORIGIN`.

---

## Kiểm tra sau deploy

- `GET https://<service>.onrender.com/api/health` → OK
- Storefront `/` load
- `/admin/login` với user/pass đã set
- Upload ảnh sản phẩm (chỉ bền nếu đã có disk)

---

## Caveat Free (đọc trước khi trông chờ production)

1. **Spin-down:** ~15 phút không traffic → ngủ; request sau có **cold start ~1 phút** (trang loading Render).
2. **Mất dữ liệu local:** mỗi spin-down / redeploy / restart xóa thay đổi trên FS (SQLite + uploads) trừ khi có **persistent disk** (không có trên Free).
3. **750 Free instance hours / tháng** workspace; hết giờ → suspend tới tháng sau.
4. Trong lúc ngủ, Render có thể trả `robots.txt` “disallow all” — không phải file trong repo.
5. Không SSH / không edge cache trên Free.

Chi tiết store: `docs/atm66-render.md` (agent project).
