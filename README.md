# HomeService – Website Khách hàng

Website dành cho khách hàng của hệ thống **HomeService** (đặt dịch vụ tại nhà, theo mô hình bTaskee) — đề tài Công nghệ phần mềm Nâng cao, Nhóm 15.

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: react-router-dom
- **HTTP client**: axios (`src/services/api.ts`, tự gắn JWT, tự đăng xuất khi gặp 401)
- **Bản đồ**: Leaflet + OpenStreetMap (không cần API key)
- **Icon**: lucide-react
- **Backend**: repo `HomeService-Backend` — cần nhánh có đủ Sprint 7 (`feature/sprint-7-hoan-thien-bao-cao`, có `/api/profile`, `GET /api/reviews/user/{id}`, lọc đơn `?status=&keyword=`…)

## Chạy dự án

```bash
npm install
cp .env.example .env     # chỉnh VITE_API_BASE_URL nếu backend chạy ở địa chỉ khác
npm run dev
```

Mặc định chạy ở `http://localhost:5173`, gọi API tại `http://localhost:8080/api` (CORS của Backend cho phép 5173 và 5174).
Chưa có Backend: ở trang `/login` bấm **"Xem thử giao diện khách hàng"** (chỉ có khi chạy `npm run dev`) — các trang dùng dữ liệu mẫu theo Figma.

## Trang và User Story

| Đường dẫn | Trang | User Story |
|---|---|---|
| `/` | Landing: dịch vụ, bảng giá, tìm kiếm | US10, US11 |
| `/login`, `/register` | Đăng nhập, đăng ký | US01, US02, US03 |
| `/booking/new` | Tạo đơn (giờ, địa chỉ, tọa độ), thanh toán trước | US12, US13, US21 |
| `/bookings` | Đơn của tôi: lọc, tìm, hủy (hiện phí hủy), thử lại, xác nhận, khiếu nại, đánh giá | US14, US15, US33 |
| `/bookings/:id` | Chi tiết đơn: bản đồ theo dõi Tasker, ảnh trước/sau, đánh giá, kết quả khiếu nại, trả nợ | US19, US25, US34–US37 |
| `/notifications` | Thông báo, chuông chưa đọc | US29 |
| `/profile` | Hồ sơ cá nhân, lịch sử thanh toán | US05, US24 |
| `/tasker-guide` | Hướng dẫn làm Tasker (đăng ký trên app di động) | US04 |

## Phân quyền & chuyển role bằng đăng nhập

Đăng nhập ở Web Customer hoặc Web Admin đều được; hệ thống đọc `role` rồi đưa đến đúng website:

| Tài khoản | Đăng nhập ở Web Customer (5173) | Đăng nhập ở Web Admin (5174) |
|---|---|---|
| Khách hàng (0) | Vào trang chủ | Tự chuyển sang Web Customer |
| Admin (2) | Tự chuyển sang Web Admin | Vào Dashboard |
| Tasker (1) | Báo lỗi: dùng app di động | Báo lỗi: dùng app di động |

Phiên được chuyển qua URL hash (`#auth=...`) và bị xóa khỏi thanh địa chỉ ngay khi trang đích đọc xong. Địa chỉ Web Admin cấu hình ở `VITE_ADMIN_URL`.

## Cấu trúc thư mục

```
src/
├── pages/        # Landing, Login, Register, Booking, Orders, BookingDetail, Notifications, Profile, TaskerGuide
├── components/   # Navbar, OrderActions (nút theo trạng thái đơn), OrderDialogs, TrackingMap, Modal...
├── services/     # api.ts (axios), authService, serviceCatalog, bookingService, userServices
├── context/      # AuthContext, NotificationContext
├── types/        # Kiểu dữ liệu, enum số – khớp DTO của Backend (SRS mục 7.8, 9)
├── utils/        # format tiền/giờ, validate (SRS 6.1), trạng thái đơn, chuyển phiên giữa 2 website
├── data/         # Dữ liệu mẫu cho chế độ xem thử khi chưa có Backend
└── styles/       # Design token theo Figma + CSS từng khu vực
```

## Quy ước làm việc nhóm

Tên nhánh `feature/USxx-...`, commit `feat: USxx ...`, mở Pull Request vào `main` (xem file *Hướng dẫn làm việc nhóm với Repo*). Mỗi page/service có comment `// USxx` ở đầu file.

## Build production

```bash
npm run build
```
