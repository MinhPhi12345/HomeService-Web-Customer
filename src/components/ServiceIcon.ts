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
  type LucideIcon,
} from "lucide-react";

export interface IconStyle {
  Icon: LucideIcon;
  bg: string;
}

/** Chọn icon + màu pastel theo tên dịch vụ (khớp Figma W01) */
export function iconForService(name: string): IconStyle {
  const n = name.toLowerCase();
  if (n.includes("tổng vệ sinh"))
    return { Icon: Sparkles, bg: "var(--pastel-sky)" };
  if (n.includes("máy lạnh"))
    return { Icon: Snowflake, bg: "var(--pastel-sky)" };
  if (n.includes("dọn")) return { Icon: SprayCan, bg: "var(--pastel-mint)" };
  if (n.includes("giặt")) return { Icon: Shirt, bg: "var(--pastel-lilac)" };
  if (n.includes("nấu")) return { Icon: CookingPot, bg: "var(--pastel-peach)" };
  if (n.includes("chợ"))
    return { Icon: ShoppingCart, bg: "var(--pastel-rose)" };
  if (n.includes("trẻ")) return { Icon: Baby, bg: "var(--pastel-peach)" };
  if (n.includes("khử")) return { Icon: Droplets, bg: "var(--pastel-mint)" };
  return { Icon: Wrench, bg: "var(--primary-100)" };
}
