import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import { useAuth } from "../context/AuthContext";

// US01 - Đăng ký tài khoản
export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phoneNumber: "" });
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await register(form);
      setUser(res);
      navigate("/");
    } catch {
      setError("Không thể đăng ký. Email có thể đã được sử dụng.");
    }
  }

  return (
    <div>
      <h1>Đăng ký tài khoản</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Họ và tên"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          placeholder="Số điện thoại"
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}
