import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AdminPanel from "./AdminPanel";
import PrivacyPolicy from "./PrivacyPolicy";
import CookieConsent from "./CookieConsent";
import "./index.css";

const path = window.location.pathname;
const isAdmin = path.startsWith("/admin");
const isPrivacy = path === "/polityka-prywatnosci";

function Root() {
  if (isAdmin) return <AdminPanel />;
  if (isPrivacy)
    return (
      <>
        <PrivacyPolicy />
        <CookieConsent />
      </>
    );
  return (
    <>
      <App />
      <CookieConsent />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
