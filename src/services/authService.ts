// US01/US02/US03 - Đăng ký, đăng nhập, đăng xuất
import { api } from "./api";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../types";

export const authService = {
  login: (body: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", body).then((r) => r.data),
  register: (body: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", body).then((r) => r.data),
  logout: () => api.post("/auth/logout").catch(() => undefined),
};
