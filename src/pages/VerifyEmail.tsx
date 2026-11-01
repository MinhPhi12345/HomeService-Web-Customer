// US01 – Xác thực email bằng mã OTP sau khi đăng ký (hoặc khi đăng nhập tài khoản chưa xác thực)
import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import OtpInput from "../components/OtpInput";
import { secondsFromMessage, useResendTimer } from "../utils/otp";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { validateEmail } from "../utils/validators";

export interface VerifyEmailState {
  email: string;
  maskedEmail?: string;
  resendAfterSeconds?: number;
  from?: string;
  remember?: boolean;
  /** Thông báo hiển thị khi mở trang (vd. "Tài khoản chưa xác thực…") */
  notice?: string;
}

export default function VerifyEmail() {
  const { user, verifyEmail } = useAuth();
  // Vừa xác thực xong thì tự chuyển tới trang đích (không bị chặn bởi kiểm tra "đã đăng nhập")
  const verified = useRef(false);
  const navigate = useNavigate();
  const state = (useLocation().state as VerifyEmailState | null) ?? null;
  const from = state?.from ?? "/booking/new";
  const [email, setEmail] = useState(state?.email ?? "");
  const [masked, setMasked] = useState(state?.maskedEmail ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(state?.notice ?? "");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const timer = useResendTimer(state?.resendAfterSeconds ?? 0);

  const submit = async (value = code) => {
    if (value.length !== 6) {
      setError("Vui lòng nhập đủ 6 số của mã OTP.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      verified.current = true;
      const result = await verifyEmail(email.trim().toLowerCase(), value, state?.remember ?? true);
      if (result === "ok") navigate(from, { replace: true, state: { toast: "Xác thực email thành công. Chào mừng bạn đến với HomeService!" } });
    } catch (err) {
      verified.current = false;
      setError(err instanceof Error && !("response" in err) ? err.message : getErrorMessage(err));
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setSending(true);
    setError("");
    try {
      const sent = await authService.resendVerification(email.trim().toLowerCase());
      setMasked(sent.maskedEmail);
      setInfo(`Đã gửi mã mới tới ${sent.maskedEmail}. Mã cũ không còn dùng được.`);
      setCode("");
      timer.restart(sent.resendAfterSeconds);
    } catch (err) {
      const msg = getErrorMessage(err);
      const wait = secondsFromMessage(msg);
      if (wait) timer.restart(wait);
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  // Đã đăng nhập sẵn (mở lại trang) thì không cần xác thực nữa
  if (user && !verified.current) return <Navigate to="/bookings" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  return (
    <AuthLayout
      title="Chỉ còn một bước nữa"
      desc="Nhập mã OTP gửi về email để kích hoạt tài khoản và bắt đầu đặt dịch vụ."
      extra="checks"
      footNote="Mã OTP có hiệu lực 5 phút và chỉ dùng được 1 lần."
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <span className="otp-icon" aria-hidden="true">
          <MailCheck size={28} />
        </span>
        <h1>Xác thực email</h1>
        {state?.email ? (
          <p className="auth-lead">
            Chúng tôi đã gửi mã 6 số tới <b>{masked || email}</b>. Kiểm tra cả thư mục Spam nếu chưa thấy.
          </p>
        ) : (
          <>
            <p className="auth-lead">Nhập email đã đăng ký rồi bấm “Gửi lại mã” để nhận mã OTP mới.</p>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập email đã đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </>
        )}
        {info && !error && (
          <div className="notice notice--success" role="status">
            {info}
          </div>
        )}
        {error && (
          <div className="notice notice--danger" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label>Mã OTP</label>
          <OtpInput
            value={code}
            onChange={(v) => {
              setCode(v);
              setError("");
            }}
            onComplete={(v) => void submit(v)}
            disabled={loading}
            invalid={!!error}
            autoFocus={!!state?.email}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading || code.length !== 6}>
          {loading ? <span className="spinner" /> : "Xác thực và đăng nhập"}
        </button>
        <p className="otp-resend">
          Chưa nhận được mã?{" "}
          {timer.left > 0 ? (
            <span className="hint">Gửi lại sau {timer.left} giây</span>
          ) : (
            <button type="button" className="link" onClick={resend} disabled={sending}>
              {sending ? "Đang gửi…" : "Gửi lại mã"}
            </button>
          )}
        </p>
        <p className="auth-switch">
          Nhập sai email?{" "}
          <Link to="/register" state={{ from }} className="link">
            Đăng ký lại
          </Link>{" "}
          ·{" "}
          <Link to="/login" state={{ from }} className="link">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
