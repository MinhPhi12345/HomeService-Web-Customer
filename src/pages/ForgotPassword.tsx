// Quên mật khẩu: nhập email → nhận mã OTP qua email → nhập mã + mật khẩu mới
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import OtpInput from "../components/OtpInput";
import { secondsFromMessage, useResendTimer } from "../utils/otp";
import { authService } from "../services/authService";
import { getErrorMessage } from "../services/api";
import { validateEmail, validatePassword } from "../utils/validators";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [masked, setMasked] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; code?: string; password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useResendTimer();

  const send = async () => {
    const emailError = validateEmail(email);
    setErrors({ email: emailError });
    setServerError("");
    if (emailError) return;
    setLoading(true);
    try {
      const sent = await authService.forgotPassword(email.trim().toLowerCase());
      setMasked(sent.maskedEmail);
      setInfo(`Nếu email đã đăng ký, mã OTP đã được gửi tới ${sent.maskedEmail}. Mã có hiệu lực 5 phút.`);
      setCode("");
      timer.restart(sent.resendAfterSeconds);
      setStep("reset");
    } catch (err) {
      const msg = getErrorMessage(err);
      const wait = secondsFromMessage(msg);
      if (wait) {
        timer.restart(wait);
        setStep("reset");
      }
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      code: code.length === 6 ? "" : "Vui lòng nhập đủ 6 số của mã OTP.",
      password: validatePassword(password),
      confirm: confirm === password ? "" : "Mật khẩu xác nhận không khớp.",
    };
    setErrors(next);
    setServerError("");
    if (Object.values(next).some(Boolean)) return;
    setLoading(true);
    try {
      await authService.resetPassword(email.trim().toLowerCase(), code, password);
      navigate("/login", {
        replace: true,
        state: { email: email.trim().toLowerCase(), notice: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới." },
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Lấy lại quyền truy cập"
      desc="Chúng tôi gửi mã OTP tới email của bạn để xác nhận trước khi đặt mật khẩu mới."
      extra="chips"
      footNote="Không chia sẻ mã OTP cho bất kỳ ai, kể cả nhân viên HomeService."
    >
      {step === "email" ? (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          noValidate
        >
          <span className="otp-icon" aria-hidden="true">
            <KeyRound size={28} />
          </span>
          <h1>Quên mật khẩu</h1>
          <p className="auth-lead">Nhập email tài khoản, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.</p>
          {serverError && (
            <div className="notice notice--danger" role="alert">
              {serverError}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-icon">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập email tài khoản"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                autoFocus
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Gửi mã OTP"}
          </button>
          <p className="auth-switch">
            Nhớ ra mật khẩu?{" "}
            <Link to="/login" className="link">
              Đăng nhập
            </Link>
          </p>
        </form>
      ) : (
        <form className="auth-form" onSubmit={reset} noValidate>
          <button type="button" className="link otp-back" onClick={() => setStep("email")}>
            <ArrowLeft size={16} /> Đổi email
          </button>
          <h1>Đặt mật khẩu mới</h1>
          <p className="auth-lead">
            Nhập mã 6 số đã gửi tới <b>{masked || email}</b> và mật khẩu mới.
          </p>
          {info && !serverError && (
            <div className="notice notice--success" role="status">
              {info}
            </div>
          )}
          {serverError && (
            <div className="notice notice--danger" role="alert">
              {serverError}
            </div>
          )}
          <div className="field">
            <label>Mã OTP</label>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                setErrors((x) => ({ ...x, code: "" }));
              }}
              invalid={!!errors.code}
            />
            {errors.code && <span className="field-error">{errors.code}</span>}
          </div>
          <div className="auth-row">
            <div className="field">
              <label htmlFor="new-password">Mật khẩu mới</label>
              <div className="input-icon">
                <KeyRound size={18} />
                <input
                  id="new-password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Tạo mật khẩu mới"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="icon-btn input-suffix"
                  aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShow((s) => !s)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? (
                <span className="field-error">{errors.password}</span>
              ) : (
                <span className="hint">Từ 8 ký tự, có chữ và số.</span>
              )}
            </div>
            <div className="field">
              <label htmlFor="confirm">Nhập lại mật khẩu</label>
              <input
                id="confirm"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!errors.confirm}
              />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "Đặt lại mật khẩu"}
          </button>
          <p className="otp-resend">
            Chưa nhận được mã?{" "}
            {timer.left > 0 ? (
              <span className="hint">Gửi lại sau {timer.left} giây</span>
            ) : (
              <button type="button" className="link" onClick={() => void send()} disabled={loading}>
                Gửi lại mã
              </button>
            )}
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
