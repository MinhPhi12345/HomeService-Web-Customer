import apiClient from "./api";
import type { AuthResponse } from "../types";

// US01 - Đăng ký tài khoản
export async function register(payload: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", {
    ...payload,
    role: 0, // 0 = Customer (xem Enums/UserRole.cs ở backend)
  });
  return data;
}

// US02 - Đăng nhập
export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}
