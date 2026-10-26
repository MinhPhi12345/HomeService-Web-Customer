// US02 – Đăng nhập (tài khoản Admin đăng nhập ở đây sẽ tự chuyển sang Web Admin)
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { validateEmail } from "../utils/validators";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/bookings";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      email: validateEmail(email),
      password: password ? "" : "Vui lòng nhập mật khẩu.",
    };
    setErrors(next);
    setServerError("");
    if (next.email || next.password) return;
    setLoading(true);
    try {
      const result = await login({ email: email.trim().toLowerCase(), password }, remember);
      if (result === "ok") navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error && !("response" in err) ? err.message : getErrorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Một chạm, nhà gọn gàng"
      desc="Đăng nhập để đặt dịch vụ, theo dõi Tasker và quản lý đơn của bạn."
      extra="chips"
      footNote="Thông tin của bạn được bảo mật. Tiền chỉ chuyển khi bạn xác nhận."
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <h1>Chào mừng trở lại</h1>
        <p className="auth-lead">Đăng nhập bằng email và mật khẩu của bạn.</p>
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
            />
          </div>
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <div className="input-icon">
            <Lock size={18} />
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
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
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        <label className="check auth-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Ghi nhớ đăng nhập trên máy này
        </label>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : "Đăng nhập"}
        </button>
        <div className="auth-or">
          <span>hoặc</span>
        </div>
        <Link to="/register" state={{ from }} className="btn btn-outline btn-lg btn-block auth-alt">
          Tạo tài khoản mới
        </Link>
      </form>
    </AuthLayout>
  );
}
