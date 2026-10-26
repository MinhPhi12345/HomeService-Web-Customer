import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSM_TILE_URL, TILE_URL } from "../services/geoService";

export interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  /** Vị trí làm việc (marker xanh) */
  home: LatLng;
  /** Vị trí Tasker (marker cam) – chỉ khi theo dõi */
  tasker?: LatLng | null;
  /** Cho phép chọn vị trí: bấm lên bản đồ hoặc kéo marker */
  onPick?: (p: LatLng) => void;
  height?: number;
  label?: string;
}

const HOME_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';
const TASKER_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/></svg>';

const icon = (cls: string, svg: string) =>
  L.divIcon({
    className: "",
    html: `<div class="map-pin ${cls}"><span>${svg}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: cls === "map-pin--home" ? [18, 42] : [18, 18],
  });

/**
 * Bản đồ OpenStreetMap (Leaflet). Ảnh nền tải qua Backend /api/geo/tiles (có cache),
 * nên trình duyệt không gọi thẳng máy chủ OSM và không cần API key.
 */
export default function MapView({
  home,
  tasker = null,
  onPick,
  height = 280,
  label = "Bản đồ",
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const homeM = useRef<L.Marker | null>(null);
  const taskerM = useRef<L.Marker | null>(null);
  const [failed, setFailed] = useState(false);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  // Tạo bản đồ 1 lần
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([home.lat, home.lng], 16);
    // Ảnh nền: thử Backend trước; ô đầu tiên lỗi => chuyển sang OpenStreetMap trực tiếp
    const attribution = "© OpenStreetMap contributors";
    let loaded = 0;
    let directMode = false;
    const direct = L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution });
    const proxy = L.tileLayer(TILE_URL, { maxZoom: 19, attribution }).addTo(m);
    proxy.on("tileload", () => loaded++);
    proxy.on("tileerror", () => {
      if (directMode || loaded > 0) return;
      directMode = true;
      m.removeLayer(proxy);
      direct.addTo(m);
    });
    let directOk = false;
    direct.on("tileload", () => {
      directOk = true;
      setFailed(false);
    });
    direct.on("tileerror", () => !directOk && setFailed(true));
    homeM.current = L.marker([home.lat, home.lng], {
      icon: icon("map-pin--home", HOME_SVG),
      draggable: !!pickRef.current,
      title: "Địa chỉ làm việc",
      keyboard: false,
    }).addTo(m);
    m.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a>');
    homeM.current.on("dragend", () => {
      const p = homeM.current!.getLatLng();
      pickRef.current?.({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
    });
    m.on("click", (e: L.LeafletMouseEvent) => {
      if (!pickRef.current) return;
      pickRef.current({
        lat: +e.latlng.lat.toFixed(6),
        lng: +e.latlng.lng.toFixed(6),
      });
    });
    map.current = m;
    // Khung chứa có thể đổi kích thước sau khi render (grid/flex)
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      homeM.current = null;
      taskerM.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cập nhật marker
  useEffect(() => {
    const m = map.current;
    if (!m || !homeM.current) return;
    homeM.current.setLatLng([home.lat, home.lng]);
    if (tasker) {
      if (!taskerM.current)
        taskerM.current = L.marker([tasker.lat, tasker.lng], {
          icon: icon("map-pin--tasker", TASKER_SVG),
          title: "Tasker",
        }).addTo(m);
      else taskerM.current.setLatLng([tasker.lat, tasker.lng]);
      m.fitBounds(L.latLngBounds([home.lat, home.lng], [tasker.lat, tasker.lng]), {
        padding: [48, 48],
        maxZoom: 16,
      });
    } else {
      taskerM.current?.remove();
      taskerM.current = null;
      m.setView([home.lat, home.lng], Math.max(m.getZoom(), 15));
    }
  }, [home.lat, home.lng, tasker?.lat, tasker?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="map-box">
      <div ref={el} className="map" style={{ height }} role="application" aria-label={label} />
      {failed && (
        <div className="map-failed" role="status">
          Không tải được ảnh bản đồ. Kiểm tra kết nối Internet. Bạn vẫn có thể nhập địa chỉ và bấm lên bản đồ để ghim
          vị trí.
        </div>
      )}
    </div>
  );
}
