import { BookingStatus, type BookingResponse } from "../types";
import { formatTime } from "./format";

/** Số tiền khách thực trả = giá gốc − mã giảm giá (FR-32) */
export const payable = (b: Pick<BookingResponse, "totalPrice" | "payableAmount">) => b.payableAmount ?? b.totalPrice;

/** Mã đơn hiển thị dạng DH000125 (SRS 7.4) */
export const orderCode = (id: number) => `DH${String(id).padStart(6, "0")}`;

export type Tone = "amber" | "blue" | "green" | "rose" | "gray";

export const STATUS_META: Record<number, { label: string; tone: Tone }> = {
  [BookingStatus.Pending]: { label: "Đang tìm Tasker", tone: "blue" },
  [BookingStatus.Matched]: { label: "Chờ Tasker nhận", tone: "blue" },
  [BookingStatus.Accepted]: { label: "Tasker đã nhận đơn", tone: "blue" },
  [BookingStatus.InProgress]: { label: "Đang thực hiện", tone: "blue" },
  [BookingStatus.Completed]: { label: "Chờ bạn xác nhận", tone: "amber" },
  [BookingStatus.Paid]: { label: "Hoàn tất", tone: "green" },
  [BookingStatus.Cancelled]: { label: "Đã hủy", tone: "rose" },
  [BookingStatus.Rejected]: { label: "Tasker từ chối", tone: "rose" },
  [BookingStatus.NoTaskerFound]: {
    label: "Chưa có Tasker nhận",
    tone: "amber",
  },
  [BookingStatus.Expired]: { label: "Đã hết hạn", tone: "gray" },
  [BookingStatus.AwaitingPayment]: { label: "Chờ thanh toán", tone: "amber" },
  [BookingStatus.Disputed]: { label: "Đang khiếu nại", tone: "amber" },
  [BookingStatus.Refunded]: { label: "Đã hoàn tiền", tone: "gray" },
  [BookingStatus.PaymentOverdue]: { label: "Chưa thanh toán", tone: "rose" },
};

export const FILTERS: {
  key: string;
  label: string;
  statuses: number[] | null;
}[] = [
  { key: "all", label: "Tất cả", statuses: null },
  { key: "finding", label: "Đang tìm Tasker", statuses: [0, 1, 8, 10] },
  { key: "doing", label: "Đang thực hiện", statuses: [2, 3] },
  { key: "confirm", label: "Chờ xác nhận", statuses: [4, 11, 13] },
  { key: "done", label: "Hoàn tất", statuses: [5, 12] },
  { key: "cancelled", label: "Đã hủy", statuses: [6, 7, 9] },
];

const pad = (n: number) => String(n).padStart(2, "0");

/** "Hôm nay 14:00", "Mai 09:00", "10/10" (theo giờ Việt Nam) */
export function friendlyDate(iso: string, withTime = true): string {
  const tz = "Asia/Ho_Chi_Minh";
  const d = new Date(iso);
  const key = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(x);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const time = new Intl.DateTimeFormat("vi-VN", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  if (key(d) === key(today)) return `Hôm nay ${time}`;
  if (key(d) === key(tomorrow)) return `Mai ${time}`;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
  }).format(d);
  return withTime ? `${parts} ${time}` : parts;
}

/** Đếm ngược hh:mm:ss */
export function countdown(targetIso: string, now: number): string {
  const ms = Math.max(0, new Date(targetIso).getTime() - now);
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** BR-M07 – số phút còn phải chờ để bấm "Tìm lại ngay" (0 = bấm được). */
export function searchNowWait(b: BookingResponse, now = Date.now()): number {
  if (!b.searchNowAvailableAt) return 0;
  const ms = new Date(b.searchNowAvailableAt).getTime() - now;
  return ms > 0 ? Math.ceil(ms / 60_000) : 0;
}

export function describe(b: BookingResponse, now: number): string {
  const tasker = b.taskerName ? `Tasker ${b.taskerName}` : "Tasker";
  switch (b.status) {
    case BookingStatus.Pending:
    case BookingStatus.Matched:
      if (b.searchExhaustedAt) {
        if (b.status === BookingStatus.Matched) return "Đang gửi lời mời cho Tasker gần bạn, vui lòng chờ trong giây lát.";
        const next = b.nextSearchAt ? ` Lần tìm tiếp theo lúc ${formatTime(b.nextSearchAt)}.` : "";
        const stop = b.searchStopsAt ? ` Hệ thống dừng tìm lúc ${formatTime(b.searchStopsAt)} nếu vẫn chưa có Tasker.` : "";
        return `Chưa có Tasker nhận đơn, hệ thống vẫn đang tìm tiếp.${next}${stop}`;
      }
      return "Hệ thống đang tìm Tasker phù hợp gần bạn.";
    case BookingStatus.Accepted:
      return b.isTaskerNoShow
        ? "Tasker không đến đúng hẹn. Bạn có thể tìm Tasker khác hoặc hủy đơn (hoàn 100%)."
        : `${tasker} đã nhận đơn.`;
    case BookingStatus.InProgress:
      return `${tasker} đang làm việc.`;
    case BookingStatus.Completed:
      return b.autoConfirmAt
        ? `${tasker} đã hoàn thành. Tự xác nhận sau ${countdown(b.autoConfirmAt, now)}.`
        : `${tasker} đã hoàn thành.`;
    case BookingStatus.Paid:
      return b.paymentMethod === 0
        ? "Đã thanh toán tiền mặt."
        : "Đã thanh toán online.";
    case BookingStatus.Cancelled:
      return "Đơn đã được hủy.";
    case BookingStatus.NoTaskerFound:
      return "Đã gần giờ hẹn mà chưa có Tasker nhận đơn. Bạn có thể thử lại (có thể đổi giờ) hoặc hủy đơn.";
    case BookingStatus.Expired:
      return "Đơn đã hết hạn, hãy tạo đơn mới.";
    case BookingStatus.AwaitingPayment:
      return b.paymentDueAt
        ? `Thanh toán trong ${countdown(b.paymentDueAt, now).slice(3)} để bắt đầu tìm Tasker.`
        : "Vui lòng thanh toán để bắt đầu tìm Tasker.";
    case BookingStatus.Disputed:
      return "Khiếu nại đang được quản trị viên xử lý. Tiền vẫn được tạm giữ.";
    case BookingStatus.Refunded:
      return "Đã hoàn tiền về phương thức thanh toán của bạn.";
    case BookingStatus.PaymentOverdue:
      return "Bạn chưa thanh toán đơn tiền mặt. Vui lòng thanh toán để đặt đơn mới.";
    default:
      return "";
  }
}

export const METHOD_LABEL = ["Tiền mặt", "Ví điện tử", "Thẻ ngân hàng"];
export const PAYMENT_STATUS_LABEL = [
  "Đang xử lý",
  "Đã thu tiền mặt",
  "Thất bại",
  "Đang tạm giữ",
  "Đã giải ngân cho Tasker",
  "Đã hoàn toàn bộ",
  "Đã hoàn một phần",
];
export const DISPUTE_REASONS = [
  "Làm không đạt yêu cầu",
  "Làm chưa xong / thiếu hạng mục",
  "Làm hư hỏng tài sản",
  "Thái độ không phù hợp",
  "Khác",
  "Tasker bị khóa tài khoản khi đang làm",
];
export const DISPUTE_RESOLUTIONS = [
  "Bác khiếu nại – giải ngân đủ",
  "Hoàn tiền một phần",
  "Hoàn toàn bộ",
  "Làm lại miễn phí",
];
