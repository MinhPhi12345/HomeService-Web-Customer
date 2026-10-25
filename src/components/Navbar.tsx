import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, House } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const links = [
  { id: "dich-vu", label: "Dịch vụ" },
  { id: "quy-trinh", label: "Quy trình" },
  { id: "vi-sao", label: "Vì sao chọn chúng tôi" },
  { id: "tasker", label: "Trở thành Tasker" },
];

/**
 * landing: menu cuộn mục (W01) · app: Dịch vụ / Đơn của tôi + avatar (W03, W04) · minimal: chỉ logo + nút (W05)
 */
export default function Navbar({
  variant = "landing",
}: {
  variant?: "landing" | "app" | "minimal";
}) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);

  const goTo = (id: string) => {
    if (pathname !== "/") return navigate("/", { state: { scrollTo: id } });
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const firstName = user?.fullName.trim().split(/\s+/).pop() ?? "";

  const bell = user && (
    <Link
      to="/notifications"
      className="bell-btn"
      aria-label={
        unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"
      }
    >
      <Bell size={19} />
      {unreadCount > 0 && (
        <em className="bell-badge">{unreadCount > 9 ? "9+" : unreadCount}</em>
      )}
    </Link>
  );

  const userPill = user && (
    <div className="user-pill-wrap">
      <button
        type="button"
        className="user-pill"
        onClick={() => setMenu((m) => !m)}
        aria-haspopup="menu"
        aria-expanded={menu}
      >
        <span className="user-avatar">{firstName.charAt(0).toUpperCase()}</span>
        <span className="user-name">{firstName}</span>
      </button>
      {menu && (
        <div
          className="user-menu"
          role="menu"
          onMouseLeave={() => setMenu(false)}
        >
          <Link to="/bookings" role="menuitem" onClick={() => setMenu(false)}>
            Đơn của tôi
          </Link>
          <Link to="/profile" role="menuitem" onClick={() => setMenu(false)}>
            Hồ sơ cá nhân
          </Link>
          <Link
            to="/notifications"
            role="menuitem"
            onClick={() => setMenu(false)}
          >
            Thông báo
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenu(false);
              logout().then(() => navigate("/"));
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );

  return (
    <header
      className={`navbar${variant !== "landing" ? " navbar--bordered" : ""}`}
    >
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="HomeService – Trang chủ">
          <span className="brand-mark">
            <House size={21} strokeWidth={2.2} />
          </span>
          <span className="brand-name">HomeService</span>
        </Link>

        {variant === "landing" && (
          <nav className="nav-links" aria-label="Điều hướng chính">
            {links.map((l) => (
              <button key={l.id} type="button" onClick={() => goTo(l.id)}>
                {l.label}
              </button>
            ))}
          </nav>
        )}
        {variant === "app" && (
          <nav
            className="nav-links nav-links--app"
            aria-label="Điều hướng chính"
          >
            <NavLink
              to="/booking/new"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Dịch vụ
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Đơn của tôi
            </NavLink>
          </nav>
        )}

        <div className="nav-actions">
          {variant === "app" ? (
            <>
              {bell}
              {userPill}
            </>
          ) : user ? (
            <>
              {bell}
              {userPill}
              <Link to="/booking/new" className="btn btn-primary">
                Đặt dịch vụ
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                Đăng nhập
              </Link>
              <Link to="/booking/new" className="btn btn-primary">
                Đặt dịch vụ
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
