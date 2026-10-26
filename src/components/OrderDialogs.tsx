import { useEffect, useState } from "react";
import Modal from "./Modal";
import { Star } from "lucide-react";
import {
  bookingService,
  paymentService,
  reviewService,
  uploadService,
} from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import type { BookingResponse, CancellationFeeResponse } from "../types";
import { formatVND } from "../utils/format";
import { orderCode } from "../utils/booking";

interface DialogProps {
  booking: BookingResponse;
  onClose: () => void;
  onDone: (msg: string) => void;
}

export function CancelDialog({ booking, onClose, onDone }: DialogProps) {
  const [fee, setFee] = useState<CancellationFeeResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    bookingService
      .cancellationFee(booking.id)
      .then(setFee)
      .catch((e) => setError(getErrorMessage(e)));
  }, [booking.id]);

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await bookingService.cancel(booking.id);
      onDone(`Đã hủy đơn #${orderCode(booking.id)}.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Hủy đơn #${orderCode(booking.id)}?`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Giữ đơn
          </button>
          <button
            className="btn btn-danger"
            onClick={confirm}
            disabled={busy || !fee}
          >
            {busy ? "Đang hủy…" : "Xác nhận hủy"}
          </button>
        </>
      }
    >
      {!fee && !error && <p>Đang tính phí hủy…</p>}
      {fee && (
        <>
          <div className="notice notice--warn">{fee.reason}</div>
          <div className="kv">
            <span>Phí hủy</span>
            <b>{formatVND(fee.cancellationFee)}</b>
          </div>
          <div className="kv">
            <span>Số tiền được hoàn</span>
            <b>{formatVND(fee.refundAmount)}</b>
          </div>
        </>
      )}
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}

