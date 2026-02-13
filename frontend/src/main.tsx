import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPanel from "./AdminPanel";
import CookieConsent from "./CookieConsent";
import "./index.css";

const isAdmin = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isAdmin ? (
      <AdminPanel />
    ) : (
      <>
        <App />
        <CookieConsent />
      </>
    )}
  </React.StrictMode>,
);
