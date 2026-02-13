import { useState, useEffect, useCallback, useRef } from "react";
import { CookieSettingsButton } from "./CookieConsent";
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔑 Browser fingerprint (simple but effective)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getFingerprint(): string {
  const stored = localStorage.getItem("c24_fp");
  if (stored) return stored;

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || "",
    new Date().getTimezoneOffset(),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const fp = "fp_" + Math.abs(hash).toString(36) + Date.now().toString(36);
  localStorage.setItem("c24_fp", fp);
  return fp;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔗 API config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const API_BASE = import.meta.env.VITE_API_URL || "/api";
const SMART_COPY_URL = "https://smart-copy.ai";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌓 Dark mode hook
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("c24_theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("c24_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("c24_theme", "light");
    }
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📐 SVG Icons
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Icons = {
  sun: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  moon: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  ),
  sparkles: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
      />
    </svg>
  ),
  copy: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
      />
    </svg>
  ),
  check: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  ),
  lock: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  ),
  chevDown: (
    <svg
      className="w-4 h-4"
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
  ),
  x: (
    <svg
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  ),
  arrowRight: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  ),
  rocket: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
      />
    </svg>
  ),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Length options
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface LengthOption {
  value: number;
  label: string;
  free: boolean;
}

const LENGTH_OPTIONS: LengthOption[] = [
  { value: 1000, label: "1 000-2 000 znaków — krótki tekst", free: true },
  { value: 2000, label: "2 000-3 000 znaków — średni tekst", free: true },
  { value: 3000, label: "3 000-5 000 znaków — rozbudowany tekst", free: true },
  { value: 5000, label: "5 000 znaków", free: false },
  { value: 10000, label: "10 000 znaków", free: false },
  { value: 20000, label: "20 000 znaków", free: false },
  { value: 50000, label: "50 000 znaków — ponad 50 stron", free: false },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏠 HEADER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Header({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-gray-200/60 dark:border-slate-700/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Copywriting24.pl — strona główna"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 dark:text-white text-sm leading-tight tracking-tight">
              Copywriting
              <span className="text-brand-600 dark:text-brand-400">24</span>.pl
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              Darmowy generator tekstów AI
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
            aria-label={dark ? "Tryb jasny" : "Tryb ciemny"}
          >
            {dark ? Icons.sun : Icons.moon}
          </button>

          <a
            href={SMART_COPY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-brand-700 hover:to-violet-700 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all"
          >
            {Icons.rocket}
            <span>Smart-Copy.ai</span>
          </a>
        </div>
      </div>
    </header>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✍️ GENERATOR COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Generator() {
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState(2000);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [streamText, setStreamText] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Check remaining on mount
  useEffect(() => {
    const fp = getFingerprint();
    fetch(`${API_BASE}/limit-status?fingerprint=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then((data) => setRemaining(data.remaining))
      .catch(() => setRemaining(3));
  }, []);

  const addKeyword = useCallback(() => {
    const kw = keywordInput.trim();
    if (kw && keywords.length < 5 && !keywords.includes(kw)) {
      setKeywords((prev) => [...prev, kw]);
      setKeywordInput("");
    }
  }, [keywordInput, keywords]);

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Podaj temat tekstu");
      return;
    }
    if (remaining !== null && remaining <= 0) {
      setError("Wykorzystano dzienny limit. Wypróbuj Smart-Copy.ai!");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setStreamText("");

    try {
      const fp = getFingerprint();

      // Use streaming endpoint
      const response = await fetch(`${API_BASE}/generate/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          length,
          keywords,
          fingerprint: fp,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 429) {
          setRemaining(0);
          setError(
            "Wykorzystano dzienny limit generacji. Wypróbuj Smart-Copy.ai, aby generować bez limitów!",
          );
          setLoading(false);
          return;
        }
        throw new Error(errData.error || "Błąd serwera");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.done) {
                  setRemaining(data.remaining);
                } else if (data.text) {
                  accumulated += data.text;
                  setStreamText(accumulated);
                } else if (data.error) {
                  setError(data.error);
                }
              } catch {
                // skip invalid JSON
              }
            }
          }
        }
      }

      setResult(accumulated);

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);
    } catch (err: any) {
      // Fallback: try non-streaming endpoint
      try {
        const fp = getFingerprint();
        const res = await fetch(`${API_BASE}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: topic.trim(),
            length,
            keywords,
            fingerprint: fp,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setResult(data.result);
          setRemaining(data.remaining);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 200);
        } else {
          setError(data.error || "Błąd generowania");
        }
      } catch {
        setError(
          err.message || "Błąd połączenia z serwerem. Spróbuj ponownie.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = result || streamText;
    // Copy as plain text (strip HTML tags)
    const plainText = textToCopy.replace(/<[^>]*>/g, "");
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyHtml = async () => {
    const htmlToCopy = result || streamText;
    await navigator.clipboard.writeText(htmlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayedText = (result || streamText)
    .replace(/^```html?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  return (
    <section id="generator" className="relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-white dark:from-brand-950/30 dark:via-slate-950 dark:to-slate-950 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-brand-400/10 to-transparent dark:from-brand-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
            Darmowy Generator{" "}
            <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
              Tekstów AI
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-200 max-w-xl mx-auto">
            Generuj profesjonalne artykuły, opisy i treści SEO za darmo.
            Wystarczy temat — sztuczna inteligencja napisze resztę.
          </p>
        </div>

        {/* Generator Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
          {/* Remaining counter / Exhausted banner */}
          {remaining !== null && remaining <= 0 ? (
            <div className="px-5 py-6 bg-gradient-to-br from-brand-600 via-violet-600 to-purple-700 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-amber-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="text-sm font-semibold text-white/90">
                    Dzienny limit wyczerpany
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-1.5">
                  Odblokuj nielimitowane generowanie tekstów
                </h3>
                <p className="text-sm text-white/80 mb-4 max-w-md">
                  Smart-Copy.ai — teksty do 50+ stron, model Claude Sonnet,
                  research online, 8 języków. Bez dziennych limitów.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={SMART_COPY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 shadow-xl transition-all text-sm"
                  >
                    {Icons.rocket}
                    Przejdź do Smart-Copy.ai
                    {Icons.arrowRight}
                  </a>
                  <div className="flex items-center gap-2 text-white/60 text-xs sm:ml-2">
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Nowy limit jutro o północy</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Darmowe generacje dziś
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${remaining !== null && i < 3 - remaining ? "bg-gray-300 dark:bg-slate-600" : "bg-emerald-500"}`}
                  />
                ))}
                <span className="ml-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {remaining !== null ? remaining : "..."}/3
                </span>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-5">
            {/* Topic input */}
            <div>
              <label
                htmlFor="topic"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Temat tekstu
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="np. Jak wybrać najlepszy hosting dla sklepu internetowego..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none text-[15px]"
              />
              <div className="text-xs text-gray-400 text-right mt-1">
                {topic.length}/500
              </div>
            </div>

            {/* Length selector */}
            <div>
              <label
                htmlFor="length"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Długość tekstu
              </label>
              <div className="relative">
                <select
                  id="length"
                  value={length}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if ([1000, 2000, 3000].includes(val)) setLength(val);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none appearance-none pr-10 text-[15px]"
                >
                  {LENGTH_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={!opt.free}
                    >
                      {opt.free ? "✓ " : "🔒 "}
                      {opt.label}
                      {!opt.free ? " — Smart-Copy.ai" : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  {Icons.chevDown}
                </div>
              </div>
            </div>

            {/* SEO section toggle */}
            <div>
              <button
                onClick={() => setShowSeo(!showSeo)}
                className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showSeo ? "rotate-180" : ""}`}
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
                Optymalizacja SEO — frazy kluczowe (opcjonalnie)
              </button>

              {showSeo && (
                <div className="mt-3 p-4 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/40">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    Dodaj frazy kluczowe, które AI uwzględni w tekście (max 5
                    fraz).
                  </p>

                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      placeholder="np. hosting dla sklepu"
                      maxLength={60}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={addKeyword}
                      disabled={keywords.length >= 5}
                      className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Dodaj
                    </button>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {keywords.map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-sm"
                        >
                          {kw}
                          <button
                            onClick={() => removeKeyword(kw)}
                            className="hover:text-red-500 transition-colors"
                          >
                            {Icons.x}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm">
                {error}
                {remaining === 0 && (
                  <a
                    href={SMART_COPY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 font-semibold underline hover:text-red-800 dark:hover:text-red-200"
                  >
                    Przejdź do Smart-Copy.ai →
                  </a>
                )}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={
                loading ||
                !topic.trim() ||
                (remaining !== null && remaining <= 0)
              }
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold text-base hover:from-brand-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2.5"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Generuję tekst...</span>
                </>
              ) : (
                <>
                  {Icons.sparkles}
                  <span>Wygeneruj tekst za darmo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ━━━ RESULT ━━━ */}
        {displayedText && (
          <div ref={resultRef} className="mt-8">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/80 dark:border-slate-700/80 overflow-hidden">
              {/* Result header */}
              <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                  {Icons.check}
                  <span>
                    {loading
                      ? "Generowanie..."
                      : `Gotowe — ${displayedText.replace(/<[^>]*>/g, "").length} znaków`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                  >
                    {copied ? Icons.check : Icons.copy}
                    <span>{copied ? "Skopiowano!" : "Kopiuj tekst"}</span>
                  </button>
                  <button
                    onClick={copyHtml}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                  >
                    {Icons.copy}
                    <span>HTML</span>
                  </button>
                </div>
              </div>

              {/* Result content */}
              <div className="p-5 sm:p-6">
                <div
                  className="generated-html"
                  dangerouslySetInnerHTML={{ __html: displayedText }}
                />
              </div>
            </div>

            {/* Smart-Copy.ai upsell after result */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 dark:from-brand-950/30 dark:to-violet-950/30 border border-brand-200/60 dark:border-brand-800/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    Potrzebujesz dłuższych, jeszcze lepszych tekstów?
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    W Smart-Copy.ai generujesz teksty nawet ponad 50 stron, z
                    wbudowanym researchem online, w 8 językach i z modelem
                    Claude Sonnet — jeszcze wyższa jakość.
                  </p>
                </div>
                <a
                  href={SMART_COPY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-brand-700 hover:to-violet-700 shadow-lg shadow-brand-500/25"
                >
                  Wypróbuj Smart-Copy.ai
                  {Icons.arrowRight}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 COMPARISON TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ComparisonSection() {
  const features = [
    { name: "Cena", free: "Za darmo", pro: "Od 3,99 PLN/1000 zn." },
    {
      name: "Długość tekstu",
      free: "Do 3 000 znaków",
      pro: "Do 300 000+ znaków",
    },
    { name: "Generacje dziennie", free: "3 teksty", pro: "Bez limitu" },
    { name: "Model AI", free: "Claude Haiku 4.5", pro: "Claude Sonnet 4.5" },
    { name: "Research online", free: "—", pro: "Automatyczny" },
    { name: "Języki", free: "Polski", pro: "8 języków" },
    { name: "SEO — frazy kluczowe", free: "Tak", pro: "Tak + linkowanie" },
    { name: "Własne źródła", free: "—", pro: "URL-e i pliki" },
    { name: "Tabele i listy", free: "Ograniczone", pro: "Rozbudowane" },
    { name: "Historia generacji", free: "—", pro: "Panel użytkownika" },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-900/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-3">
          Darmowy generator vs{" "}
          <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
            Smart-Copy.ai
          </span>
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
          Copywriting24.pl to świetny start. Gdy potrzebujesz więcej —
          Smart-Copy.ai daje Ci pełną moc AI do tworzenia treści.
        </p>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/80">
                <th className="px-4 sm:px-6 py-4 text-left font-semibold text-gray-700 dark:text-gray-300">
                  Funkcja
                </th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                  <span className="text-brand-600 dark:text-brand-400">
                    Copywriting24
                  </span>
                  <br />
                  <span className="text-xs font-normal text-gray-500">
                    Za darmo
                  </span>
                </th>
                <th className="px-4 sm:px-6 py-4 text-center font-semibold text-gray-700 dark:text-gray-300">
                  <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">
                    Smart-Copy.ai
                  </span>
                  <br />
                  <span className="text-xs font-normal text-gray-500">
                    Premium
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr
                  key={f.name}
                  className={`border-t border-gray-100 dark:border-slate-700/50 ${
                    i % 2 === 0
                      ? "bg-white dark:bg-slate-900"
                      : "bg-gray-50/50 dark:bg-slate-800/20"
                  }`}
                >
                  <td className="px-4 sm:px-6 py-3.5 font-medium text-gray-800 dark:text-gray-200">
                    {f.name}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 text-center text-gray-600 dark:text-gray-400">
                    {f.free}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 text-center font-medium text-brand-700 dark:text-brand-300">
                    {f.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <a
            href={SMART_COPY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold rounded-xl hover:from-brand-700 hover:to-violet-700 shadow-lg shadow-brand-500/25 transition-all"
          >
            Wypróbuj Smart-Copy.ai
            {Icons.arrowRight}
          </a>
        </div>
      </div>
    </section>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 SEO CONTENT SECTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SeoContent() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* How it works */}
        <div className="mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Jak działa darmowy kreator treści AI?
          </h2>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Podaj temat",
                desc: "Wpisz temat artykułu, opis produktu lub dowolną treść, którą chcesz wygenerować. Im bardziej szczegółowy prompt, tym lepszy wynik.",
              },
              {
                step: "2",
                title: "Ustaw parametry",
                desc: "Wybierz długość tekstu i opcjonalnie dodaj frazy kluczowe SEO, które AI naturalnie wplecie w treść.",
              },
              {
                step: "3",
                title: "Gotowe!",
                desc: "Sztuczna inteligencja generuje unikalny, profesjonalny tekst w kilka sekund. Kopiuj i używaj gdziekolwiek.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/25">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Article */}
        <article className="prose-section space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Darmowy generator tekstów AI — twórz profesjonalne treści bez
              opłat
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Copywriting24.pl to bezpłatne narzędzie do generowania tekstów z
              wykorzystaniem sztucznej inteligencji. Nasz darmowy kreator treści
              AI umożliwia szybkie tworzenie artykułów, opisów produktów, postów
              na bloga, treści na strony internetowe i materiałów marketingowych
              — całkowicie za darmo, bez konieczności rejestracji. Generator
              wykorzystuje zaawansowany model językowy Claude, który tworzy
              spójne, merytoryczne i unikalne teksty w języku polskim.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Dla kogo jest bezpłatny generator treści AI?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Nasze bezpłatne narzędzie do copywritingu AI doskonale sprawdzi
              się zarówno dla freelancerów, właścicieli małych firm, blogerów,
              jak i specjalistów SEO szukających szybkiego sposobu na tworzenie
              treści. Darmowy generator artykułów AI po polsku pozwala
              zaoszczędzić godziny pracy nad tekstami, oferując profesjonalną
              jakość w kilka sekund. Niezależnie od tego, czy potrzebujesz opisu
              usługi, tekstu na landing page, czy artykułu informacyjnego — AI
              copywriter online zrobi to za Ciebie.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Automatyczne pisanie tekstów z optymalizacją SEO
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Generator treści online oferuje wbudowaną optymalizację SEO.
              Możesz dodać frazy kluczowe, które sztuczna inteligencja
              naturalnie uwzględni w treści — w nagłówkach, akapitach i
              podsumowaniu. Dzięki temu wygenerowane teksty są od razu gotowe do
              publikacji na stronie internetowej i mogą wspierać Twoje
              pozycjonowanie w wyszukiwarkach. To idealne narzędzie do
              automatycznego pisania tekstów zoptymalizowanych pod kątem SEO.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Potrzebujesz więcej? Poznaj Smart-Copy.ai
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              Copywriting24.pl oferuje darmowy generator tekstów z limitem do
              3000 znaków i 3 generacji dziennie. Jeśli potrzebujesz więcej —
              profesjonalna platforma{" "}
              <a
                href={SMART_COPY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
              >
                Smart-Copy.ai
              </a>{" "}
              oferuje znacznie większe możliwości:
            </p>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              {[
                "Teksty nawet ponad 50 stron (300 000+ znaków)",
                "Zaawansowany model Claude Sonnet — wyższa jakość i spójność",
                "Wbudowany automatyczny research online dla każdego tematu",
                "Obsługa 8 języków (polski, angielski, niemiecki, hiszpański, francuski, włoski, ukraiński, rosyjski)",
                "Pełna optymalizacja SEO z frazami kluczowymi i linkowaniem",
                "Możliwość dodawania własnych źródeł (URL-e i pliki)",
                "Generowanie wielu tekstów jednocześnie",
                "Panel użytkownika z historią zamówień",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm leading-relaxed"
                >
                  <svg
                    className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❓ FAQ SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Czy generator tekstów AI jest naprawdę darmowy?",
      a: "Tak! Copywriting24.pl oferuje całkowicie darmowy generator tekstów AI. Możesz wygenerować do 3 tekstów dziennie o długości do 3000 znaków — bez rejestracji, bez podawania danych osobowych i bez żadnych opłat. Limit resetuje się każdego dnia o północy.",
    },
    {
      q: "Jak działa sztuczna inteligencja w generatorze treści?",
      a: "Nasz darmowy kreator tekstów wykorzystuje zaawansowany model językowy Claude firmy Anthropic. AI analizuje podany temat i frazy kluczowe, a następnie generuje unikalny, spójny tekst w formacie HTML z nagłówkami, akapitami, listami i tabelami. Każdy wygenerowany tekst jest oryginalny.",
    },
    {
      q: "Czy mogę używać wygenerowanych tekstów komercyjnie?",
      a: "Tak, wygenerowane teksty możesz wykorzystywać dowolnie — na strony internetowe, blogi, sklepy internetowe, opisy produktów, social media i inne cele komercyjne. Teksty są unikalne i nie podlegają ograniczeniom licencyjnym.",
    },
    {
      q: "Jak generować teksty dłuższe niż 3000 znaków?",
      a: "Dłuższe teksty (do 300 000+ znaków, czyli ponad 50 stron) możesz generować w Smart-Copy.ai — profesjonalnej platformie z zaawansowanym modelem AI Claude Sonnet, automatycznym researchem online, obsługą 8 języków i pełną optymalizacją SEO.",
    },
    {
      q: "Czym się różni Copywriting24 od Smart-Copy.ai?",
      a: "Copywriting24.pl to darmowy, prosty generator z limitem 3 tekstów/dzień do 3000 znaków, korzystający z modelu Claude Haiku. Smart-Copy.ai to profesjonalna platforma bez limitów ilościowych, z modelem Claude Sonnet (wyższa jakość), automatycznym researchem online, 8 językami, własnym źródłami URL/pliki i zaawansowaną optymalizacją SEO.",
    },
    {
      q: "Czy muszę się rejestrować, żeby korzystać z generatora?",
      a: "Nie! Generator tekstów AI na Copywriting24.pl nie wymaga rejestracji ani logowania. Po prostu wejdź na stronę, wpisz temat i kliknij 'Wygeneruj'. To natychmiastowy dostęp do darmowego copywritingu AI.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-900/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
          Najczęściej zadawane pytania
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
              >
                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  {faq.q}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
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
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 FINAL CTA SECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FinalCta() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Potrzebujesz więcej niż 3000 znaków?
            </h2>
            <p className="text-brand-100 text-base sm:text-lg mb-8 max-w-lg mx-auto">
              Smart-Copy.ai to profesjonalny generator AI dla wymagających.
              Teksty do 50 stron, 8 języków, research online i model Claude
              Sonnet.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={SMART_COPY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 shadow-xl transition-all"
              >
                {Icons.rocket}
                Wypróbuj Smart-Copy.ai
              </a>
              <a
                href="#generator"
                className="inline-flex items-center gap-2 px-6 py-3 text-white/90 font-medium hover:text-white border border-white/30 rounded-xl hover:border-white/50 transition-all"
              >
                Lub wygeneruj za darmo ↑
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏁 FOOTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Copywriting24.pl — Darmowy generator
              tekstów AI
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Powered by{" "}
              <a
                href="https://anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Claude AI
              </a>{" "}
              ・ Profesjonalna wersja:{" "}
              <a
                href={SMART_COPY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
              >
                Smart-Copy.ai
              </a>
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <a
              href="/polityka-prywatnosci"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              Polityka prywatności
            </a>
            <span>・</span>
            <CookieSettingsButton />
          </div>
        </div>

        {/* SEO footer text */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <p className="text-xs text-gray-400 dark:text-gray-600 leading-relaxed text-center">
            Copywriting24.pl — darmowy generator tekstów AI, bezpłatne narzędzie
            do copywritingu online, kreator treści AI po polsku. Generuj
            artykuły, opisy produktów, teksty SEO i treści marketingowe za darmo
            z wykorzystaniem sztucznej inteligencji. Automatyczne pisanie
            tekstów z optymalizacją pod wyszukiwarki.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const { dark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen flex flex-col">
      <Header dark={dark} toggle={toggle} />

      <main className="flex-1">
        <Generator />
        <ComparisonSection />
        <SeoContent />
        <FAQ />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}
