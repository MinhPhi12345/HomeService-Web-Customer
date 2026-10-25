import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import {
  CancelDialog,
  DisputeDialog,
  PayDialog,
  RetryDialog,
  ReviewDialog,
} from "./OrderDialogs";
import { bookingService, paymentService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import { BookingStatus, PaymentMethod, type BookingResponse } from "../types";

type Dlg =
  | "cancel"
  | "review"
  | "dispute"
  | "claimPaid"
  | "retry"
  | "payDebt"
  | "payFee"
  | null;

interface Props {
  booking: BookingResponse;
  /** Id dịch vụ theo tên – dùng cho nút "Đặt lại" khi BE chưa trả serviceCategoryId */
  serviceIds: Record<string, number>;
  onChanged: (message: string) => void;
  /** Ẩn nút "Theo dõi" khi đang ở trang chi tiết */
  inDetail?: boolean;
}

/** Các nút theo trạng thái đơn – đúng bảng mục 8 của Hướng dẫn FE */
export default function OrderActions({
  booking: b,
  serviceIds,
  onChanged,
  inDetail,
}: Props) {
  const navigate = useNavigate();
  const [dlg, setDlg] = useState<Dlg>(null);
  const [busy, setBusy] = useState(false);
  const S = BookingStatus;

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      onChanged(okMsg);
    } catch (e) {
      onChanged(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const done = (m: string) => {
    setDlg(null);
    onChanged(m);
  };

  const rebook = () => {
    const id = b.serviceCategoryId ?? serviceIds[b.serviceCategoryName];
    const q = new URLSearchParams();
    if (id) q.set("serviceId", String(id));
    q.set("address", b.address);
    if (b.latitude != null && b.longitude != null) {
      q.set("lat", String(b.latitude));
      q.set("lng", String(b.longitude));
    }
    if (b.quantity) q.set("quantity", String(b.quantity));
    if (b.note) q.set("note", b.note);
    navigate(`/booking/new?${q.toString()}`);
  };

  const cb = (
    key: string,
    label: string,
    cls: string,
    onClick: () => void,
    disabled = false,
  ) => (
    <button
      key={key}
      type="button"
      className={`btn btn-sm ${cls}`}
      disabled={disabled || busy}
      onClick={onClick}
    >
      {label}
    </button>
  );
  const track = !inDetail && (
    <Link
      key="track"
      to={`/bookings/${b.id}`}
      className="btn btn-outline btn-sm"
    >
      Theo dõi Tasker
    </Link>
  );
  const call = b.taskerPhone && (
    <a
      key="call"
      href={`tel:${b.taskerPhone}`}
      className="btn btn-outline btn-sm"
    >
      <Phone size={14} />
      &nbsp;Gọi Tasker
    </a>
  );
  const cancel = (label = "Hủy đơn") =>
    cb("cancel", label, "btn-outline btn-outline--danger", () =>
      setDlg("cancel"),
    );
  const rebookBtn = cb("rebook", "Đặt lại", "btn-outline", rebook);
  const dispute = (label = "Khiếu nại") =>
    b.canDispute &&
    cb("dispute", label, "btn-outline btn-outline--danger", () =>
      setDlg("dispute"),
    );
  const hasFeeDue =
    b.status === S.Cancelled &&
    b.paymentMethod === PaymentMethod.Cash &&
    (b.cancellationFee ?? 0) > 0 &&
    b.paymentStatus == null;

  const buttons = (() => {
    switch (b.status) {
      case S.AwaitingPayment:
        return [
          b.paymentMethod !== 0 &&
            cb("pay", "Thanh toán", "btn-primary", () =>
              run(
                () => paymentService.pay(b.id, b.paymentMethod as 1 | 2),
                "Thanh toán thành công.",
              ),
            ),
          cancel(),
        ];
      case S.Pending:
      case S.Matched:
        return [cancel()];
      case S.Accepted:
        return b.isTaskerNoShow
          ? [
              cb("other", "Tìm Tasker khác", "btn-primary", () =>
                run(
                  () => bookingService.retry(b.id),
                  "Đang tìm Tasker khác cho bạn.",
                ),
              ),
              cancel("Hủy & hoàn tiền"),
            ]
          : [track, call, cancel()];
      case S.InProgress:
        return [track, call];
      case S.Completed:
        return [
          cb("ok", "Xác nhận hoàn thành", "btn-primary", () =>
            run(
              () => bookingService.confirm(b.id),
              "Đã xác nhận hoàn thành. Tiền được chuyển cho Tasker.",
            ),
          ),
          dispute(),
        ];
      case S.Paid:
        return [
          b.canReview &&
            cb("review", "Đánh giá", "btn-primary", () => setDlg("review")),
          dispute(),
          rebookBtn,
        ];
      case S.NoTaskerFound:
        return [
          cb("retry", "Thử lại", "btn-primary", () => setDlg("retry")),
          cancel(),
        ];
      case S.Disputed:
        return [
          b.disputeId && !inDetail && (
            <Link
              key="dr"
              to={`/bookings/${b.id}#khieu-nai`}
              className="btn btn-outline btn-sm"
            >
              Xem kết quả khiếu nại
            </Link>
          ),
        ];
      case S.PaymentOverdue:
        return [
          cb("debt", "Trả nợ", "btn-primary", () => setDlg("payDebt")),
          b.canDispute &&
            cb(
              "paid",
              "Khiếu nại “tôi đã trả”",
              "btn-outline btn-outline--danger",
              () => setDlg("claimPaid"),
            ),
        ];
      case S.Cancelled:
        return [
          hasFeeDue &&
            cb("fee", "Trả phí hủy", "btn-primary", () => setDlg("payFee")),
          rebookBtn,
        ];
      case S.Expired:
      case S.Refunded:
      case S.Rejected:
        return [rebookBtn];
      default:
        return [];
    }
  })().filter(Boolean);

  return (
    <>
      {buttons}
      {dlg === "cancel" && (
        <CancelDialog booking={b} onClose={() => setDlg(null)} onDone={done} />
      )}
      {dlg === "review" && (
        <ReviewDialog booking={b} onClose={() => setDlg(null)} onDone={done} />
      )}
      {dlg === "dispute" && (
        <DisputeDialog booking={b} onClose={() => setDlg(null)} onDone={done} />
      )}
      {dlg === "claimPaid" && (
        <DisputeDialog
          booking={b}
          claimPaid
          onClose={() => setDlg(null)}
          onDone={done}
        />
      )}
      {dlg === "retry" && (
        <RetryDialog booking={b} onClose={() => setDlg(null)} onDone={done} />
      )}
      {dlg === "payDebt" && (
        <PayDialog
          booking={b}
          amount={b.totalPrice}
          title="Trả khoản nợ"
          onClose={() => setDlg(null)}
          onDone={done}
        />
      )}
      {dlg === "payFee" && (
        <PayDialog
          booking={b}
          amount={b.cancellationFee ?? 0}
          title="Trả phí hủy"
          onClose={() => setDlg(null)}
          onDone={done}
        />
      )}
    </>
  );
}
