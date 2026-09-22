# HomeService – Website Khách hàng

Website dành cho khách hàng của hệ thống **HomeService** (đặt dịch vụ tại nhà, theo mô hình bTaskee) — đề tài Công nghệ phần mềm Nâng cao, Nhóm 01.

- **Framework**: React 19 + TypeScript + Vite
- **Routing**: react-router-dom
- **HTTP client**: axios (`src/services/api.ts`, tự đính kèm JWT từ localStorage)
- **Backend**: gọi API từ repo `HomeService-Backend`

## Cấu trúc thư mục

```
src/
├── pages/          # HomePage, LoginPage, RegisterPage, BookingCreatePage, BookingHistoryPage
├── components/      # NavBar, ...
├── services/         # api.ts (axios instance), authService, serviceCatalogService, bookingService
├── context/           # AuthContext (lưu user + accessToken)
├── types/              # Kiểu dữ liệu dùng chung, khớp với DTO của backend
├── App.tsx             # Khai báo route
└── main.tsx
```

Mỗi trang/service đều có comment gắn User Story tương ứng (vd: `// US12/US13`) để đối chiếu với file Backlog và board Jira.

## Chạy dự án

```bash
npm install
cp .env.example .env     # chỉnh VITE_API_BASE_URL nếu backend chạy ở địa chỉ khác
npm run dev
```

Mặc định chạy ở `http://localhost:5173` và gọi API tại `http://localhost:8080/api` (theo cấu hình CORS mặc định của `HomeService-Backend`).

## Các trang đã scaffold (điểm bắt đầu cho từng User Story)

| Trang | User Story |
|---|---|
| HomePage | US10 – Xem/Tìm kiếm dịch vụ |
| RegisterPage | US01 – Đăng ký tài khoản |
| LoginPage | US02 – Đăng nhập |
| BookingCreatePage | US12/US13 – Tạo đơn đặt dịch vụ |
| BookingHistoryPage | US14/US15 – Hủy đơn, xem lịch sử |

Các User Story còn lại (thanh toán US21, theo dõi vị trí US19, đánh giá US25...) sẽ được các thành viên bổ sung theo Sprint đã lên kế hoạch trong file Backlog.

## Build production

```bash
npm run build
```
