import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";
import { storage } from "../services/api";
import { buildHandoffUrl } from "../utils/handoff";
import {
  UserRole,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
} from "../types";

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL ?? "http://localhost:5174";

type User = Omit<AuthResponse, "accessToken" | "expiresAt">;
interface AuthState {
  user: User | null;
  /** 'ok': đã vào Web Customer; 'redirected': tài khoản Admin, đang chuyển sang Web Admin */
  login: (b: LoginRequest, remember?: boolean) => Promise<"ok" | "redirected">;
  register: (b: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Cập nhật tên hiển thị sau khi sửa hồ sơ */
  updateName: (fullName: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const readUser = (): User | null => {
  try {
    const raw =
      localStorage.getItem(storage.USER_KEY) ??
      sessionStorage.getItem(storage.USER_KEY);
    return JSON.parse(raw ?? "null");
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);

  // remember = true: lưu localStorage (giữ sau khi đóng trình duyệt); false: sessionStorage
  const save = (res: AuthResponse, remember = true): User => {
    const u: User = {
      userId: res.userId,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
    };
    const store = remember ? localStorage : sessionStorage;
    store.setItem(storage.TOKEN_KEY, res.accessToken);
    store.setItem(storage.USER_KEY, JSON.stringify(u));
    setUser(u);
    return u;
  };
  const clear = () => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(storage.TOKEN_KEY);
      s.removeItem(storage.USER_KEY);
    }
  };

  const login = useCallback(
    async (b: LoginRequest, remember = true): Promise<"ok" | "redirected"> => {
      const res = await authService.login(b);
      if (res.role === UserRole.Admin) {
        // Admin đăng nhập ở Web Customer => chuyển sang Web Admin, KHÔNG lưu phiên ở trang này
        const user = {
          userId: res.userId,
          fullName: res.fullName,
          email: res.email,
          role: res.role,
        };
        window.location.href = buildHandoffUrl(ADMIN_URL, {
          token: res.accessToken,
          user,
          remember,
        });
        return "redirected";
      }
      if (res.role !== UserRole.Customer)
        throw new Error(
          "Tài khoản Tasker dùng ứng dụng HomeService trên điện thoại. Tải ứng dụng ở trang chủ.",
        );
      save(res, remember);
      return "ok";
    },
    [],
  );
  const register = useCallback(async (b: RegisterRequest) => {
    save(await authService.register(b));
  }, []);
  const logout = useCallback(async () => {
    await authService.logout();
    clear();
    setUser(null);
  }, []);

  const updateName = useCallback((fullName: string) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, fullName };
      for (const s of [localStorage, sessionStorage])
        if (s.getItem(storage.USER_KEY))
          s.setItem(storage.USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout, updateName }),
    [user, login, register, logout, updateName],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải nằm trong AuthProvider");
  return ctx;
};
