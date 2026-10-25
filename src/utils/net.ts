import axios from "axios";

/** Lỗi do chưa kết nối được Backend (không có phản hồi) – dùng để chuyển sang dữ liệu minh họa */
export const isNetworkError = (e: unknown) =>
  axios.isAxiosError(e) && !e.response;
