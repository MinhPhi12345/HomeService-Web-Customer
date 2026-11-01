import { Banknote, CheckCircle2, Clock, Lock, RotateCcw, ShieldAlert, Wallet } from "lucide-react";
import type { BookingResponse } from "../types";
import { formatDateTime, formatTime, formatVND } from "../utils/format";
import { countdown } from "../utils/booking";

type Tone = "warn" | "teal" | "success" | "danger" | "info";

/** Tóm tắt dòng tiền của đơn cho khách: đã trả gì, đang ở đâu, bao giờ chuyển cho Tasker. */
export default function PaymentStatusPanel({ booking: b, now }: { booking: BookingResponse; now: number }) {
  const cash = b.paymentMethod === 0;
  const methodName = cash ? "Tiền mặt" : b.paymentMethod === 2 ? "Thẻ ngân hàng" : "Ví điện tử";
  const total = formatVND(b.totalPrice);
  let tone: Tone = "info";
  let Icon = Wallet;
  let title = "";
  let text = "";
  let timer: { label: string; at: string } | null = null;

  switch (b.status) {
    case 10:
      tone = "warn"; Icon = Clock;
      title = `Chưa thanh toán · ${total}`;
      if (b.paymentDueAt) timer = { label: "Còn", at: b.paymentDueAt };
      text = b.paymentDueAt
        ? `Thanh toán qua ${methodName.toLowerCase()} trước ${formatTime(b.paymentDueAt)} để hệ thống bắt đầu tìm Tasker. Quá hạn đơn sẽ tự hủy. Bấm “Thanh toán ngay”.`
        : `Thanh toán qua ${methodName.toLowerCase()} để hệ thống bắt đầu tìm Tasker.`;
      break;
    case 0: case 1: case 2: case 3: case 8:
      if (cash) {
        tone = "info"; Icon = Banknote;
        title = `Trả tiền mặt cho Tasker · ${total}`;
        text = "Chuẩn bị sẵn tiền mặt và trả trực tiếp cho Tasker khi công việc hoàn thành. Tasker sẽ xác nhận đã nhận tiền trên ứng dụng.";
      } else {
        tone = "teal"; Icon = Lock;
        title = `Đã thanh toán trước · ${total}`;
        text = `Bạn đã trả qua ${methodName.toLowerCase()}. HomeService đang tạm giữ, chỉ chuyển cho Tasker khi bạn xác nhận hoàn thành.`;
      }
      break;
    case 4:
      tone = "warn"; Icon = CheckCircle2;
      title = `Tasker đã xong việc · chờ bạn xác nhận thanh toán ${total}`;
      if (b.autoConfirmAt) timer = { label: "Tự chuyển sau", at: b.autoConfirmAt };
      text = `Kiểm tra ảnh trước/sau rồi bấm “Xác nhận & thanh toán cho Tasker” để chuyển ${total} đang tạm giữ.` +
        (b.autoConfirmAt ? ` Hệ thống tự chuyển lúc ${formatDateTime(b.autoConfirmAt)} nếu bạn không phản hồi.` : "");
      break;
    case 5:
      tone = "success"; Icon = CheckCircle2;
      title = "Đã thanh toán xong";
      text = cash ? `Bạn đã trả ${total} tiền mặt cho Tasker.` : `${total} đã được chuyển cho Tasker. Cảm ơn bạn!`;
      break;
    case 11:
      tone = "warn"; Icon = ShieldAlert;
      title = "Tiền đang được giữ để xử lý khiếu nại";
      text = cash ? "Quản trị viên đang xem xét khiếu nại của bạn." : `${total} vẫn được HomeService tạm giữ cho đến khi có kết quả khiếu nại.`;
      break;
    case 13:
      tone = "danger"; Icon = Banknote;
      title = `Cần thanh toán · ${total}`;
      text = "Tasker báo bạn chưa trả tiền mặt. Hãy bấm “Trả nợ” để thanh toán online, hoặc khiếu nại nếu bạn đã trả.";
      break;
    case 6: case 9: case 12: case 7:
      if ((b.cancellationFee ?? 0) > 0 && cash && b.paymentStatus == null) {
        tone = "danger"; Icon = Banknote;
        title = `Cần trả phí hủy · ${formatVND(b.cancellationFee!)}`;
        text = "Bấm “Trả phí hủy” để thanh toán bằng ví hoặc thẻ.";
      } else if (b.paymentStatus === 5 || b.paymentStatus === 6) {
        tone = "info"; Icon = RotateCcw;
        title = b.paymentStatus === 5 ? "Đã hoàn tiền toàn bộ" : "Đã hoàn tiền một phần";
        text = "Tiền được hoàn về phương thức bạn đã thanh toán.";
      } else return null;
      break;
    default:
      return null;
  }

  return (
    <section className={`panel pay-status pay-status--${tone}`} aria-label="Thanh toán">
      <span className="pay-status-icon">
        <Icon size={22} />
      </span>
      <div className="pay-status-body">
        <b>{title}</b>
        <p>{text}</p>
      </div>
      {timer && (
        <div className="pay-status-timer">
          <span>{timer.label}</span>
          <b className="mono-num">{countdown(timer.at, now)}</b>
        </div>
      )}
    </section>
  );
}
