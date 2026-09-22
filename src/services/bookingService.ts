import apiClient from "./api";
import type { Booking } from "../types";

// US12/US13 - Tạo đơn đặt dịch vụ
export async function createBooking(payload: {
  serviceCategoryId: number;
  scheduledTime: string;
  address: string;
  note?: string;
}): Promise<Booking> {
  const { data } = await apiClient.post<Booking>("/bookings", payload);
  return data;
}

// US15 - Xem lịch sử đặt dịch vụ
export async function getMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/bookings/my");
  return data;
}

// US14 - Hủy đơn đặt dịch vụ
export async function cancelBooking(id: number): Promise<void> {
  await apiClient.post(`/bookings/${id}/cancel`);
}
