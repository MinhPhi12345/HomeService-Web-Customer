import axios, { AxiosError } from "axios";

const TOKEN_KEY = "hs_token";
const USER_KEY = "hs_user";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 (trừ API login/register) => tự đăng xuất (SRS FR-03)
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url ?? "";
    if (
      error.response?.status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register")
    ) {
      for (const s of [localStorage, sessionStorage]) {
        s.removeItem(TOKEN_KEY);
        s.removeItem(USER_KEY);
      }
      if (location.pathname !== "/login") location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/** Lấy thông báo lỗi thân thiện theo SRS 8.6 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return "Không kết nối được máy chủ. Vui lòng kiểm tra Backend đang chạy.";
    const data = error.response.data as
      { message?: string; errors?: Record<string, string[]> } | undefined;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors)[0]?.[0];
      if (first) return first;
    }
    switch (error.response.status) {
      case 401:
        return "Phiên đăng nhập đã hết hạn.";
      case 403:
        return "Bạn không có quyền thực hiện thao tác này.";
      case 404:
        return "Không tìm thấy dữ liệu.";
      case 500:
        return "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
    }
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export const storage = { TOKEN_KEY, USER_KEY };

/** Chế độ xem thử giao diện (chỉ khi chạy dev, không cần Backend) */
export const DEMO_TOKEN = "demo-token";
export const isDemo = () => localStorage.getItem(TOKEN_KEY) === DEMO_TOKEN;
