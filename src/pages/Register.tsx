// US01 – Đăng ký tài khoản khách hàng (Tasker đăng ký trên ứng dụng di động)
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import {
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from "../utils/validators";

type Key = "fullName" | "email" | "phoneNumber" | "password" | "confirm";
type Errors = Partial<Record<Key, string>>;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/booking/new";
  const [form, setForm] = useState<Record<Key, string>>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: Key) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "phoneNumber" ? e.target.value.replace(/\D/g, "") : e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phoneNumber: validatePhone(form.phoneNumber),
      password: validatePassword(form.password),
      confirm: form.confirm === form.password ? "" : "Mật khẩu xác nhận không khớp.",
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
        role: 0, // Web Customer luôn tạo tài khoản khách hàng
      });
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (
    k: Key,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    hint?: string,
  ) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props} />
      {errors[k] ? (
        <span className="field-error">{errors[k]}</span>
      ) : (
        hint && <span className="hint">{hint}</span>
      )}
    </div>
  );

  return (
    <AuthLayout
      title="Tạo tài khoản trong 1 phút"
      desc="Đặt dịch vụ tại nhà, theo dõi Tasker và thanh toán an toàn."
      extra="checks"
      footNote="Mật khẩu được mã hóa trước khi lưu."
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <h1>Đăng ký khách hàng</h1>
        <p className="auth-lead">Điền thông tin để bắt đầu đặt dịch vụ.</p>
        {serverError && (
          <div className="notice notice--danger" role="alert">
            {serverError}
          </div>
        )}
        {field("fullName", "Họ và tên", { autoComplete: "name", maxLength: 100, placeholder: "Nhập họ và tên của bạn" })}
        {field("email", "Email", { type: "email", autoComplete: "email", placeholder: "Nhập email để đăng nhập" })}
        {field(
          "phoneNumber",
          "Số điện thoại",
          { type: "tel", inputMode: "numeric", maxLength: 10, autoComplete: "tel", placeholder: "Nhập số điện thoại (10 số)" },
          "Không bắt buộc. Tasker dùng số này để liên hệ khi đến làm.",
        )}
        <div className="auth-row">
          {field(
            "password",
            "Mật khẩu",
            { type: "password", autoComplete: "new-password", placeholder: "Tạo mật khẩu" },
            "Từ 8 ký tự, có chữ và số.",
          )}
          {field("confirm", "Nhập lại mật khẩu", {
            type: "password",
            autoComplete: "new-password",
            placeholder: "Nhập lại mật khẩu",
          })}
        </div>
        <p className="hint auth-terms">
          Khi tạo tài khoản, bạn đồng ý với điều khoản sử dụng và chính sách bảo
          mật của HomeService.
        </p>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : "Tạo tài khoản"}
        </button>
        <p className="auth-switch">
          Đã có tài khoản?{" "}
          <Link to="/login" state={{ from }} className="link">
            Đăng nhập
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
