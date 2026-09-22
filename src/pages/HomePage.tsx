import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getServiceCategories } from "../services/serviceCatalogService";
import type { ServiceCategory } from "../types";

// US10 - Xem/Tìm kiếm dịch vụ
export default function HomePage() {
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getServiceCategories()
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      setServices(await getServiceCategories(keyword));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>HomeService – Dịch vụ tại nhà</h1>
      <form onSubmit={handleSearch}>
        <input
          placeholder="Tìm dịch vụ (vd: dọn dẹp, sửa điện...)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">Tìm kiếm</button>
      </form>

      {loading ? (
        <p>Đang tải danh sách dịch vụ...</p>
      ) : (
        <ul>
          {services.map((s) => (
            <li key={s.id}>
              <Link to={`/booking/new?serviceId=${s.id}`}>
                {s.name} — {s.basePrice.toLocaleString("vi-VN")}đ / {s.unit}
              </Link>
            </li>
          ))}
          {services.length === 0 && <p>Chưa có dịch vụ nào. Hãy thêm dịch vụ từ trang Admin.</p>}
        </ul>
      )}
    </div>
  );
}
