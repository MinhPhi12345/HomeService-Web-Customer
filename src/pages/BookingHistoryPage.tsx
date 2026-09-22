import { useEffect, useState } from "react";
import { cancelBooking, getMyBookings } from "../services/bookingService";
import type { Booking } from "../types";

// US15 - Xem lịch sử đặt dịch vụ / US14 - Hủy đơn / US19 - (vị trí realtime: TODO tích hợp sau)
export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setBookings(await getMyBookings());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCancel(id: number) {
    await cancelBooking(id);
    load();
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div>
      <h1>Lịch sử đặt dịch vụ</h1>
      <table>
        <thead>
          <tr>
            <th>Dịch vụ</th>
            <th>Thời gian</th>
            <th>Địa chỉ</th>
            <th>Trạng thái</th>
            <th>Tasker</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>{b.serviceCategoryName}</td>
              <td>{new Date(b.scheduledTime).toLocaleString("vi-VN")}</td>
              <td>{b.address}</td>
              <td>{b.status}</td>
              <td>{b.taskerName ?? "Chưa ghép nối"}</td>
              <td>
                <button onClick={() => handleCancel(b.id)}>Hủy đơn</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
