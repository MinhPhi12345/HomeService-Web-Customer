/** 450000 -> "450.000 đ" (SRS 8.5) */
export const formatVND = (n: number) => `${n.toLocaleString("vi-VN")} đ`;

/** Giá hiển thị "150.000 đ / giờ" (SRS FR-08) */
export const formatPrice = (basePrice: number, unit: string) =>
  `${formatVND(basePrice)} / ${unit}`;

/** ISO UTC -> dd/MM/yyyy HH:mm theo giờ Việt Nam */
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(",", "");
