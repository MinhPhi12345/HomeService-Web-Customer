import type { ReactNode } from "react";
import Navbar, { BottomNav } from "./Navbar";

/** Khung chung cho các trang sau đăng nhập */
export default function AppShell({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <>
      <Navbar variant="app" />
      <main className="page">
        <div className={`container${narrow ? " container--narrow" : ""}`}>
          {children}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