export function ReviewDialog({ booking, onClose, onDone }: DialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!booking.taskerId)
      return setError("Đơn này chưa có Tasker để đánh giá.");
    if (comment.length > 500) return setError("Nhận xét tối đa 500 ký tự.");
    setBusy(true);
    setError("");
    try {
      await reviewService.create({
        bookingId: booking.id,
        revieweeId: booking.taskerId,
        rating,
        comment: comment.trim() || null,
      });
      onDone("Cảm ơn bạn đã đánh giá Tasker!");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Đánh giá Tasker ${booking.taskerName ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Để sau
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Đang gửi…" : "Gửi đánh giá"}
          </button>
        </>
      }
    >
      <div className="stars-pick" role="radiogroup" aria-label="Số sao">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} sao`}
            onClick={() => setRating(n)}
          >
            <Star
              size={32}
              fill={n <= rating ? "#ffb938" : "none"}
              color={n <= rating ? "#ffb938" : "#8ca0a8"}
            />
          </button>
        ))}
      </div>
      <div className="field">
        <label htmlFor="rv">Nhận xét (không bắt buộc)</label>
        <textarea
          id="rv"
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}

const REASONS = [
  "Làm không đạt yêu cầu",
  "Làm chưa xong / thiếu hạng mục",
  "Làm hư hỏng tài sản",
  "Thái độ không phù hợp",
  "Khác",
];

export function DisputeDialog({
  booking,
  onClose,
  onDone,
  claimPaid,
}: DialogProps & { claimPaid?: boolean }) {
  const [reason, setReason] = useState(claimPaid ? 4 : 0);
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    if (
      arr.some(
        (f) =>
          !["image/jpeg", "image/png"].includes(f.type) ||
          f.size > 5 * 1024 * 1024,
      )
    )
      return setError("Chỉ nhận ảnh JPG/PNG, mỗi ảnh tối đa 5 MB.");
    setError("");
    setFiles(arr.slice(0, 5));
  };

  const submit = async () => {
    if (desc.trim().length < 10 || desc.length > 1000)
      return setError("Vui lòng mô tả vấn đề (ít nhất 10 ký tự).");
    if (files.length < 1) return setError("Vui lòng đính kèm từ 1 đến 5 ảnh.");
    setBusy(true);
    setError("");
    try {
      const urls = await Promise.all(files.map(uploadService.upload));
      await bookingService.dispute(booking.id, {
        reason,
        description: desc.trim(),
        evidenceUrls: urls,
      });
      onDone(
        "Đã gửi khiếu nại. Quản trị viên sẽ xử lý và tiền vẫn được tạm giữ.",
      );
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={
        claimPaid
          ? `Tôi đã thanh toán đơn #${orderCode(booking.id)}`
          : `Khiếu nại đơn #${orderCode(booking.id)}`
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-danger" onClick={submit} disabled={busy}>
            {busy ? "Đang gửi…" : "Gửi khiếu nại"}
          </button>
        </>
      }
    >
      {claimPaid && (
        <div className="notice">
          Hãy mô tả bạn đã trả tiền mặt cho Tasker khi nào và đính kèm ảnh bằng
          chứng. Quản trị viên sẽ xác minh và có thể hủy khoản nợ.
        </div>
      )}
      {!claimPaid && booking.paymentMethod === 0 && (
        <div className="notice">
          Đơn tiền mặt: hệ thống không giữ tiền nên không hoàn tiền qua hệ
          thống. Kết quả chỉ có thể là bác khiếu nại hoặc yêu cầu làm lại.
        </div>
      )}
      <div className="field">
        <label htmlFor="rs">Lý do</label>
        <select
          id="rs"
          value={reason}
          onChange={(e) => setReason(Number(e.target.value))}
        >
          {REASONS.map((r, i) => (
            <option key={r} value={i}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="ds">Mô tả vấn đề (10–1000 ký tự)</label>
        <textarea
          id="ds"
          rows={4}
          maxLength={1000}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="ev">Ảnh bằng chứng (1–5 ảnh JPG/PNG, ≤ 5 MB)</label>
        <input
          id="ev"
          className="file-input"
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={(e) => pick(e.target.files)}
        />
        {files.length > 0 && (
          <div className="thumbs">
            {files.map((f, i) => (
              <img key={i} src={URL.createObjectURL(f)} alt={`Ảnh bằng chứng ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}

/** Đổi giờ và thử lại ghép nối (đơn ở trạng thái 8 – Chưa có Tasker nhận) */
export function RetryDialog({ booking, onClose, onDone }: DialogProps) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const [change, setChange] = useState(false);
  const [when, setWhen] = useState(() =>
    toLocal(
      new Date(
        Math.max(
          Date.now() + 2 * 3600_000,
          new Date(booking.scheduledTime).getTime(),
        ),
      ),
    ),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    let iso: string | undefined;
    if (change) {
      const t = new Date(when).getTime();
      if (!(t >= Date.now() + 3600_000 && t <= Date.now() + 30 * 86400_000))
        return setError(
          "Thời gian đặt không hợp lệ (từ 1 giờ đến 30 ngày tới).",
        );
      iso = new Date(when).toISOString();
    }
    setBusy(true);
    try {
      await bookingService.retry(booking.id, iso);
      onDone("Đang tìm Tasker lại cho bạn.");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Thử lại tìm Tasker"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Đang gửi…" : "Thử lại"}
          </button>
        </>
      }
    >
      <p>
        Hệ thống sẽ ghép Tasker lại từ đầu cho đơn #{orderCode(booking.id)}.
      </p>
      <label className="check">
        <input
          type="checkbox"
          checked={change}
          onChange={(e) => setChange(e.target.checked)}
        />{" "}
        Đổi giờ hẹn
      </label>
      {change && (
        <div className="field">
          <label htmlFor="rt">Giờ hẹn mới</label>
          <input
            id="rt"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </div>
      )}
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}

/** Thanh toán: chọn ví hoặc thẻ (trả nợ, trả phí hủy). Đơn chờ thanh toán dùng đúng phương thức của đơn */
export function PayDialog({
  booking,
  amount,
  title,
  onClose,
  onDone,
}: DialogProps & { amount: number; title: string }) {
  const [method, setMethod] = useState<1 | 2>(
    booking.paymentMethod === 2 ? 2 : 1,
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await paymentService.pay(booking.id, method);
      onDone("Thanh toán thành công.");
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Đang thanh toán…" : `Thanh toán ${formatVND(amount)}`}
          </button>
        </>
      }
    >
      <p>
        Đơn #{orderCode(booking.id)} · chỉ thanh toán bằng ví điện tử hoặc thẻ
        (giả lập, không trừ tiền thật).
      </p>
      <div className="pay-grid pay-grid--2" role="radiogroup" aria-label="Phương thức">
        {(
          [
            [1, "Ví điện tử", "MoMo, ZaloPay…"],
            [2, "Thẻ", "Visa / Napas"],
          ] as [1 | 2, string, string][]
        ).map(([m, t, sub]) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={method === m}
            className="pay-opt"
            onClick={() => setMethod(m)}
          >
            <b>{t}</b>
            <small>{sub}</small>
          </button>
        ))}
      </div>
      {error && (
        <div className="notice notice--danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  );
}
