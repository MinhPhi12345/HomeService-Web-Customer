import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { type ReactElement } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookingDetail from "./pages/BookingDetail";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Booking from "./pages/Booking";
import Orders from "./pages/Orders";
import TaskerGuide from "./pages/TaskerGuide";
import { useAuth } from "./context/AuthContext";

function RequireAuth({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (
    children
  ) : (
    <Navigate
      to="/login"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tasker-guide" element={<TaskerGuide />} />
      <Route
        path="/booking/new"
        element={
          <RequireAuth>
            <Booking />
          </RequireAuth>
        }
      />
      <Route
        path="/bookings"
        element={
          <RequireAuth>
            <Orders />
          </RequireAuth>
        }
      />
      <Route
        path="/bookings/:id"
        element={
          <RequireAuth>
            <BookingDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <Notifications />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
