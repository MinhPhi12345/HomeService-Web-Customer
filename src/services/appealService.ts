// US48 (SRS v1.8) – yêu cầu mở khóa tài khoản: xác thực email bằng OTP → xem lý do khóa → gửi giải trình kèm ảnh
import axios from "axios";
import { api } from "./api";
import type { AppealContext, AppealSession, OtpSentResponse } from "../types";

const HEADER = "X-Appeal-Token";

/** Body 403 khi đăng nhập đúng mật khẩu nhưng tài khoản đã bị khóa */
export interface AccountLocked {
  code: "ACCOUNT_LOCKED";
  message: string;
  email: string;
  lockReason: number | null;
  lockReasonText: string | null;
  lockDetail: string | null;
  lockedAt: string | null;
}

export function accountLocked(err: unknown): AccountLocked | null {
  if (!axios.isAxiosError(err) || err.response?.status !== 403) return null;
  const data = err.response.data as Partial<AccountLocked> | undefined;
  return data?.code === "ACCOUNT_LOCKED" ? (data as AccountLocked) : null;
}

export const appealService = {
  sendOtp: (email: string) =>
    api.post<OtpSentResponse>("/account-appeals/send-otp", { email }).then((r) => r.data),
  verify: (email: string, code: string) =>
    api.post<AppealSession>("/account-appeals/verify", { email, code }).then((r) => r.data),
  session: (token: string) =>
    api.get<AppealContext>("/account-appeals/session", { headers: { [HEADER]: token } }).then((r) => r.data),
  upload: (token: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post<{ url: string }>("/account-appeals/upload", fd, {
        headers: { "Content-Type": "multipart/form-data", [HEADER]: token },
      })
      .then((r) => r.data.url);
  },
  submit: (token: string, content: string, attachmentUrls: string[]) =>
    api.post<AppealContext>("/account-appeals", { token, content, attachmentUrls }).then((r) => r.data),
};
