import type { ServiceCategory } from "../types";

/** SRS v1.8 – giới hạn số lượng mỗi đơn theo cấu hình dịch vụ (dữ liệu cũ thiếu field → 1..12). */
export function qtyRange(s?: ServiceCategory | null): { min: number; max: number; fixed: boolean } {
  const min = Math.max(1, s?.minQuantity ?? 1);
  const max = Math.max(min, s?.maxQuantity ?? 12);
  return { min, max, fixed: min === max };
}

export const clampQty = (q: number, s?: ServiceCategory | null) => {
  const { min, max } = qtyRange(s);
  return Math.min(max, Math.max(min, Math.round(q) || min));
};

/** Thời lượng ước tính của đơn (phút) = phút / đơn vị × số lượng. */
export const estimateMinutes = (s: ServiceCategory | null | undefined, qty: number) =>
  (s?.minutesPerUnit ?? 60) * qty;

/** 150 → "2 giờ 30 phút", 90 → "1 giờ 30 phút", 45 → "45 phút" */
export function durationText(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} giờ${m ? ` ${m} phút` : ""}` : `${m} phút`;
}

/** Tách nội dung nhiều dòng (Admin nhập, mỗi dòng một ý) thành danh sách. */
export const lines = (text?: string | null) =>
  (text ?? "")
    .split(/\r?\n/)
    .map((x) => x.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);

/** Nhãn ô số lượng: ưu tiên nhãn Admin đặt, mặc định "Số {đơn vị}". */
export const quantityLabel = (s?: ServiceCategory | null) => s?.quantityLabel?.trim() || `Số ${s?.unit ?? "giờ"}`;

/** Có nội dung chi tiết để hiện nút ⓘ hay không */
export const hasDetail = (s: ServiceCategory) =>
  !!(s.description || s.includes || s.excludes || s.customerPrepares || s.notes);
