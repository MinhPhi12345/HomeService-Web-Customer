import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createBooking } from "../services/bookingService";

// US12/US13 - Tạo đơn đặt dịch vụ (chọn thời gian & địa chỉ)
export default function BookingCreatePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const serviceCategoryId = Number(params.get("serviceId"));

  const [scheduledTime, setScheduledTime] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createBooking({ serviceCategoryId, scheduledTime, address, note });
      navigate("/bookings");
    } catch {
      setError("Không thể tạo đơn. Vui lòng đăng nhập và thử lại.");
    }
  }

  return (
    <div>
      <h1>Đặt dịch vụ</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Thời gian mong muốn
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
        </label>
        <label>
          Địa chỉ thực hiện
          <input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </label>
        <label>
          Ghi chú
          <textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Xác nhận đặt dịch vụ</button>
      </form>
    </div>
  );
}
