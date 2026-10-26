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

/** "Nguyễn Văn Minh" -> "M" (chữ cái đầu của tên) */
export const initials = (name?: string | null) =>
  (name ?? "?").trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? "?";

/** 0901234567 -> "0901 234 567" */
export const formatPhone = (p?: string | null) =>
  p && /^\d{10}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : (p ?? "");

/** Thời gian tương đối: "Vừa xong", "5 phút trước", "2 giờ trước", ngày */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} ngày trước`;
  return formatDate(iso);
}

const vnParts = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false, ...opts }).format(new Date(iso));

/** ISO -> dd/MM/yyyy (giờ Việt Nam) */
export const formatDate = (iso: string) => vnParts(iso, { day: "2-digit", month: "2-digit", year: "numeric" });

/** ISO -> HH:mm (giờ Việt Nam) */
export const formatTime = (iso: string) => vnParts(iso, { hour: "2-digit", minute: "2-digit" });
