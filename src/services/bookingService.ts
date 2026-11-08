// US12-US15, US18-US19, US21, US25, US33-US37 - Đơn, thanh toán, đánh giá, khiếu nại
import { api } from "./api";
import type {
  BookingResponse,
  CancellationFeeResponse,
  CreateBookingRequest,
  CreateDisputeRequest,
  CreateReviewRequest,
  DisputeDetail,
  LocationResponse,
  PaymentMethod,
  PaymentResponse,
  PublicProfile,
  ReviewItem,
  UserReviews,
  MyVoucher,
  VoucherCheckResponse,
} from "../types";

export interface MyBookingsQuery {
  status?: number[];
  keyword?: string;
  upcoming?: boolean;
}

export const bookingService = {
  create: (b: CreateBookingRequest) =>
    api.post<BookingResponse>("/bookings", b).then((r) => r.data),
  // Lọc phía server theo Hướng dẫn 5.4: ?status=0,1,2,3 · ?upcoming=true · ?keyword=
  my: (q: MyBookingsQuery = {}) =>
    api
      .get<BookingResponse[]>("/bookings/my", {
        params: {
          ...(q.status?.length ? { status: q.status.join(",") } : {}),
          ...(q.keyword ? { keyword: q.keyword } : {}),
          ...(q.upcoming ? { upcoming: true } : {}),
        },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<BookingResponse>(`/bookings/${id}`).then((r) => r.data),
  location: (id: number) =>
    api.get<LocationResponse>(`/bookings/${id}/location`).then((r) => r.data),
  cancellationFee: (id: number) =>
    api
      .get<CancellationFeeResponse>(`/bookings/${id}/cancellation-fee`)
      .then((r) => r.data),
  cancel: (id: number) => api.post(`/bookings/${id}/cancel`),
  searchNow: (id: number) => api.post(`/bookings/${id}/search-now`),
  retry: (id: number, scheduledTime?: string) =>
    api.post(`/bookings/${id}/retry`, scheduledTime ? { scheduledTime } : {}),
  confirm: (id: number) => api.post(`/bookings/${id}/confirm`),
  dispute: (id: number, b: CreateDisputeRequest) =>
    api.post(`/bookings/${id}/dispute`, b),
};

export const disputeService = {
  get: (id: number) =>
    api.get<DisputeDetail>(`/disputes/${id}`).then((r) => r.data),
};

export const paymentService = {
  pay: (bookingId: number, method: Exclude<PaymentMethod, 0>) =>
    api
      .post<PaymentResponse>("/payments", { bookingId, method })
      .then((r) => r.data),
};

export const reviewService = {
  create: (b: CreateReviewRequest) => api.post("/reviews", b),
  forBooking: (bookingId: number) =>
    api.get<ReviewItem[]>(`/reviews/booking/${bookingId}`).then((r) => r.data),
  forUser: (userId: number) =>
    api.get<UserReviews>(`/reviews/user/${userId}`).then((r) => r.data),
  /** US27 – báo cáo đánh giá sai sự thật, bắt buộc nêu lý do (10–500 ký tự) */
  report: (reviewId: number, reason: string) =>
    api.post(`/reviews/${reviewId}/report`, { reason }),
};

/** US26 – hồ sơ của Tasker / khách trong đơn kèm các đánh giá đã nhận */
export const profileService = {
  get: (userId: number) =>
    api.get<PublicProfile>(`/public-profiles/${userId}`).then((r) => r.data),
};

export const uploadService = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<{ url: string }>("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.url);
  },
};

// FR-32, FR-33 – mã giảm giá & "Ưu đãi của tôi"
export const voucherService = {
  check: (body: { code: string; serviceCategoryId: number; quantity: number; paymentMethod: PaymentMethod }) =>
    api.post<VoucherCheckResponse>("/vouchers/check", body).then((r) => r.data),
  mine: () => api.get<MyVoucher[]>("/vouchers/my").then((r) => r.data),
};
