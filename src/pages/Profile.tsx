// US05/US24 - Hồ sơ cá nhân và lịch sử thanh toán
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Camera, TriangleAlert } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  profileService,
  paymentHistoryService,
} from "../services/userServices";
import { uploadService } from "../services/bookingService";
import { getErrorMessage } from "../services/api";
import { isNetworkError } from "../utils/net";
import { mockPayments, mockProfile } from "../data/mockUser";
import type { PaymentItem, ProfileResponse } from "../types";
import { validateFullName, validatePhone } from "../utils/validators";
import { formatDateTime, formatVND } from "../utils/format";
import {
  METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  orderCode,
} from "../utils/booking";
import "../styles/landing.css";
import "../styles/app.css";

const PAGE_SIZE = 20;

function PaymentHistory() {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    paymentHistoryService
      .my(page, PAGE_SIZE)
      .then((r) => {
        setRows(r.items);
        setTotal(r.totalCount);
        setDemo(false);
      })
      .catch((e) => {
        if (isNetworkError(e)) {
          const m = mockPayments();
          setRows(m);
          setTotal(m.length);
          setDemo(true);
        } else setError(getErrorMessage(e));
      })
      .finally(() => setLoading(false));
  }, [page]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <section className="card profile-card">
      {demo && (
        <div className="form-info">
          Chưa kết nối được Backend – đang hiển thị dữ liệu mẫu.
        </div>
      )}
      {loading && <p className="muted">Đang tải lịch sử thanh toán…</p>}
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="empty">
          <p>Bạn chưa có giao dịch nào.</p>
        </div>
      )}
      {rows.length > 0 && (
        <div className="table-scroll-c">
          <table className="pay-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Đơn</th>
                <th>Dịch vụ</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                  <td>
                    <Link to={`/bookings/${p.bookingId}`} className="link-teal">
                      #{orderCode(p.bookingId)}
                    </Link>
                  </td>
                  <td>{p.serviceCategoryName}</td>
                  <td>
                    <b>{formatVND(p.amount)}</b>
                    {p.refundedAmount > 0 && (
                      <small className="refund">
                        {" "}
                        hoàn {formatVND(p.refundedAmount)}
                      </small>
                    )}
                  </td>
                  <td>{METHOD_LABEL[p.method]}</td>
                  <td>{PAYMENT_STATUS_LABEL[p.status] ?? p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <div className="pager">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </button>
          <span>
            Trang {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
        </div>
      )}
    </section>
  );
}

