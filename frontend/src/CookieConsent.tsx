import { useState, useEffect } from "react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functionality: boolean;
}

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFn;
  }
}

const CONSENT_KEY = "c24_cookie_consent";
const CONSENT_VERSION = "1";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function updateGoogleConsent(consent: ConsentState) {
  gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    functionality_storage: consent.functionality ? "granted" : "denied",
    personalization_storage: consent.functionality ? "granted" : "denied",
  });
}

function saveConsent(consent: ConsentState) {
  const data = {
    ...consent,
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
}

function loadConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== CONSENT_VERSION) return null;
    return {
      analytics: data.analytics,
      marketing: data.marketing,
      functionality: data.functionality,
    };
  } catch {
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cookie Consent Banner
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false,
    functionality: false,
  });

  // On mount: check if consent was already given
  useEffect(() => {
    const saved = loadConsent();
    if (saved) {
      setConsent(saved);
      updateGoogleConsent(saved);
    } else {
      // Small delay so page renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom event to reopen banner
  useEffect(() => {
    const handler = () => {
      setVisible(true);
      setShowDetails(true);
      const saved = loadConsent();
      if (saved) setConsent(saved);
    };
    window.addEventListener("open-cookie-settings", handler);
    return () => window.removeEventListener("open-cookie-settings", handler);
  }, []);

  const handleAcceptAll = () => {
    const all: ConsentState = {
      analytics: true,
      marketing: true,
      functionality: true,
    };
    setConsent(all);
    saveConsent(all);
    updateGoogleConsent(all);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const none: ConsentState = {
      analytics: false,
      marketing: false,
      functionality: false,
    };
    setConsent(none);
    saveConsent(none);
    updateGoogleConsent(none);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
    updateGoogleConsent(consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Banner */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl shrink-0">🍪</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Szanujemy Twoją prywatność
              </h3>
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Używamy plików cookies, aby analizować ruch na stronie i
                ulepszać nasze usługi. Możesz wybrać, na które kategorie
                wyrażasz zgodę.
              </p>
            </div>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            {showDetails ? "Ukryj szczegóły" : "Dostosuj preferencje"}
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {/* Detail categories */}
          {showDetails && (
            <div className="mt-4 space-y-3">
              {/* Necessary — always on */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Niezbędne
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Wymagane do działania strony. Nie można wyłączyć.
                  </p>
                </div>
                <div className="relative">
                  <div className="w-11 h-6 bg-brand-600 rounded-full opacity-60 cursor-not-allowed" />
                  <div className="absolute top-0.5 left-[22px] w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Analityczne
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Google Analytics — pomagają zrozumieć, jak korzystasz ze
                    strony.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={consent.analytics}
                  onClick={() =>
                    setConsent((c) => ({ ...c, analytics: !c.analytics }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    consent.analytics
                      ? "bg-brand-600"
                      : "bg-gray-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      consent.analytics
                        ? "translate-x-[22px]"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Marketingowe
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Reklamy — pozwalają wyświetlać trafniejsze reklamy.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={consent.marketing}
                  onClick={() =>
                    setConsent((c) => ({ ...c, marketing: !c.marketing }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    consent.marketing
                      ? "bg-brand-600"
                      : "bg-gray-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      consent.marketing
                        ? "translate-x-[22px]"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              {/* Functionality */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Funkcjonalne
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Zapamiętywanie preferencji i ustawień strony.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={consent.functionality}
                  onClick={() =>
                    setConsent((c) => ({
                      ...c,
                      functionality: !c.functionality,
                    }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    consent.functionality
                      ? "bg-brand-600"
                      : "bg-gray-300 dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      consent.functionality
                        ? "translate-x-[22px]"
                        : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="p-4 sm:px-6 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleRejectAll}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Odrzuć wszystkie
          </button>
          {showDetails && (
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Zapisz wybrane
            </button>
          )}
          <button
            onClick={handleAcceptAll}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
          >
            Akceptuję wszystkie
          </button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Footer button — export for use in Footer component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function CookieSettingsButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}
      className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
    >
      🍪 Ustawienia cookies
    </button>
  );
}
