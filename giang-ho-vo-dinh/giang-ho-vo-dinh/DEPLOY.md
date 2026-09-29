# GIANG HỒ VÔ ĐỊNH — WEB DEPLOYMENT

## Mục tiêu

Deploy một server duy nhất cho bản single-player web/PWA hiện tại. Người chơi mở HTTPS URL trên Android, iPhone, tablet hoặc PC.

## 1. Chuẩn bị server

Một Linux VPS có Docker + Docker Compose là đủ. Domain nên trỏ A/AAAA record vào IP của VPS.

## 2. Cấu hình secrets

Tạo file `.env` cạnh `docker-compose.yml`:

```env
ADMIN_PASSWORD=mat-khau-admin-that-dai
ADMIN_SESSION_SECRET=chuoi-ngau-nhien-dai
```

Không commit file `.env` vào Git.

## 3. Khởi động game

```bash
docker compose up -d --build
```

Lần đầu `db-init` sẽ chờ PostgreSQL khỏe rồi chạy hai migration SQL trong thư mục `migrations/`.

## 4. Kiểm tra

```bash
curl http://localhost:3000/api/health
```

Khi trả JSON có `ok: true`, mở domain HTTPS trên điện thoại.

## 5. Reverse proxy / HTTPS

Đặt Nginx, Caddy hoặc reverse proxy của nhà cung cấp cloud phía trước `localhost:3000` và bật HTTPS.

## 6. Admin

Mở:

```text
https://DOMAIN_CUA_BAN/admin
```

Đăng nhập bằng `ADMIN_PASSWORD`.

## 7. Backup database

PostgreSQL là nguồn persistence. Sao lưu định kỳ:

```bash
docker exec -t <container-db> pg_dump -U postgres giang_ho_vo_dinh > backup.sql
```

## 8. Giới hạn hiện tại

Đây là single-player architecture như Master Plan. Chưa có multi-user accounts, role-based admin, billing, CDN hay horizontal scaling.
