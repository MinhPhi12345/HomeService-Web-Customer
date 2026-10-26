import { lazy, Suspense, useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import { useAuth } from "./context/AuthContext";

// Tách nhỏ bundle: trang nào mở mới tải code trang đó (bản đồ Leaflet khá nặng)
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const TaskerGuide = lazy(() => import("./pages/TaskerGuide"));
const Booking = lazy(() => import("./pages/Booking"));
const Orders = lazy(() => import("./pages/Orders"));
const BookingDetail = lazy(() => import("./pages/BookingDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));

function RequireAuth({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    children
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  );
}

/** Đã đăng nhập thì không vào lại trang Đăng nhập/Đăng ký */
function GuestOnly({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  return user ? <Navigate to="/bookings" replace /> : children;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const Loading = () => (
  <div className="route-loading" role="status" aria-label="Đang tải">
    <span className="spinner" />
  </div>
);

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
          <Route path="/tasker-guide" element={<TaskerGuide />} />
          <Route path="/booking/new" element={<RequireAuth><Booking /></RequireAuth>} />
          <Route path="/bookings" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/bookings/:id" element={<RequireAuth><BookingDetail /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
