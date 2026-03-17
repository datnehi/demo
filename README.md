# BMI Data Collection (Express + Admin Page)

## 1) Install

```bash
npm install
```

## 2) Run

Tao file `.env` (hoac dung bien moi truong) de dat tai khoan admin:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Sau do chay:

```bash
npm start
```

Mở form thu thập: http://localhost:3000

Mở trang đăng nhập admin: http://localhost:3000/login

Mở trang admin (yêu cầu đăng nhập): http://localhost:3000/admin

## Notes

- API `POST /api/collect`: nhận dữ liệu từ form, tính BMI và lưu vào bộ nhớ server.
- API `GET /api/submissions`: trả danh sách dữ liệu để trang admin hiển thị (cần đăng nhập admin).
- API `POST /api/admin/login`: đăng nhập admin và tạo session cookie.
- API `POST /api/admin/logout`: đăng xuất admin.
- Du lieu hien dang luu trong bo nho RAM, se mat khi restart server.
