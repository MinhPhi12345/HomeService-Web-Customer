import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarPlus,
  ClipboardList,
  House,
  LogOut,
  Menu,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { initials } from "../utils/format";

/** "Đặng Hoàng Minh Phi" -> "Minh Phi" – tên hiển thị gọn trên thanh menu */
const shortName = (full: string) => {
  const w = full.trim().split(/\s+/);
  const two = w.slice(-2).join(" ");
  return two.length > 16 ? w[w.length - 1] : two;
};

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`logo${light ? " logo--light" : ""}`}
      aria-label="HomeService – Trang chủ"
    >
      <span className="logo-mark">
        <House size={19} strokeWidth={2.4} />
      </span>
      <span>
        Home<b>Service</b>
      </span>
    </Link>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;
  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar">{initials(user.fullName)}</span>
        <span className="user-name" title={user.fullName}>
          {shortName(user.fullName)}
        </span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <b>{user.fullName}</b>
            <span>{user.email}</span>
          </div>
          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={17} /> Hồ sơ của tôi
          </Link>
          <Link to="/bookings" role="menuitem" onClick={() => setOpen(false)}>
            <ClipboardList size={17} /> Đơn của tôi
          </Link>
          <Link to="/#tai-app" role="menuitem" onClick={() => setOpen(false)}>
            <Smartphone size={17} /> Tải ứng dụng
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate("/");
            }}
          >
            <LogOut size={17} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function BellLink() {
  const { unreadCount } = useNotifications();
  return (
    <Link
      to="/notifications"
      className="icon-btn"
      aria-label={`Thông báo${unreadCount ? ` (${unreadCount} chưa đọc)` : ""}`}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="dot-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
      )}
    </Link>
  );
}

/** Thanh điều hướng: "public" cho trang giới thiệu, "app" cho các trang sau đăng nhập */
export default function Navbar({ variant = "app" }: { variant?: "public" | "app" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => setOpen(false), [pathname, hash]);

  const publicLinks = (
    <>
      <a href="/#dich-vu">Dịch vụ &amp; bảng giá</a>
      <a href="/#quy-trinh">Cách hoạt động</a>
      <a href="/#tai-app">Tải ứng dụng</a>
      <NavLink to="/tasker-guide">Trở thành Tasker</NavLink>
    </>
  );
  const appLinks = (
    <>
      <NavLink to="/booking/new">Đặt dịch vụ</NavLink>
      <NavLink to="/bookings" end>
        Đơn của tôi
      </NavLink>
      <NavLink to="/tasker-guide">Trở thành Tasker</NavLink>
    </>
  );

  return (
    <header className={`nav nav--${variant}`}>
      <div className="container nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="Điều hướng chính">
          {variant === "public" ? publicLinks : appLinks}
        </nav>
        <div className="nav-right">
          {user ? (
            <>
              {variant === "public" && (
                <Link to="/bookings" className="btn btn-outline btn-sm hide-sm">
                  Đơn của tôi
                </Link>
              )}
              <BellLink />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm hide-sm">
                Đăng ký
              </Link>
            </>
          )}
          {variant === "public" && (
            <button
              type="button"
              className="icon-btn nav-burger"
              aria-label={open ? "Đóng menu" : "Mở menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>
      {open && variant === "public" && (
        <nav className="nav-drawer" aria-label="Menu">
          {publicLinks}
          {!user && (
            <Link to="/register" className="btn btn-primary btn-block">
              Tạo tài khoản
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

/** Thanh tab dưới cùng trên màn hình nhỏ (giống ứng dụng di động) */
export function BottomNav() {
  const { unreadCount } = useNotifications();
  const items = [
    { to: "/", label: "Trang chủ", Icon: House, end: true },
    { to: "/booking/new", label: "Đặt dịch vụ", Icon: CalendarPlus },
    { to: "/bookings", label: "Đơn", Icon: ClipboardList, end: true },
    { to: "/notifications", label: "Thông báo", Icon: Bell, badge: unreadCount },
    { to: "/profile", label: "Tài khoản", Icon: UserRound },
  ];
  return (
    <nav className="bottom-nav" aria-label="Điều hướng nhanh">
      {items.map(({ to, label, Icon, end, badge }) => (
        <NavLink key={to} to={to} end={end}>
          <span className="bn-icon">
            <Icon size={21} />
            {!!badge && <i>{badge > 9 ? "9+" : badge}</i>}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
