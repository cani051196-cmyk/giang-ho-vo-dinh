# GIANG HỒ VÔ ĐỊNH — dùng như một website/app

## Mục tiêu

Người chơi chỉ cần một địa chỉ web HTTPS. Không cài Node.js, không chạy BAT, không mở terminal. Trên điện thoại, mở Chrome/Safari rồi chọn **Thêm vào màn hình chính** để dùng như app PWA.

## Kiến trúc triển khai

- SvelteKit + adapter-vercel
- Vercel làm web/server runtime
- PostgreSQL managed (khuyến nghị Neon)
- PWA manifest + service worker có sẵn

## Lần triển khai đầu tiên

1. Đưa repository này lên GitHub.
2. Trong Vercel chọn **Add New → Project**, import repository.
3. Vercel nhận diện SvelteKit và chạy `npm run build`.
4. Tạo/kết nối PostgreSQL (Neon) và lấy `DATABASE_URL`.
5. Thêm `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` vào Environment Variables.
6. Deploy.
7. Sau khi deploy, Vercel cấp một URL `*.vercel.app`. Đây là địa chỉ duy nhất để chơi. Có thể gắn domain riêng sau.

## Sau này sửa game

- Sửa content: vào `/admin` trên chính website.
- Sửa luật Engine: AI Developer sửa code + test + deploy.
- Khi repository đã nối với Vercel, mỗi lần push commit mới Vercel có thể tạo deployment mới và đưa bản production lên sau khi build thành công.

## Lưu ý

Website production cần HTTPS để PWA cài như ứng dụng và để trình duyệt cho phép các tính năng web hiện đại.
