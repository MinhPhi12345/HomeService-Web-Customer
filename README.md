# HomeService – Website Khách hàng

Website dành cho khách hàng của hệ thống **HomeService** (đặt dịch vụ tại nhà, theo mô hình bTaskee) — đề tài Công nghệ phần mềm Nâng cao, Nhóm 15.

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: react-router-dom (các trang tải theo nhu cầu – lazy load)
- **HTTP client**: axios (`src/services/api.ts`, tự gắn JWT, tự đăng xuất khi gặp 401)
- **Bản đồ**: Leaflet + OpenStreetMap, ảnh nền và tìm địa chỉ đi qua Backend `/api/geo` (không cần API key)
- **Phông chữ**: Be Vietnam Pro (tự host qua `@fontsource`, không cần Google Fonts)
- **Icon**: lucide-react · **Mã QR**: qrcode-generator
- **Backend**: repo `HomeService-Backend`, nhánh có `contactPhone` và `/api/geo` (`feature/so-dien-thoai-lien-he`)

## Chạy dự án

```bash
npm install
cp .env.example .env     # chỉnh VITE_API_BASE_URL nếu backend chạy ở địa chỉ khác
npm run dev
```

Mặc định chạy ở `http://localhost:5173`, gọi API tại `http://localhost:8080/api`. Website **không còn dữ liệu mẫu**: cần chạy Backend trước.

## Nút tải ứng dụng Mobile

Trang chủ (mục *Tải ứng dụng*) và trang *Trở thành Tasker* có nút tải file APK và mã QR.

1. Build APK từ repo `HomeService-Mobile`:
   ```bash
   flutter build apk --release --dart-define=API_BASE_URL=http://<IP-máy-chạy-Backend>:8080/api
   ```
2. Đổi tên `build/app/outputs/flutter-apk/app-release.apk` thành `HomeService.apk`, chép vào `public/downloads/`.
3. Chưa có file thì website tự hiện “Bản cài đặt đang được cập nhật”.

Mã QR chứa link tuyệt đối tới file APK. Muốn điện thoại quét được khi chạy ở máy cá nhân, mở website bằng IP máy tính (`npm run dev -- --host`, rồi vào `http://192.168.x.x:5173`).

## Trang và User Story

| Đường dẫn | Trang | User Story |
|---|---|---|
| `/` | Trang giới thiệu: ước tính chi phí, bảng giá, quy trình, tải ứng dụng | US10, US11 |
| `/login`, `/register` | Đăng nhập, đăng ký | US01, US02, US03 |
| `/booking/new` | Tạo đơn: bản đồ ghim vị trí (tự điền địa chỉ), tìm địa chỉ, SĐT liên hệ gợi ý từ hồ sơ, thanh toán | US12, US13, US21 |
| `/bookings` | Đơn của tôi: lọc, tìm, hủy (hiện phí hủy), thử lại, xác nhận, khiếu nại, đánh giá | US14, US15, US33 |
| `/bookings/:id` | Chi tiết đơn: tiến độ, theo dõi Tasker trên bản đồ, ảnh trước/sau, đánh giá, khiếu nại, trả nợ | US19, US25, US34–US37 |
| `/notifications` | Thông báo, lọc chưa đọc, đánh dấu đã đọc | US29 |
| `/profile` | Hồ sơ cá nhân (ảnh đại diện, SĐT, địa chỉ mặc định), lịch sử thanh toán | US05, US24 |
| `/tasker-guide` | Hướng dẫn làm Tasker + tải ứng dụng | US04 |

## Phân quyền & chuyển role bằng đăng nhập

| Tài khoản | Đăng nhập ở Web Customer (5173) | Đăng nhập ở Web Admin (5174) |
|---|---|---|
| Khách hàng (0) | Vào Đơn của tôi | Tự chuyển sang Web Customer |
| Admin (2) | Tự chuyển sang Web Admin | Vào Dashboard |
| Tasker (1) | Báo lỗi: dùng app di động | Báo lỗi: dùng app di động |

Phiên được chuyển qua URL hash (`#auth=...`) và bị xóa khỏi thanh địa chỉ ngay khi trang đích đọc xong.

## Cấu trúc thư mục

```
src/
├── pages/        # Landing, Login, Register, Booking, Orders, BookingDetail, Notifications, Profile, TaskerGuide
├── components/   # AppShell, Navbar (+ thanh tab dưới trên điện thoại), MapView, AppDownload, QrCode,
│                 # OrderActions (nút theo trạng thái đơn), OrderDialogs, Modal/Toast, AuthLayout...
├── services/     # api.ts (axios), authService, serviceCatalog, bookingService, userServices, geoService
├── hooks/        # useNow (đồng hồ đếm ngược), useServices, useApkAvailable
├── context/      # AuthContext, NotificationContext (chuông, tự làm mới 30 giây)
├── types/        # Kiểu dữ liệu, enum số – khớp DTO của Backend
├── utils/        # format tiền/giờ/SĐT, validate, trạng thái đơn, cấu hình tải app, chuyển phiên
└── styles/       # global.css (design token dùng chung với Mobile), shell, landing, auth, pages
public/downloads/ # Đặt HomeService.apk ở đây
```

## Build production

```bash
npm run build
```
