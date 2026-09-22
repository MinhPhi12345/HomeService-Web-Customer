import apiClient from "./api";
import type { ServiceCategory } from "../types";

// US10 - Xem/Tìm kiếm dịch vụ
export async function getServiceCategories(keyword?: string): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<ServiceCategory[]>("/servicecategories", {
    params: keyword ? { keyword } : undefined,
  });
  return data;
}
