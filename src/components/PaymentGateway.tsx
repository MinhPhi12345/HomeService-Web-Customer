import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock, QrCode, ShieldCheck, Wallet } from "lucide-react";
import Modal from "./Modal";
import { bookingService, paymentService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { BookingResponse } from "../types";
import { formatDateTime, formatVND } from "../utils/format";
import { orderCode } from "../utils/booking";

type Method = 1 | 2;
type Step = "form" | "processing" | "success";

/** Mã QR giả lập (chỉ để minh họa, không quét được) – sinh ổn định theo mã đơn. */
function FakeQr({ seed, size = 168 }: { seed: number; size?: number }) {
  const cells = useMemo(() => {
    const n = 25;
    let x = (seed * 2654435761) >>> 0;
    const out: [number, number][] = [];
    const finder = (r: number, c: number) =>
      (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        if (finder(r, c)) continue;
        x = (x * 1103515245 + 12345) >>> 0;
        if ((x >>> 16) & 1) out.push([r, c]);
      }
    return { n, out };
  }, [seed]);
  const box = (r: number, c: number) => (
    <g key={`f${r}${c}`}>
      <rect x={c} y={r} width={7} height={7} fill="#15302f" />
      <rect x={c + 1} y={r + 1} width={5} height={5} fill="#fff" />
      <rect x={c + 2} y={r + 2} width={3} height={3} fill="#15302f" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${cells.n + 2} ${cells.n + 2}`} role="img" aria-label="Mã QR mô phỏng">
      <rect x={-1} y={-1} width={cells.n + 2} height={cells.n + 2} fill="#fff" />
      {cells.out.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#15302f" />
      ))}
      {box(0, 0)}
      {box(0, cells.n - 7)}
      {box(cells.n - 7, 0)}
    </svg>
  );
}

interface Props {
  booking: BookingResponse;
  amount: number;
  title: string;
  /** true: khách được chọn ví/thẻ (trả nợ, phí hủy); false: dùng phương thức đã chọn lúc đặt đơn */
  allowChoice?: boolean;
  /** Nội dung hiện ở bước thành công */
  successNote: string;
  onClose: () => void;
  onDone: (msg: string) => void;
}

/**
 * Cổng thanh toán MÔ PHỎNG của đồ án: hiển thị như một cổng thật (QR ví điện tử / form thẻ),
 * bấm "Thanh toán (demo)" thì gọi POST /api/payments – không trừ tiền thật.
 */
export function PaymentGateway({ booking, amount, title, allowChoice = false, successNote, onClose, onDone }: Props) {
  const [method, setMethod] = useState<Method>(booking.paymentMethod === 2 ? 2 : 1);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");
  const [paidAt, setPaidAt] = useState<string>("");
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const pay = async () => {
    setError("");
    setStep("processing");
    const started = Date.now();
    try {
      const res = await paymentService.pay(booking.id, method);
      // giữ màn hình "đang xử lý" tối thiểu 1,2 giây cho giống cổng thật
      await new Promise((r) => setTimeout(r, Math.max(0, 1200 - (Date.now() - started))));
      setPaymentId(res?.id ?? null);
      setPaidAt(new Date().toISOString());
      setStep("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setStep("form");
    }
  };

  const finish = () => onDone("Thanh toán thành công.");
  const close = step === "success" ? finish : step === "processing" ? () => undefined : onClose;

  return (
    <Modal
      title={step === "success" ? "Thanh toán thành công" : title}
      onClose={close}
      footer={
        step === "success" ? (
          <button className="btn btn-primary" onClick={finish}>
            Xong
          </button>
        ) : (
          <>
            <button className="btn btn-outline" onClick={onClose} disabled={step === "processing"}>
              Hủy giao dịch
            </button>
            <button className="btn btn-primary" onClick={pay} disabled={step === "processing"}>
              {step === "processing" ? (
                <>
                  <Loader2 size={16} className="spin" /> Đang xử lý…
                </>
              ) : (
                <>
                  <Lock size={16} /> Thanh toán (demo) {formatVND(amount)}
                </>
              )}
            </button>
          </>
        )
      }
    >
      {step === "success" ? (
        <div className="gw-success">
          <CheckCircle2 size={56} />
          <strong>{formatVND(amount)}</strong>
          <p>{successNote}</p>
          <div className="gw-receipt">
            <div className="kv">
              <span>Đơn hàng</span>
              <b>#{orderCode(booking.id)}</b>
            </div>
            <div className="kv">
              <span>Phương thức</span>
              <b>{method === 1 ? "Ví điện tử" : "Thẻ ngân hàng"}</b>
            </div>
            {paymentId != null && (
              <div className="kv">
                <span>Mã thanh toán</span>
                <b>#{paymentId}</b>
              </div>
            )}
            <div className="kv">
              <span>Thời gian</span>
              <b>{formatDateTime(paidAt)}</b>
            </div>
          </div>
        </div>
      ) : (
        <div className="gw">
          <div className="gw-head">
            <div>
              <span className="gw-merchant">HomeService · Đơn #{orderCode(booking.id)}</span>
              <span className="gw-service">{booking.serviceCategoryName}</span>
            </div>
            <strong>{formatVND(amount)}</strong>
          </div>

          {allowChoice ? (
            <div className="pay-grid pay-grid--2" role="radiogroup" aria-label="Phương thức">
              {(
                [
                  [1, "Ví điện tử", "MoMo, ZaloPay…", Wallet],
                  [2, "Thẻ ngân hàng", "Visa, Mastercard, Napas", CreditCard],
                ] as [Method, string, string, typeof Wallet][]
              ).map(([m, t, sub, Icon]) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  className="pay-opt"
                  onClick={() => setMethod(m)}
                  disabled={step === "processing"}
                >
                  <Icon size={20} />
                  <b>{t}</b>
                  <small>{sub}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="hint gw-fixed">
              Phương thức đã chọn khi đặt đơn: <b>{method === 1 ? "Ví điện tử" : "Thẻ ngân hàng"}</b>
            </p>
          )}

          {method === 1 ? (
            <div className="gw-qr">
              <FakeQr seed={booking.id} />
              <div>
                <b>
                  <QrCode size={16} /> Quét mã bằng ứng dụng ví
                </b>
                <p>Mở MoMo / ZaloPay, quét mã và xác nhận thanh toán {formatVND(amount)}.</p>
                <p className="hint">Bản demo: bấm “Thanh toán (demo)” để giả lập ví đã xác nhận.</p>
              </div>
            </div>
          ) : (
            <div className="gw-card" aria-label="Thông tin thẻ thử nghiệm">
              <label>
                Số thẻ
                <input readOnly value="4111 1111 1111 1111" />
              </label>
              <div className="gw-card-row">
                <label>
                  Hết hạn
                  <input readOnly value="12/28" />
                </label>
                <label>
                  CVV
                  <input readOnly value="•••" />
                </label>
              </div>
              <label>
                Tên in trên thẻ
                <input readOnly value="NGUYEN VAN A" />
              </label>
              <p className="hint">Thẻ thử nghiệm điền sẵn – không trừ tiền thật.</p>
            </div>
          )}

          <p className="gw-secure">
            <ShieldCheck size={16} /> Cổng thanh toán mô phỏng của đồ án · Không trừ tiền thật
          </p>
          {error && (
            <div className="notice notice--danger" role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/**
 * Xác nhận hoàn thành & chuyển tiền cho Tasker (đơn online): tiền khách đã trả trước đang được tạm giữ,
 * khi khách xác nhận thì HomeService chuyển cho Tasker (sau chiết khấu nền tảng).
 */
export function ConfirmReleaseDialog({
  booking,
  onClose,
  onDone,
  onDispute,
}: {
  booking: BookingResponse;
  onClose: () => void;
  onDone: (msg: string) => void;
  onDispute?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [agree, setAgree] = useState(false);
  useEffect(() => setError(""), [agree]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await bookingService.confirm(booking.id);
      onDone(`Đã xác nhận hoàn thành. ${formatVND(booking.totalPrice)} đã được chuyển cho Tasker.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Xác nhận & thanh toán cho Tasker"
      onClose={onClose}
      footer={
        <>
          {onDispute && booking.canDispute && (
            <button className="btn btn-danger-outline" onClick={onDispute} disabled={busy}>
              Khiếu nại
            </button>
          )}
          <button className="btn btn-primary" onClick={confirm} disabled={busy || !agree}>
            {busy ? "Đang xử lý…" : `Xác nhận & chuyển ${formatVND(booking.totalPrice)}`}
          </button>
        </>
      }
    >
      <div className="gw-flow">
        <div>
          <span>Bạn đã thanh toán trước</span>
          <b>{formatVND(booking.totalPrice)}</b>
        </div>
        <div>
          <span>HomeService đang tạm giữ</span>
          <b>{formatVND(booking.totalPrice)}</b>
        </div>
        <div className="gw-flow-to">
          <span>Chuyển cho Tasker {booking.taskerName ?? ""} khi bạn xác nhận</span>
          <b>{formatVND(booking.totalPrice)}</b>
        </div>
      </div>
      {booking.autoConfirmAt && (
        <p className="hint">
          Nếu bạn không xác nhận, hệ thống tự chuyển tiền lúc {formatDateTime(booking.autoConfirmAt)}.
        </p>
      )}
      <label className="check">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>Tôi đã kiểm tra ảnh trước/sau và hài lòng với công việc.</span>
      </label>
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
