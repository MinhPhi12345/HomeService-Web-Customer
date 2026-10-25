// US01 - Đăng ký tài khoản khách hàng
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import AuthShell from "../components/AuthShell";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from "../utils/validators";

type Key =
  "fullName" | "email" | "phoneNumber" | "password" | "confirm" | "terms";
type Errors = Partial<Record<Key, string>>;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirm: "",
  });
  const [terms, setTerms] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phoneNumber: validatePhone(form.phoneNumber),
      password: validatePassword(form.password),
      confirm:
        form.confirm === form.password ? "" : "Mật khẩu xác nhận không khớp.", // chỉ kiểm tra ở FE
      terms: terms ? "" : "Bạn cần đồng ý với Điều khoản sử dụng.",
    };
    setErrors(next);
    setServerError("");
    if (Object.values(next).some(Boolean)) return;
    setLoading(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phoneNumber: form.phoneNumber || null,
        role: 0, // Web Customer luôn gửi 0
      });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (
    k: Exclude<Key, "terms">,
    label: string,
    type: string,
    placeholder: string,
    auto?: string,
  ) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input
        id={k}
        type={type}
        autoComplete={auto}
        placeholder={placeholder}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
      />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </div>
  );

  return (
    <AuthShell
      variant="register"
      title="Tạo tài khoản trong 1 phút"
      desc="Đặt dịch vụ tại nhà, theo dõi Tasker và thanh toán an toàn."
      footerNote="Mật khẩu được mã hóa BCrypt"
      extra={
        <ul className="auth-checks">
          <li>Giá minh bạch, không phụ phí</li>
          <li>Tasker được xác thực hồ sơ</li>
          <li>Tiền chỉ chuyển khi bạn xác nhận</li>
        </ul>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <h1>Đăng ký khách hàng</h1>
        <p className="auth-lead">Điền thông tin để bắt đầu đặt dịch vụ.</p>
        {serverError && (
          <div className="form-error" role="alert">
            {serverError}
          </div>
        )}

        {field(
          "fullName",
          "Họ và tên (2–100 ký tự)",
          "text",
          "Nguyễn Văn A",
          "name",
        )}
        {field("email", "Email", "email", "vana@gmail.com", "email")}
        {field(
          "phoneNumber",
          "Số điện thoại (không bắt buộc)",
          "tel",
          "0901234567",
          "tel",
        )}
        <div className="field-row">
          {field(
            "password",
            "Mật khẩu (≥ 8 ký tự, có chữ & số)",
            "password",
            "••••••••",
            "new-password",
          )}
          {field(
            "confirm",
            "Xác nhận mật khẩu",
            "password",
            "••••••••",
            "new-password",
          )}
        </div>

        <div>
          <label className="check">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật
          </label>
          {errors.terms && <span className="field-error">{errors.terms}</span>}
        </div>

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
        </button>
        <div className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
        <Link to="/tasker-guide" className="tasker-hint">
          <Briefcase size={17} color="#0f9b8e" /> Muốn làm Tasker? Xem cách đăng
          ký và tải ứng dụng →
        </Link>
      </form>
    </AuthShell>
  );
}
