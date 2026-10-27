// US05/US29 – Hồ sơ cá nhân và lịch sử thanh toán
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Camera, Crosshair, Loader2, Mail, Receipt, RefreshCw, ShieldCheck } from "lucide-react";
import AppShell from "../components/AppShell";
import { Toast } from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { profileService, paymentHistoryService } from "../services/userServices";
import { uploadService } from "../services/bookingService";
import { currentPosition, geoService } from "../services/geoService";
import { getErrorMessage } from "../services/api";
import type { Paged, PaymentItem, ProfileResponse } from "../types";
import { validateFullName, validatePhone } from "../utils/validators";
import { formatDate, formatDateTime, formatVND, initials } from "../utils/format";
import { METHOD_LABEL, PAYMENT_STATUS_LABEL, orderCode } from "../utils/booking";
import { mediaUrl } from "../utils/media";

const PAY_TONE: Record<number, string> = { 0: "blue", 1: "green", 2: "rose", 3: "amber", 4: "green", 5: "gray", 6: "gray" };

function PaymentHistory() {
  const [data, setData] = useState<Paged<PaymentItem> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    setData(null);
    paymentHistoryService
      .my(page, 10)
      .then(setData)
      .catch((e) => setError(getErrorMessage(e)));
  }, [page]);
  useEffect(load, [load]);

  if (error)
    return (
      <div className="notice notice--danger">
        {error}
        <button type="button" className="link notice-action" onClick={load}>
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="pay-list">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton" style={{ height: 64 }} />
        ))}
      </div>
    );
  if (!data.items.length)
    return (
      <div className="empty">
        <div className="empty-icon">
          <Receipt size={26} />
        </div>
        <h3>Chưa có giao dịch</h3>
        <p>Các khoản thanh toán, hoàn tiền sẽ hiện ở đây.</p>
      </div>
    );
  const pages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  return (
    <>
      <ul className="pay-list">
        {data.items.map((p) => (
          <li key={p.id}>
            <Link to={`/bookings/${p.bookingId}`} className="pay-row">
              <div>
                <b>{p.serviceCategoryName}</b>
                <span className="hint">
                  #{orderCode(p.bookingId)} · {METHOD_LABEL[p.method]} · {formatDateTime(p.paidAt ?? p.createdAt)}
                </span>
              </div>
              <div className="pay-amt">
                <b>{formatVND(p.amount)}</b>
                {p.refundedAmount > 0 && <span className="hint">Hoàn {formatVND(p.refundedAmount)}</span>}
                <span className={`badge badge--${PAY_TONE[p.status] ?? "gray"}`}>{PAYMENT_STATUS_LABEL[p.status] ?? "—"}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="pager">
          <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trang trước
          </button>
          <span>
            {page} / {pages}
          </span>
          <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Trang sau
          </button>
        </div>
      )}
    </>
  );
}

