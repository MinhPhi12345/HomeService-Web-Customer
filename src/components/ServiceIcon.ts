import {
  SprayCan,
  Sparkles,
  Shirt,
  CookingPot,
  Snowflake,
  ShoppingCart,
  Baby,
  Droplets,
  Wrench,
  Sprout,
  PlugZap,
  type LucideIcon,
} from "lucide-react";

export interface IconStyle {
  Icon: LucideIcon;
  /** Nền nhạt của ô icon */
  bg: string;
  /** Màu nét icon */
  fg: string;
}

const MINT = { bg: "#e3f6f3", fg: "#0b8b7f" };
const SKY = { bg: "#e6f0fb", fg: "#2f6fc4" };
const PEACH = { bg: "#fff1e6", fg: "#d0661f" };
const LILAC = { bg: "#f0ecfb", fg: "#6a4fc4" };
const ROSE = { bg: "#fdecef", fg: "#c4475f" };

/** Icon + màu theo tên dịch vụ (dùng giống ứng dụng Mobile) */
export function iconForService(name: string): IconStyle {
  const n = name.toLowerCase();
  if (n.includes("tổng vệ sinh")) return { Icon: Sparkles, ...SKY };
  if (n.includes("máy lạnh") || n.includes("điều hòa")) return { Icon: Snowflake, ...SKY };
  if (n.includes("dọn")) return { Icon: SprayCan, ...MINT };
  if (n.includes("giặt") || n.includes("ủi")) return { Icon: Shirt, ...LILAC };
  if (n.includes("nấu")) return { Icon: CookingPot, ...PEACH };
  if (n.includes("chợ")) return { Icon: ShoppingCart, ...ROSE };
  if (n.includes("trẻ")) return { Icon: Baby, ...PEACH };
  if (n.includes("khử")) return { Icon: Droplets, ...MINT };
  if (n.includes("cây") || n.includes("vườn")) return { Icon: Sprout, bg: "#eaf6e4", fg: "#3d8a2a" };
  if (n.includes("điện") || n.includes("nước")) return { Icon: PlugZap, bg: "#fff6de", fg: "#b97a06" };
  return { Icon: Wrench, ...MINT };
}
