// US10 - GET /api/servicecategories
import { api } from "./api";
import type { ServiceCategory } from "../types";

export const serviceCatalog = {
  list: (keyword?: string) =>
    api
      .get<ServiceCategory[]>("/servicecategories", {
        params: keyword ? { keyword } : undefined,
      })
      .then((r) => r.data),
};

// Danh sách dịch vụ dùng chung (cache trong phiên) – để Đơn hàng / Chi tiết đơn lấy ảnh dịch vụ theo id
let cached: Promise<ServiceCategory[]> | null = null;
export function listServicesCached(): Promise<ServiceCategory[]> {
  if (!cached) {
    cached = serviceCatalog.list().catch((e) => {
      cached = null;
      throw e;
    });
  }
  return cached;
}
