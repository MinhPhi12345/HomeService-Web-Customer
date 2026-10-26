// Khai báo theo đúng SRS mục 7.8 và 9 – KHÔNG đổi thứ tự giá trị enum.
export const UserRole = { Customer: 0, Tasker: 1, Admin: 2 } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BookingStatus = {
  Pending: 0,
  Matched: 1,
  Accepted: 2,
  InProgress: 3,
  Completed: 4,
  Paid: 5,
  Cancelled: 6,
  Rejected: 7,
  NoTaskerFound: 8,
  Expired: 9,
  AwaitingPayment: 10,
  Disputed: 11,
  Refunded: 12,
  PaymentOverdue: 13,
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentMethod = { Cash: 0, EWallet: 1, Card: 2 } as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  role: 0 | 1;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  accessToken: string;
  expiresAt: string;
}
export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  basePrice: number;
  unit: string;
  iconUrl: string | null;
  isActive: boolean;
}

export interface CreateBookingRequest {
  serviceCategoryId: number;
  scheduledTime: string; // ISO UTC
  address: string;
  latitude: number;
  longitude: number;
  note?: string | null;
  quantity?: number;
  paymentMethod?: PaymentMethod;
  customerPresent?: boolean;
  /** SĐT để Tasker liên hệ (^0\d{9}$). Bỏ trống: Backend dùng SĐT trong hồ sơ */
  contactPhone?: string | null;
}

export interface BookingResponse {
  id: number;
  serviceCategoryName: string;
  customerId: number;
  customerName: string;
  taskerId: number | null;
  taskerName: string | null;
  scheduledTime: string;
  address: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  commissionRate: number;
  paymentMethod: PaymentMethod;
  customerPresent: boolean;
  paymentStatus: number | null;
  paymentDueAt: string | null;
  completedAt: string | null;
  autoConfirmAt: string | null;
  checkInPhotoUrl: string | null;
  checkOutPhotoUrl: string | null;
  isTaskerNoShow: boolean;
  canDispute: boolean;
  // Field bổ sung theo Hướng dẫn FE (mục 5.5, 8) – FE xử lý khi vắng mặt
  serviceCategoryId?: number;
  quantity?: number;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  taskerPhone?: string | null; // chỉ có khi đơn ở trạng thái 2 hoặc 3
  cancellationFee?: number;
  canReview?: boolean;
  disputeId?: number | null;
  customerPhone?: string | null;
  /** SĐT liên hệ khách nhập khi đặt đơn */
  contactPhone?: string | null;
  updatedAt?: string | null;
}

export interface CancellationFeeResponse {
  cancellationFee: number;
  refundAmount: number;
  reason: string;
}
export interface PaymentResponse {
  id: number;
  bookingId: number;
  amount: number;
  status: number;
}
export interface CreateDisputeRequest {
  reason: number;
  description: string;
  evidenceUrls: string[];
}
export interface CreateReviewRequest {
  bookingId: number;
  revieweeId: number;
  rating: number;
  comment?: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}
export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
export interface NotificationPage extends Paged<NotificationItem> {
  unreadCount: number;
}
export interface ProfileResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  avatarUrl: string | null;
  role: UserRole;
  outstandingAmount?: number;
  isCashBlocked?: boolean;
  createdAt?: string;
}
export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string | null;
  address: string | null;
  avatarUrl: string | null;
}
export interface PaymentItem {
  id: number;
  bookingId: number;
  serviceCategoryName: string;
  amount: number;
  commissionAmount: number;
  method: PaymentMethod;
  status: number;
  paidAt: string | null;
  createdAt: string;
  taskerAmount: number;
  refundedAmount: number;
  releasedAt: string | null;
}
export interface ReviewItem {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewerName: string;
  revieweeId: number;
  rating: number;
  comment: string | null;
  isFlagged: boolean;
  createdAt: string;
  revieweeName?: string;
}
export interface UserReviews {
  userId?: number;
  reviewCount: number;
  ratingAverage: number | null;
  reviews: ReviewItem[];
}
export interface LocationResponse {
  latitude: number;
  longitude: number;
  updatedAt: string;
  distanceKm?: number;
}
export interface DisputeDetail {
  id: number;
  bookingId: number;
  amount: number;
  reason: number;
  description: string;
  evidenceUrls: string[];
  taskerResponse: string | null;
  taskerEvidenceUrls: string[];
  status: number; // 0 Open, 1 Resolved
  resolution: number | null;
  refundAmount: number | null;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}
