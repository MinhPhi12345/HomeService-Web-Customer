import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import "./styles/global.css";
import { consumeHandoff } from "./utils/handoff";
import { UserRole } from "./types";

consumeHandoff(UserRole.Customer); // nhận phiên đăng nhập khách hàng chuyển từ Web Admin (nếu có)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
