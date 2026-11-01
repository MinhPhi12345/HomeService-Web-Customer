// Đổi mật khẩu khi đã đăng nhập: mật khẩu hiện tại + mã OTP gửi về email + mật khẩu mới
import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import OtpInput from "./OtpInput";
import { secondsFromMessage, useResendTimer } from "../utils/otp";
import { profileService } from "../services/userServices";
import { getErrorMessage } from "../services/api";
import { validatePassword } from "../utils/validators";

type Key = "current" | "password" | "confirm" | "code";

export default function ChangePasswordForm({ onDone }: { onDone: (msg: string) => void }) {
  const [form, setForm] = useState({ current: "", password: "", confirm: "" });
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useResendTimer();

  const validate = () => {
    const next: Partial<Record<Key, string>> = {
      current: form.current ? "" : "Vui lòng nhập mật khẩu hiện tại.",
      password: validatePassword(form.password),
      confirm: form.confirm === form.password ? "" : "Mật khẩu xác nhận không khớp.",
    };
    if (!next.password && form.password === form.current) next.password = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const sendCode = async () => {
    setServerError("");
    if (!validate()) return;
    setSending(true);
    try {
      const sent = await profileService.sendPasswordOtp();
      setSentTo(sent.maskedEmail);
      setCode("");
      timer.restart(sent.resendAfterSeconds);
    } catch (err) {
      const msg = getErrorMessage(err);
      const wait = secondsFromMessage(msg);
      if (wait) timer.restart(wait);
      setServerError(msg);
    } finally {
      setSending(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!sentTo) {
      await sendCode();
      return;
    }
    if (!validate()) return;
    if (code.length !== 6) {
      setErrors((x) => ({ ...x, code: "Vui lòng nhập đủ 6 số của mã OTP." }));
      return;
    }
    setSaving(true);
    try {
      await profileService.changePassword({ currentPassword: form.current, code, newPassword: form.password });
      setForm({ current: "", password: "", confirm: "" });
      setCode("");
      setSentTo("");
      setErrors({});
      onDone("Đổi mật khẩu thành công. Lần đăng nhập sau hãy dùng mật khẩu mới.");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const input = (k: "current" | "password" | "confirm", label: string, placeholder: string, autoComplete: string, hint?: string) => (
    <div className="field">
      <label htmlFor={`pw-${k}`}>{label}</label>
      <input
        id={`pw-${k}`}
        type="password"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={form[k]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [k]: e.target.value }));
          setErrors((x) => ({ ...x, [k]: "" }));
        }}
        aria-invalid={!!errors[k]}
      />
      {errors[k] ? <span className="field-error">{errors[k]}</span> : hint && <span className="hint">{hint}</span>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="pw-form">
      <div className="notice notice--teal">
        <ShieldCheck size={18} />
        <span>Để bảo vệ tài khoản, đổi mật khẩu cần mật khẩu hiện tại và mã OTP gửi về email đăng nhập của bạn.</span>
      </div>
      {serverError && (
        <div className="notice notice--danger" role="alert">
          {serverError}
        </div>
      )}
      {input("current", "Mật khẩu hiện tại", "Nhập mật khẩu đang dùng", "current-password")}
      <div className="bk-two">
        {input("password", "Mật khẩu mới", "Tạo mật khẩu mới", "new-password", "Từ 8 ký tự, có chữ và số.")}
        {input("confirm", "Nhập lại mật khẩu mới", "Nhập lại mật khẩu mới", "new-password")}
      </div>
      {sentTo && (
        <div className="field">
          <label>Mã OTP đã gửi tới {sentTo}</label>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setErrors((x) => ({ ...x, code: "" }));
            }}
            invalid={!!errors.code}
          />
          {errors.code ? (
            <span className="field-error">{errors.code}</span>
          ) : (
            <span className="hint">
              Mã có hiệu lực 5 phút.{" "}
              {timer.left > 0 ? (
                `Gửi lại sau ${timer.left} giây.`
              ) : (
                <button type="button" className="link" onClick={sendCode} disabled={sending}>
                  Gửi lại mã
                </button>
              )}
            </span>
          )}
        </div>
      )}
      <div className="form-actions">
        {sentTo ? (
          <button type="submit" className="btn btn-primary" disabled={saving || code.length !== 6}>
            {saving ? <span className="spinner" /> : "Đổi mật khẩu"}
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? <span className="spinner" /> : "Gửi mã OTP về email"}
          </button>
        )}
      </div>
    </form>
  );
}
