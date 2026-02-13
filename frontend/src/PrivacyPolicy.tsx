import { useEffect } from "react";
import { CookieSettingsButton } from "./CookieConsent";

export default function PrivacyPolicy() {
  useEffect(() => {
    // Set noindex dynamically
    let meta = document.querySelector('meta[name="robots"]');
    const original = meta?.getAttribute("content") || "";
    if (meta) {
      meta.setAttribute("content", "noindex, nofollow");
    } else {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      meta.setAttribute("content", "noindex, nofollow");
      document.head.appendChild(meta);
    }
    document.title = "Polityka Prywatności | Copywriting24.pl";

    return () => {
      if (meta) meta.setAttribute("content", original);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <a
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Powrót na stronę główną"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-sm">
              Copywriting
              <span className="text-brand-600 dark:text-brand-400">24</span>.pl
            </span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Polityka Prywatności
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-10">
          Ostatnia aktualizacja: 13 lutego 2026
        </p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              1. Administrator danych
            </h2>
            <p>
              Administratorem serwisu Copywriting24.pl jest Karol Leszczyński,
              prowadzący działalność pod adresem e-mail:{" "}
              <a
                href="mailto:kontakt@copywriting24.pl"
                className="text-brand-600 dark:text-brand-400 hover:underline"
              >
                kontakt@copywriting24.pl
              </a>
              . Administrator odpowiada za przetwarzanie danych osobowych
              zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE)
              2016/679 (RODO).
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              2. Zakres zbieranych danych
            </h2>
            <p>
              Serwis Copywriting24.pl nie wymaga rejestracji ani logowania. Nie
              zbieramy imion, nazwisk, adresów e-mail ani żadnych danych
              umożliwiających bezpośrednią identyfikację użytkownika. W ramach
              działania serwisu przetwarzane są wyłącznie:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                <strong>Adres IP</strong> — przetwarzany automatycznie przez
                serwer w celu obsługi połączenia; wykorzystywany do limitowania
                liczby generacji (max 3/dzień).
              </li>
              <li>
                <strong>Identyfikator przeglądarki (fingerprint)</strong> —
                anonimowy hash generowany lokalnie w przeglądarce, zapisywany w
                localStorage pod kluczem <code>c24_fp</code>. Służy wyłącznie do
                egzekwowania dziennego limitu generacji.
              </li>
              <li>
                <strong>Dane techniczne</strong> — typ przeglądarki, system
                operacyjny, rozdzielczość ekranu — zbierane anonimowo przez
                Google Analytics wyłącznie po wyrażeniu zgody.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              3. Cele przetwarzania danych
            </h2>
            <p>Dane przetwarzane są w następujących celach:</p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                <strong>Świadczenie usługi</strong> — generowanie tekstów AI,
                obsługa zapytań HTTP (podstawa prawna: art. 6 ust. 1 lit. b RODO
                — wykonanie umowy/usługi).
              </li>
              <li>
                <strong>Egzekwowanie limitów</strong> — ograniczenie do 3
                bezpłatnych generacji dziennie na użytkownika (podstawa prawna:
                art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes
                administratora).
              </li>
              <li>
                <strong>Analityka</strong> — analiza ruchu i zachowań na stronie
                za pomocą Google Analytics 4, wyłącznie po wyrażeniu zgody
                (podstawa prawna: art. 6 ust. 1 lit. a RODO — zgoda).
              </li>
              <li>
                <strong>Bezpieczeństwo</strong> — ochrona przed nadużyciami i
                zapewnienie stabilności serwisu (podstawa prawna: art. 6 ust. 1
                lit. f RODO).
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              4. Pliki cookies i technologie śledzące
            </h2>
            <p>
              Serwis wykorzystuje następujące pliki cookies i mechanizmy
              przechowywania lokalnego:
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                      Nazwa
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                      Typ
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                      Cel
                    </th>
                    <th className="px-4 py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                      Czas
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-4 py-2">
                      <code>c24_cookie_consent</code>
                    </td>
                    <td className="px-4 py-2">localStorage</td>
                    <td className="px-4 py-2">
                      Zapamiętanie wyborów dotyczących cookies
                    </td>
                    <td className="px-4 py-2">Bezterminowo</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">
                      <code>c24_fp</code>
                    </td>
                    <td className="px-4 py-2">localStorage</td>
                    <td className="px-4 py-2">
                      Anonimowy identyfikator do limitu generacji
                    </td>
                    <td className="px-4 py-2">Bezterminowo</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">
                      <code>c24_theme</code>
                    </td>
                    <td className="px-4 py-2">localStorage</td>
                    <td className="px-4 py-2">
                      Preferencja trybu ciemnego/jasnego
                    </td>
                    <td className="px-4 py-2">Bezterminowo</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">
                      <code>_ga</code>, <code>_ga_*</code>
                    </td>
                    <td className="px-4 py-2">Cookie</td>
                    <td className="px-4 py-2">
                      Google Analytics 4 — analityka ruchu
                    </td>
                    <td className="px-4 py-2">Do 2 lat</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">
                      <code>_gcl_*</code>
                    </td>
                    <td className="px-4 py-2">Cookie</td>
                    <td className="px-4 py-2">
                      Google Ads — śledzenie konwersji (marketing)
                    </td>
                    <td className="px-4 py-2">Do 90 dni</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Cookies analityczne i marketingowe (Google) są ustawiane{" "}
              <strong>wyłącznie po wyrażeniu zgody</strong> przez użytkownika za
              pomocą banera cookie. Implementujemy Google Consent Mode v2 — do
              czasu wyrażenia zgody dane nie są zbierane, a tagi Google Tag
              Manager pozostają zablokowane.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              5. Google Tag Manager i Google Analytics
            </h2>
            <p>
              Serwis korzysta z Google Tag Manager (kontener GTM-NPRG2RRG) do
              zarządzania tagami śledzącymi oraz Google Analytics 4
              (identyfikator: G-6J5WE4CKH3) do analizy ruchu.
            </p>
            <p className="mt-2">
              Zastosowany mechanizm Google Consent Mode v2 zapewnia, że:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>
                Domyślnie wszystkie zgody są ustawione na <code>denied</code>.
              </li>
              <li>
                Tagi analityczne i reklamowe uruchamiają się dopiero po
                wyrażeniu zgody.
              </li>
              <li>
                Włączona jest redakcja danych reklamowych (
                <code>ads_data_redaction</code>).
              </li>
              <li>
                Adresy URL są przekazywane anonimowo (
                <code>url_passthrough</code>) w celu zachowania atrybucji bez
                cookies.
              </li>
            </ul>
            <p className="mt-2">
              Więcej informacji o przetwarzaniu danych przez Google:{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline"
              >
                Polityka prywatności Google
              </a>
              .
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              6. Przetwarzanie treści przez AI
            </h2>
            <p>
              Tematy i frazy kluczowe wprowadzone przez użytkownika są
              przesyłane do API Anthropic (model Claude) w celu wygenerowania
              tekstu. Anthropic przetwarza dane zgodnie ze swoją{" "}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline"
              >
                polityką prywatności
              </a>
              . Przesyłane zapytania nie zawierają danych osobowych użytkownika
              — jedynie treść tematu i opcjonalne słowa kluczowe.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              7. Infrastruktura i hosting
            </h2>
            <p>
              Serwis jest hostowany na serwerach Amazon Web Services (AWS) w
              regionie eu-central-1 (Frankfurt, Niemcy), w ramach Europejskiego
              Obszaru Gospodarczego. AWS zapewnia odpowiedni poziom ochrony
              danych zgodnie z wymogami RODO.
            </p>
            <p className="mt-2">
              Dane techniczne (logi serwera, adresy IP) są przechowywane na
              serwerze przez okres niezbędny do zapewnienia bezpieczeństwa i
              diagnostyki (maksymalnie 30 dni), a następnie automatycznie
              usuwane.
            </p>
            <p className="mt-2">
              Baza danych PostgreSQL przechowująca informacje o generacjach (bez
              danych osobowych) znajduje się na tym samym serwerze AWS w
              regionie Frankfurt.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              8. Przekazywanie danych do państw trzecich
            </h2>
            <p>
              Dane mogą być przekazywane do podmiotów w Stanach Zjednoczonych w
              zakresie korzystania z usług Google (Analytics, Tag Manager) oraz
              Anthropic (API Claude). Przekazywanie odbywa się na podstawie
              standardowych klauzul umownych (SCC) zatwierdzonych przez Komisję
              Europejską oraz EU-U.S. Data Privacy Framework, zapewniających
              odpowiedni poziom ochrony danych.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              9. Prawa użytkownika
            </h2>
            <p>Zgodnie z RODO, każdy użytkownik ma prawo do:</p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5">
              <li>
                <strong>Dostępu</strong> — uzyskania informacji o przetwarzanych
                danych.
              </li>
              <li>
                <strong>Sprostowania</strong> — poprawienia nieprawidłowych
                danych.
              </li>
              <li>
                <strong>Usunięcia</strong> — żądania usunięcia danych („prawo do
                bycia zapomnianym").
              </li>
              <li>
                <strong>Ograniczenia przetwarzania</strong> — żądania
                ograniczenia zakresu przetwarzania.
              </li>
              <li>
                <strong>Przenoszenia danych</strong> — otrzymania danych w
                ustrukturyzowanym formacie.
              </li>
              <li>
                <strong>Sprzeciwu</strong> — wniesienia sprzeciwu wobec
                przetwarzania opartego na prawnie uzasadnionym interesie.
              </li>
              <li>
                <strong>Cofnięcia zgody</strong> — w dowolnym momencie, bez
                wpływu na legalność przetwarzania przed cofnięciem.
              </li>
            </ul>
            <p className="mt-3">
              W celu realizacji powyższych praw prosimy o kontakt na adres:{" "}
              <a
                href="mailto:kontakt@copywriting24.pl"
                className="text-brand-600 dark:text-brand-400 hover:underline"
              >
                kontakt@copywriting24.pl
              </a>
              .
            </p>
            <p className="mt-2">
              Użytkownik ma również prawo złożyć skargę do organu nadzorczego —
              Prezesa Urzędu Ochrony Danych Osobowych (UODO), ul. Stawki 2,
              00-193 Warszawa,{" "}
              <a
                href="https://uodo.gov.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 dark:text-brand-400 hover:underline"
              >
                uodo.gov.pl
              </a>
              .
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              10. Zarządzanie zgodami na cookies
            </h2>
            <p>
              Użytkownik może w dowolnym momencie zmienić lub wycofać swoje
              zgody dotyczące plików cookies, klikając przycisk poniżej lub link
              „Ustawienia cookies" w stopce strony.
            </p>
            <div className="mt-4">
              <CookieSettingsButton />
            </div>
            <p className="mt-4">
              Dodatkowo użytkownik może zarządzać cookies bezpośrednio w
              ustawieniach swojej przeglądarki — blokować, usuwać lub ograniczać
              ich zapisywanie. Należy pamiętać, że wyłączenie niezbędnych
              cookies może wpłynąć na poprawne działanie serwisu.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              11. Zmiany w polityce prywatności
            </h2>
            <p>
              Administrator zastrzega sobie prawo do wprowadzania zmian w
              niniejszej Polityce Prywatności. O istotnych zmianach użytkownicy
              zostaną poinformowani poprzez komunikat na stronie. Data ostatniej
              aktualizacji jest widoczna na górze dokumentu.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              12. Kontakt
            </h2>
            <p>
              W sprawach dotyczących ochrony danych osobowych i prywatności
              prosimy o kontakt:
            </p>
            <p className="mt-2">
              E-mail:{" "}
              <a
                href="mailto:kontakt@copywriting24.pl"
                className="text-brand-600 dark:text-brand-400 hover:underline"
              >
                kontakt@copywriting24.pl
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Copywriting24.pl
          </p>
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              Wróć do generatora
            </a>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <CookieSettingsButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
