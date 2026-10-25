import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  home: { lat: number; lng: number }; // địa chỉ đơn
  tasker: { lat: number; lng: number } | null;
}

const pin = (cls: string, text: string) =>
  L.divIcon({
    className: "",
    html: `<div class="map-pin ${cls}">${text}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

/** Bản đồ OpenStreetMap (Leaflet) – marker Tasker và marker địa chỉ đơn. Không cần API key. */
export default function TrackingMap({ home, tasker }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const homeMarker = useRef<L.Marker | null>(null);
  const taskerMarker = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([home.lat, home.lng], 14);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
      homeMarker.current = null;
      taskerMarker.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!homeMarker.current)
      homeMarker.current = L.marker([home.lat, home.lng], {
        icon: pin("map-pin--home", "🏠"),
        title: "Địa chỉ thực hiện",
      }).addTo(m);
    else homeMarker.current.setLatLng([home.lat, home.lng]);

    if (tasker) {
      if (!taskerMarker.current)
        taskerMarker.current = L.marker([tasker.lat, tasker.lng], {
          icon: pin("map-pin--tasker", "🛵"),
          title: "Tasker",
        }).addTo(m);
      else taskerMarker.current.setLatLng([tasker.lat, tasker.lng]);
      m.fitBounds(
        L.latLngBounds([home.lat, home.lng], [tasker.lat, tasker.lng]),
        { padding: [40, 40], maxZoom: 16 },
      );
    } else {
      taskerMarker.current?.remove();
      taskerMarker.current = null;
      m.setView([home.lat, home.lng], 15);
    }
  }, [home.lat, home.lng, tasker?.lat, tasker?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={el}
      className="tracking-map"
      role="application"
      aria-label="Bản đồ vị trí Tasker"
    />
  );
}
