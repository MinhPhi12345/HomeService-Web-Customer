import type {
  NotificationItem,
  PaymentItem,
  ProfileResponse,
  ReviewItem,
  UserReviews,
} from "../types";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const mockProfile = (): ProfileResponse => ({
  id: 1,
  fullName: "Nguyễn Văn Minh",
  email: "demo@homeservice.vn",
  phoneNumber: "0901234567",
  address: "12 Nguyễn Huệ, Q.1, TP.HCM",
  avatarUrl: null,
  role: 0,
  outstandingAmount: 80000,
  isCashBlocked: false,
});

export const mockNotifications = (): NotificationItem[] => [
  {
    id: 6,
    title: "Tasker đã hoàn thành công việc",
    message: "Vui lòng kiểm tra ảnh và xác nhận đơn DH000125 trước 24 giờ.",
    isRead: false,
    createdAt: ago(5),
  },
  {
    id: 5,
    title: "Tasker đang trên đường",
    message: "Lê Văn Minh đang đến địa chỉ của bạn cho đơn DH000131.",
    isRead: false,
    createdAt: ago(40),
  },
  {
    id: 4,
    title: "Nhắc lịch hẹn",
    message: "Đơn DH000131 sẽ bắt đầu sau 60 phút.",
    isRead: false,
    createdAt: ago(100),
  },
  {
    id: 3,
    title: "Đơn đã có Tasker nhận",
    message: "Trần Thị Hoa đã nhận đơn DH000125.",
    isRead: true,
    createdAt: ago(60 * 20),
  },
  {
    id: 2,
    title: "Thanh toán thành công",
    message: "Đã tạm giữ 450.000 đ cho đơn DH000125.",
    isRead: true,
    createdAt: ago(60 * 22),
  },
  {
    id: 1,
    title: "Đơn đã được hủy",
    message:
      "Đơn DH000102 đã hủy, 240.000 đ được hoàn về phương thức thanh toán.",
    isRead: true,
    createdAt: ago(60 * 24 * 13),
  },
];

export const mockPayments = (): PaymentItem[] => [
  {
    id: 3,
    bookingId: 125,
    serviceCategoryName: "Dọn dẹp nhà",
    amount: 450000,
    commissionAmount: 0,
    method: 1,
    status: 3,
    paidAt: ago(60 * 22),
    createdAt: ago(60 * 22),
    taskerAmount: 0,
    refundedAmount: 0,
    releasedAt: null,
  },
  {
    id: 2,
    bookingId: 118,
    serviceCategoryName: "Vệ sinh máy lạnh",
    amount: 300000,
    commissionAmount: 60000,
    method: 0,
    status: 1,
    paidAt: ago(60 * 24 * 11),
    createdAt: ago(60 * 24 * 11),
    taskerAmount: 240000,
    refundedAmount: 0,
    releasedAt: null,
  },
  {
    id: 1,
    bookingId: 102,
    serviceCategoryName: "Nấu ăn gia đình",
    amount: 240000,
    commissionAmount: 0,
    method: 2,
    status: 5,
    paidAt: ago(60 * 24 * 14),
    createdAt: ago(60 * 24 * 14),
    taskerAmount: 0,
    refundedAmount: 240000,
    releasedAt: null,
  },
];

const rv = (
  id: number,
  name: string,
  rating: number,
  comment: string,
  reviewerId = 1,
): ReviewItem => ({
  id,
  bookingId: 118,
  reviewerId,
  reviewerName: name,
  revieweeId: 9,
  rating,
  comment,
  isFlagged: false,
  createdAt: ago(60 * 24 * id),
});
export const mockUserReviews = (): UserReviews => ({
  reviewCount: 48,
  ratingAverage: 4.9,
  reviews: [
    rv(3, "Lê Hoàng", 5, "Làm sạch sẽ, đúng giờ."),
    rv(4, "Phạm Thu", 5, "Rất chuyên nghiệp, sẽ đặt lại."),
    rv(5, "Đặng Nam", 4, "Ổn, hơi chậm 10 phút."),
  ],
});
export const mockBookingReviews = (taskerId: number): ReviewItem[] => [
  {
    id: 90,
    bookingId: 118,
    reviewerId: taskerId,
    reviewerName: "Phạm Văn Nam",
    revieweeId: 1,
    rating: 2,
    comment: "Khách không có mặt đúng hẹn.",
    isFlagged: false,
    createdAt: ago(60 * 24 * 10),
  },
];
