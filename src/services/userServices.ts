// US05/US24/US29 - Hồ sơ, thông báo, lịch sử thanh toán
import { api } from "./api";
import type {
  NotificationPage,
  PaymentItem,
  Paged,
  ProfileResponse,
  UpdateProfileRequest,
} from "../types";

export const profileService = {
  get: () => api.get<ProfileResponse>("/profile").then((r) => r.data),
  // PUT phải gửi ĐỦ 4 field (Hướng dẫn 5.7)
  update: (b: UpdateProfileRequest) =>
    api.put<ProfileResponse>("/profile", b).then((r) => r.data),
};

export const notificationService = {
  my: (page = 1, pageSize = 20, unreadOnly = false) =>
    api
      .get<NotificationPage>("/notifications/my", {
        params: { page, pageSize, ...(unreadOnly ? { unreadOnly: true } : {}) },
      })
      .then((r) => r.data),
  read: (id: number) => api.put(`/notifications/${id}/read`),
  readAll: () => api.put("/notifications/read-all"),
};

export const paymentHistoryService = {
  my: (page = 1, pageSize = 20) =>
    api
      .get<Paged<PaymentItem>>("/payments/my", { params: { page, pageSize } })
      .then((r) => r.data),
};
