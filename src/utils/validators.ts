// Quy tắc kiểm tra dùng CHUNG với BE (SRS mục 6.1)
export const validateFullName = (v: string) => {
  const s = v.trim();
  return s.length >= 2 && s.length <= 100
    ? ""
    : "Họ tên phải từ 2 đến 100 ký tự.";
};
export const validateEmail = (v: string) =>
  v.length <= 256 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
    ? ""
    : "Email không hợp lệ.";
export const validatePassword = (v: string) =>
  v.length >= 8 && v.length <= 50 && /[A-Za-z]/.test(v) && /\d/.test(v)
    ? ""
    : "Mật khẩu phải từ 8 ký tự, gồm chữ và số.";
export const validatePhone = (v: string) =>
  !v || /^0\d{9}$/.test(v) ? "" : "Số điện thoại không hợp lệ.";
