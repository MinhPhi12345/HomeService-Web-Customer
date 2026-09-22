import { Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingCreatePage from "./pages/BookingCreatePage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import "./App.css";

function App() {
  return (
    <>
      <NavBar />
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/booking/new" element={<BookingCreatePage />} />
          <Route path="/bookings" element={<BookingHistoryPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
