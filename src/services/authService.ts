// US01/US02/US03 - Đăng ký (xác thực email bằng OTP), đăng nhập, quên mật khẩu, đăng xuất
import axios from "axios";
import { api } from "./api";
import type {
  AuthResponse,
  LoginRequest,
  OtpSentResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types";

/** Body 403 khi đăng nhập tài khoản chưa xác thực email */
export interface EmailNotVerified {
  code: "EMAIL_NOT_VERIFIED";
  message: string;
  email: string;
  maskedEmail: string;
  resendAfterSeconds: number;
}

export function emailNotVerified(err: unknown): EmailNotVerified | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 403) return null;
  const data = err.response.data as Partial<EmailNotVerified> | undefined;
  return data?.code === "EMAIL_NOT_VERIFIED" ? (data as EmailNotVerified) : null;
}

export const authService = {
  login: (body: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),
  register: (body: RegisterRequest) =>
    api.post<RegisterResponse>("/auth/register", body).then((r) => r.data),
  verifyEmail: (email: string, code: string) =>
    api.post<AuthResponse>("/auth/verify-email", { email, code }).then((r) => r.data),
  resendVerification: (email: string) =>
    api.post<OtpSentResponse>("/auth/resend-verification", { email }).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<OtpSentResponse>("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<{ message: string }>("/auth/reset-password", { email, code, newPassword }).then((r) => r.data),
  logout: () => api.post("/auth/logout").catch(() => undefined),
};
