// Bản đồ & địa chỉ – miễn phí, không cần API key.
// Ưu tiên đi qua Backend (/api/geo: có cache, xếp hàng theo chính sách OSM).
// Nếu Backend chưa có /api/geo hoặc không ra được Internet => trình duyệt gọi thẳng OpenStreetMap/Nominatim.
import axios from "axios";
import { api } from "./api";
import { API_BASE } from "../utils/appConfig";

export interface GeoPlace {
  latitude: number;
  longitude: number;
  address: string;
  title?: string | null;
}

/** Ảnh nền qua Backend (ưu tiên) */
export const TILE_URL = `${API_BASE.replace(/\/$/, "")}/geo/tiles/{z}/{x}/{y}.png`;
/** Ảnh nền lấy thẳng từ OpenStreetMap (dự phòng) */
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const NOMINATIM = "https://nominatim.openstreetmap.org";

// ---------- Nominatim trực tiếp (dự phòng) ----------
interface NominatimItem {
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string>;
}

/** Ghép địa chỉ gọn kiểu Việt Nam: "số nhà đường, phường, quận, thành phố" (giống Backend) */
function formatAddress(item: NominatimItem): string | null {
  const a = item.address ?? {};
  const pick = (...keys: string[]) => keys.map((k) => a[k]?.trim()).find(Boolean) ?? null;
  const street = [pick("house_number"), pick("road", "pedestrian", "footway", "residential")]
    .filter(Boolean)
    .join(" ");
  const parts = [
    street || null,
    pick("quarter", "neighbourhood", "suburb", "village", "hamlet"),
    pick("city_district", "district", "county", "town"),
    pick("city", "state"),
  ].filter((x): x is string => !!x);
  const unique = parts.filter((p, i) => i === 0 || p !== parts[i - 1]);
  if (unique.length >= 2) return unique.join(", ");
  return item.display_name?.split(",").slice(0, 4).join(",").trim() || null;
}

let lastDirect = 0;
/** Nominatim cho phép ~1 request/giây: giãn cách các lần gọi trực tiếp */
async function nominatim(path: string, params: Record<string, string>) {
  const wait = lastDirect + 1100 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastDirect = Date.now();
  const res = await axios.get(`${NOMINATIM}${path}`, {
    params: { format: "jsonv2", addressdetails: 1, "accept-language": "vi", ...params },
    timeout: 10000,
  });
  return res.data;
}

const directReverse = async (lat: number, lng: number) => {
  try {
    const item = (await nominatim("/reverse", { lat: String(lat), lon: String(lng), zoom: "18" })) as NominatimItem;
    return item?.address ? formatAddress(item) : null;
  } catch {
    return null;
  }
};

const directSearch = async (q: string): Promise<GeoPlace[]> => {
  const list = (await nominatim("/search", { q, countrycodes: "vn", limit: "6" })) as NominatimItem[];
  return list
    .map((it): GeoPlace | null => {
      const address = formatAddress(it);
      if (!address) return null;
      const title = it.name && !address.startsWith(it.name) ? it.name : null;
      return { latitude: Number(it.lat), longitude: Number(it.lon), address, title };
    })
    .filter((x): x is GeoPlace => !!x && Number.isFinite(x.latitude) && Number.isFinite(x.longitude));
};

/** Backend trả lỗi do chưa có /api/geo (404) hoặc lỗi máy chủ/mạng => chuyển sang gọi trực tiếp */
const backendUnavailable = (e: unknown) =>
  axios.isAxiosError(e) && (!e.response || e.response.status === 404 || e.response.status >= 500);

export const geoService = {
  /** Tọa độ -> địa chỉ gọn. Không đọc được thì trả null để màn hình vẫn dùng được */
  async reverse(lat: number, lng: number): Promise<string | null> {
    try {
      const r = await api.get<{ address: string | null }>("/geo/reverse", { params: { lat, lng } });
      if (r.data.address) return r.data.address;
    } catch {
      /* Backend lỗi: thử trực tiếp bên dưới */
    }
    return directReverse(lat, lng);
  },

  /** Tìm địa chỉ ở Việt Nam (gọi khi bấm Tìm, không theo từng ký tự) */
  async search(q: string): Promise<GeoPlace[]> {
    try {
      const r = await api.get<GeoPlace[]>("/geo/search", { params: { q } });
      if (r.data.length) return r.data;
    } catch (e) {
      if (!backendUnavailable(e)) throw e; // ví dụ 400: từ khóa quá ngắn
    }
    try {
      return await directSearch(q);
    } catch {
      throw new Error("Không kết nối được dịch vụ tìm địa chỉ. Bạn có thể ghim trực tiếp trên bản đồ.");
    }
  },
};

/** Lấy vị trí GPS của trình duyệt */
export function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext)
      return reject(
        new Error(
          "Trình duyệt chỉ cho lấy vị trí khi mở web bằng localhost hoặc https. Hãy ghim trên bản đồ hoặc tìm địa chỉ.",
        ),
      );
    if (!navigator.geolocation) return reject(new Error("Trình duyệt không hỗ trợ định vị."));
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: +p.coords.latitude.toFixed(6),
          lng: +p.coords.longitude.toFixed(6),
        }),
      (e) =>
        reject(
          new Error(
            e.code === e.PERMISSION_DENIED
              ? "Bạn chưa cho phép trình duyệt truy cập vị trí. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ để cho phép."
              : e.code === e.TIMEOUT
                ? "Lấy vị trí quá lâu. Thử lại hoặc ghim trên bản đồ."
                : "Không lấy được vị trí hiện tại. Kiểm tra định vị (Location) của máy.",
          ),
        ),
      { timeout: 12000, enableHighAccuracy: false, maximumAge: 60000 },
    );
  });
}