export default function Profile() {
  const { updateName } = useAuth();
  const [tab, setTab] = useState<"info" | "payments">("info");
  const [p, setP] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
    avatarUrl: "",
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    address?: string;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const apply = (r: ProfileResponse) => {
    setP(r);
    setForm({
      fullName: r.fullName,
      phoneNumber: r.phoneNumber ?? "",
      address: r.address ?? "",
      avatarUrl: r.avatarUrl ?? "",
    });
  };

  useEffect(() => {
    profileService
      .get()
      .then((r) => {
        apply(r);
        setDemo(false);
      })
      .catch((e) => {
        if (isNetworkError(e)) {
          apply(mockProfile());
          setDemo(true);
        } else setError(getErrorMessage(e));
      })
      .finally(() => setLoading(false));
  }, []);

  const onFile = async (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      return setToast("Chỉ nhận ảnh JPG/PNG, tối đa 5 MB.");
    setUploading(true);
    try {
      const url = demo
        ? URL.createObjectURL(file)
        : await uploadService.upload(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
    } catch (e) {
      setToast(getErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      fullName: validateFullName(form.fullName),
      phoneNumber: validatePhone(form.phoneNumber),
      address: form.address.length > 255 ? "Địa chỉ tối đa 255 ký tự." : "",
    };
    setErrors(next);
    setToast("");
    if (next.fullName || next.phoneNumber || next.address) return;
    setSaving(true);
    try {
      // Gửi ĐỦ 4 field mỗi lần (Hướng dẫn 5.7) – không gửi thiếu sẽ làm mất SĐT/địa chỉ
      const body = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        address: form.address.trim() || null,
        avatarUrl: form.avatarUrl || null,
      };
      const r = demo
        ? { ...(p as ProfileResponse), ...body }
        : await profileService.update(body);
      apply(r);
      updateName(r.fullName);
      setToast("Đã lưu hồ sơ.");
    } catch (err) {
      setToast(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const initial = (form.fullName.trim().split(/\s+/).pop() ?? "U")
    .charAt(0)
    .toUpperCase();
  const debt = p?.outstandingAmount ?? 0;

  return (
    <>
      <Navbar variant="app" />
      <main className="app-page">
        <div className="container narrow">
          <h1 className="page-title">Hồ sơ cá nhân</h1>
          <div className="chip-row orders-filters" role="tablist">
            {(
              [
                ["info", "Thông tin"],
                ["payments", "Lịch sử thanh toán"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                type="button"
                className={`chip${tab === k ? " chip--on" : ""}`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "payments" && <PaymentHistory />}

          {tab === "info" && (
            <>
              {loading && <p className="muted">Đang tải hồ sơ…</p>}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              {demo && (
                <div className="form-info">
                  Chưa kết nối được Backend – đang hiển thị dữ liệu mẫu, thay
                  đổi không được lưu lên máy chủ.
                </div>
              )}
              {p && debt > 0 && (
                <div className="debt-alert" role="alert">
                  <TriangleAlert size={18} />
                  <div>
                    Bạn đang nợ <b>{formatVND(debt)}</b>. Bạn chưa thể đặt đơn
                    mới cho đến khi thanh toán.{" "}
                    <Link to="/bookings" className="link-teal">
                      Xem đơn cần trả
                    </Link>
                  </div>
                </div>
              )}
              {p?.isCashBlocked && (
                <div className="form-info">
                  Tài khoản đang bị chặn thanh toán tiền mặt, bạn chỉ thanh toán
                  online được. Liên hệ quản trị viên nếu cần mở lại.
                </div>
              )}
              {toast && (
                <div className="toast" role="status">
                  {toast}
                </div>
              )}

              {p && (
                <form
                  className="card profile-card"
                  onSubmit={submit}
                  noValidate
                >
                  <div className="avatar-row">
                    <span className="avatar-xl">
                      {form.avatarUrl ? (
                        <img src={form.avatarUrl} alt="Ảnh đại diện" />
                      ) : (
                        initial
                      )}
                    </span>
                    <div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                      >
                        <Camera size={14} />
                        &nbsp;{uploading ? "Đang tải ảnh…" : "Đổi ảnh đại diện"}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        hidden
                        onChange={(e) => onFile(e.target.files?.[0])}
                      />
                      <p className="muted small">JPG hoặc PNG, tối đa 5 MB.</p>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="pf-email">Email (không sửa được)</label>
                    <input
                      id="pf-email"
                      type="email"
                      value={p.email}
                      disabled
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="pf-name">Họ và tên</label>
                    <input
                      id="pf-name"
                      type="text"
                      value={form.fullName}
                      maxLength={100}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, fullName: e.target.value }))
                      }
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && (
                      <span className="field-error">{errors.fullName}</span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="pf-phone">Số điện thoại</label>
                    <input
                      id="pf-phone"
                      type="tel"
                      value={form.phoneNumber}
                      placeholder="0901234567"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                      }
                      aria-invalid={!!errors.phoneNumber}
                    />
                    {errors.phoneNumber && (
                      <span className="field-error">{errors.phoneNumber}</span>
                    )}
                  </div>
                  <div className="field">
                    <label htmlFor="pf-addr">Địa chỉ mặc định</label>
                    <input
                      id="pf-addr"
                      type="text"
                      value={form.address}
                      maxLength={255}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, address: e.target.value }))
                      }
                      aria-invalid={!!errors.address}
                    />
                    {errors.address && (
                      <span className="field-error">{errors.address}</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? "Đang lưu…" : "Lưu thay đổi"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
