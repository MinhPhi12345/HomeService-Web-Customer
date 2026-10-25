import type { ServiceCategory } from "../types";

// Dữ liệu dự phòng đúng như Figma – dùng khi Backend chưa chạy / chưa có dữ liệu
export const FALLBACK_SERVICES: ServiceCategory[] = [
  [1, "Dọn dẹp nhà", 150000, "giờ"],
  [2, "Tổng vệ sinh", 500000, "lần"],
  [3, "Giặt ủi", 80000, "lần"],
  [4, "Nấu ăn gia đình", 120000, "buổi"],
  [5, "Vệ sinh máy lạnh", 200000, "máy"],
  [6, "Đi chợ", 60000, "lần"],
  [7, "Trông trẻ", 90000, "giờ"],
  [8, "Khử khuẩn", 250000, "lần"],
].map(([id, name, basePrice, unit]) => ({
  id: id as number,
  name: name as string,
  description: null,
  basePrice: basePrice as number,
  unit: unit as string,
  iconUrl: null,
  isActive: true,
}));
