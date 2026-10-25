// US02 - Đăng nhập (Admin đăng nhập ở đây sẽ tự chuyển sang Web Admin)
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SprayCan, Shirt, CookingPot, Snowflake } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { validateEmail } from "../utils/validators";

export default function Login() {
  const { login, demoLogin, demoAdmin } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
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
      // Admin => tự chuyển sang Web Admin; khách hàng => vào trang chủ
      const result = await login(
        { email: email.trim().toLowerCase(), password },
        remember,
      );
      if (result === "ok") navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error && !("response" in err)
          ? err.message
          : getErrorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  };

  const chips = [SprayCan, Shirt, CookingPot, Snowflake];

  return (
    <AuthShell
      variant="login"
      title="Một chạm – nhà gọn gàng"
      desc="Đăng nhập để đặt dịch vụ, theo dõi Tasker và quản lý đơn của bạn."
      footerNote="Thông tin của bạn được bảo mật · Tiền chỉ chuyển khi bạn xác nhận"
      extra={
        <div className="auth-chips" aria-hidden="true">
          {chips.map((Icon, i) => (
            <span className="auth-chip" key={i}>
              <Icon size={27} color="#0f9b8e" />
            </span>
          ))}
        </div>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <h1>Chào mừng trở lại</h1>
        <p className="auth-lead">Đăng nhập bằng email và mật khẩu của bạn.</p>
        {serverError && (
          <div className="form-error" role="alert">
            {serverError}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="vana@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
        <div className="field">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <span className="field-error">{errors.password}</span>
          )}
        </div>

        <div className="auth-row">
          <label className="check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Ghi nhớ tôi
          </label>
          <a href="#" className="link-teal" onClick={(e) => e.preventDefault()}>
            Quên mật khẩu?
          </a>
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
        <div className="auth-divider">hoặc</div>
        <Link to="/register" className="auth-secondary">
          Tạo tài khoản mới
        </Link>
        {import.meta.env.DEV && (
          <>
            <button
              type="button"
              className="auth-secondary"
              onClick={() => {
                demoLogin();
                navigate("/booking/new");
              }}
            >
              Xem thử giao diện khách hàng (không cần Backend)
            </button>
            <button
              type="button"
              className="auth-secondary"
              onClick={demoAdmin}
            >
              Xem thử giao diện Admin (không cần Backend)
            </button>
          </>
        )}
        <p className="auth-note">
          Muốn làm Tasker? Đăng ký và gửi hồ sơ trên ứng dụng di động.
        </p>
      </form>
    </AuthShell>
  );
}