export default function Profile() {
  const { updateName } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "payments" ? "payments" : "info";
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ fullName: "", phoneNumber: "", address: "", avatarUrl: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const closeToast = useCallback(() => setToast(""), []);

  const fill = (r: ProfileResponse) => {
    setProfile(r);
    setForm({
      fullName: r.fullName,
      phoneNumber: r.phoneNumber ?? "",
      address: r.address ?? "",
      avatarUrl: r.avatarUrl ?? "",
    });
  };
  const load = useCallback(() => {
    setLoadError("");
    profileService
      .get()
      .then(fill)
      .catch((e) => setLoadError(getErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  const onAvatar = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setToast("Ảnh đại diện phải là JPG/PNG, tối đa 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadService.upload(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
      setToast("Đã tải ảnh lên. Bấm Lưu thay đổi để cập nhật.");
    } catch (e) {
      setToast(getErrorMessage(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const fillAddressFromGps = async () => {
    setLocating(true);
    try {
      const p = await currentPosition();
      const a = await geoService.reverse(p.lat, p.lng);
      if (a) setForm((f) => ({ ...f, address: a }));
      else setToast("Chưa đọc được địa chỉ của vị trí này, bạn nhập tay nhé.");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setLocating(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      fullName: validateFullName(form.fullName),
      phoneNumber: validatePhone(form.phoneNumber),
      address: form.address.length > 255 ? "Địa chỉ tối đa 255 ký tự." : "",
    };
    setErrors(next);
    setServerError("");
    if (Object.values(next).some(Boolean)) return;
    setSaving(true);
    try {
      const r = await profileService.update({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber || null,
        address: form.address.trim() || null,
        avatarUrl: form.avatarUrl || null,
      });
      fill(r);
      updateName(r.fullName);
      setToast("Đã lưu thay đổi.");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!profile &&
    (form.fullName !== profile.fullName ||
      form.phoneNumber !== (profile.phoneNumber ?? "") ||
      form.address !== (profile.address ?? "") ||
      form.avatarUrl !== (profile.avatarUrl ?? ""));

  if (loadError)
    return (
      <AppShell narrow>
        <div className="notice notice--danger">
          {loadError}
          <button type="button" className="link notice-action" onClick={load}>
            Thử lại
          </button>
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <div className="page-head">
        <div>
          <h1 className="page-title">Tài khoản</h1>
          <p className="page-sub">Số điện thoại và địa chỉ ở đây sẽ được gợi ý sẵn khi bạn đặt đơn.</p>
        </div>
      </div>

      <div className="profile">
        <aside className="panel profile-card">
          {profile ? (
            <>
              <div className="profile-avatar">
                <span className="avatar avatar--xl">
                  {form.avatarUrl ? <img src={mediaUrl(form.avatarUrl)} alt="Ảnh đại diện" /> : initials(form.fullName)}
                </span>
                <button
                  type="button"
                  className="avatar-edit"
                  aria-label="Đổi ảnh đại diện"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="spin" size={16} /> : <Camera size={16} />}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  hidden
                  onChange={(e) => onAvatar(e.target.files?.[0])}
                />
              </div>
              <h2>{profile.fullName}</h2>
              <p className="muted profile-mail">
                <Mail size={14} /> {profile.email}
              </p>
              {profile.createdAt && <p className="hint">Thành viên từ {formatDate(profile.createdAt)}</p>}
              {(profile.outstandingAmount ?? 0) > 0 ? (
                <div className="notice notice--danger profile-status">
                  <AlertTriangle size={18} />
                  <div>
                    <b>Còn nợ {formatVND(profile.outstandingAmount!)}</b>
                    <Link to="/bookings?tab=confirm" className="link">
                      Thanh toán ngay
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="notice notice--teal profile-status">
                  <ShieldCheck size={18} />
                  <span>{profile.isCashBlocked ? "Tài khoản tạm khóa thanh toán tiền mặt" : "Không có khoản nợ nào"}</span>
                </div>
              )}
            </>
          ) : (
            <div className="skeleton" style={{ height: 260 }} />
          )}
        </aside>

        <section className="panel profile-main">
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === "info"}
              onClick={() => setParams({}, { replace: true })}
            >
              Thông tin cá nhân
            </button>
            <button
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === "payments"}
              onClick={() => setParams({ tab: "payments" }, { replace: true })}
            >
              Lịch sử thanh toán
            </button>
          </div>
          <div className="profile-body">
            {tab === "payments" ? (
              <PaymentHistory />
            ) : !profile ? (
              <div className="skeleton" style={{ height: 300 }} />
            ) : (
              <form onSubmit={save} noValidate>
                {serverError && (
                  <div className="notice notice--danger" role="alert" style={{ marginBottom: 16 }}>
                    {serverError}
                  </div>
                )}
                <div className="bk-two">
                  <div className="field">
                    <label htmlFor="fullName">Họ và tên</label>
                    <input
                      id="fullName"
                      value={form.fullName}
                      maxLength={100}
                      placeholder="Nhập họ và tên"
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                      aria-invalid={!!errors.fullName}
                    />
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Nhập số điện thoại (10 số)"
                      value={form.phoneNumber}
                      onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value.replace(/\D/g, "") }))}
                      aria-invalid={!!errors.phoneNumber}
                    />
                    {errors.phoneNumber ? (
                      <span className="field-error">{errors.phoneNumber}</span>
                    ) : (
                      <span className="hint">Tự điền vào ô liên hệ khi đặt đơn.</span>
                    )}
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input id="email" value={profile.email} disabled />
                  <span className="hint">Email dùng để đăng nhập, không đổi được.</span>
                </div>
                <div className="field">
                  <label htmlFor="address">Địa chỉ mặc định</label>
                  <textarea
                    id="address"
                    rows={2}
                    maxLength={255}
                    placeholder="Nhập số nhà, tên đường, phường, quận"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    aria-invalid={!!errors.address}
                  />
                  {errors.address && <span className="field-error">{errors.address}</span>}
                  <button type="button" className="chip chip--sm" onClick={fillAddressFromGps} disabled={locating}>
                    {locating ? <Loader2 className="spin" size={14} /> : <Crosshair size={14} />} Lấy theo vị trí hiện tại
                  </button>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-outline" disabled={!dirty || saving} onClick={() => fill(profile)}>
                    Hoàn tác
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
                    {saving ? <span className="spinner" /> : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
      <Toast message={toast} onClose={closeToast} />
    </AppShell>
  );
}
