import { VoucherDiscountType, type MyVoucher } from "../types";
import { formatDate, formatVND } from "./format";

/** "Giảm 20%, tối đa 50.000 đ" | "Giảm 30.000 đ" */
export const discountLabel = (v: Pick<MyVoucher, "discountType" | "discountValue" | "maxDiscount">) =>
  v.discountType === VoucherDiscountType.Percent
    ? `Giảm ${v.discountValue}%${v.maxDiscount ? `, tối đa ${formatVND(v.maxDiscount)}` : ""}`
    : `Giảm ${formatVND(v.discountValue)}`;

export const conditionLabel = (v: MyVoucher) =>
  [
    v.minOrderValue > 0 ? `Đơn từ ${formatVND(v.minOrderValue)}` : "Mọi giá trị đơn",
    v.serviceNames.length > 0 ? v.serviceNames.join(", ") : "Mọi dịch vụ",
    `HSD ${formatDate(v.endsAt)}`,
  ].join(" · ");

export const SOURCE_LABEL: Record<number, string> = {
  0: "Khuyến mãi",
  1: "Quà chào mừng",
  2: "Quà khách thân thiết",
  3: "Quà xin lỗi",
};

/** Tiền giảm ước tính (giống Backend) để gợi ý mã tốt nhất trong danh sách. */
export function estimateDiscount(v: MyVoucher, order: number, minPayable = 10_000): number {
  if (order < v.minOrderValue) return 0;
  let d = v.discountType === VoucherDiscountType.Percent ? Math.round((order * v.discountValue) / 100) : v.discountValue;
  if (v.discountType === VoucherDiscountType.Percent && v.maxDiscount) d = Math.min(d, v.maxDiscount);
  return Math.max(0, Math.min(d, order - minPayable));
}
