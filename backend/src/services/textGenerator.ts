import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = "claude-haiku-4-5-20251001";

// Haiku 4.5 pricing (per 1M tokens)
const PRICE_INPUT = 0.8; // $0.80 / 1M input tokens
const PRICE_OUTPUT = 4.0; // $4.00 / 1M output tokens

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 Result type with metrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export interface GenerationMetrics {
  result: string;
  resultLength: number;
  plainLength: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  stopReason: string;
  promptLength: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📐 Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function calculateStructure(targetChars: number) {
  const words = Math.round(targetChars / 6.5);
  const paragraphs = Math.max(3, Math.round(words / 80));
  const sections = targetChars <= 1200 ? 2 : targetChars <= 2200 ? 3 : 4;
  return { words, paragraphs, sections };
}

function calculateMaxTokens(targetLength: number): number {
  // Polish text: ~3-4 chars per token. Be GENEROUS to never cut off.
  const baseTokens = Math.ceil(targetLength / 3);
  const withMargin = Math.ceil(baseTokens * 2.5);
  return Math.max(1000, Math.min(8192, withMargin));
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICE_INPUT + outputTokens * PRICE_OUTPUT) / 1_000_000;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 SEO instructions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildSeoInstructions(keywords: string[]): string {
  if (!keywords || keywords.length === 0) return "";
  return `
OPTYMALIZACJA SEO — FRAZY KLUCZOWE:
${keywords.map((kw, i) => `  ${i + 1}. "${kw}"`).join("\n")}

Zasady SEO:
- Fraza główna ("${keywords[0]}") MUSI wystąpić w <h1> i 2-3× w tekście
- Pozostałe frazy rozmieść naturalnie w <h2>, <h3> lub <p>
- Używaj odmian gramatycznych i synonimów
- ZAKAZ keyword stuffingu — tekst musi brzmieć naturalnie`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📏 Length examples
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getLengthExample(targetLength: number): string {
  if (targetLength <= 1200) {
    return `
WZORZEC DŁUGOŚCI (~1000 znaków) — Twój tekst musi mieć PODOBNĄ długość do poniższego:
═══════════════════════════════════════════════════════════════
<h1>Czym jest copywriting? Podstawy sztuki pisania tekstów</h1>
<p>Copywriting to sztuka tworzenia tekstów, które mają na celu przekonanie czytelnika do podjęcia konkretnego działania. Może to być zakup produktu, zapisanie się na newsletter czy pobranie aplikacji. Dobry copywriter potrafi połączyć kreatywność z wiedzą o psychologii konsumenta, tworząc treści, które nie tylko informują, ale przede wszystkim inspirują i motywują do działania.</p>
<h2>Gdzie stosuje się copywriting?</h2>
<p>Copywriting znajduje zastosowanie w niemal każdej formie komunikacji marketingowej. Spotykamy go w reklamach internetowych, opisach produktów w sklepach online, treściach na stronach firmowych oraz w kampaniach e-mail marketingowych. Każdy tekst sprzedażowy, który widzisz na co dzień w internecie, został stworzony właśnie przez copywritera.</p>
<h2>Dlaczego warto inwestować w dobre teksty?</h2>
<p>Profesjonalnie napisane treści potrafią znacząco zwiększyć konwersję i sprzedaż. Badania pokazują, że dobrze napisany opis produktu może podnieść współczynnik konwersji nawet o kilkadziesiąt procent. Inwestycja w copywriting zwraca się wielokrotnie poprzez lepsze wyniki sprzedażowe i budowanie zaufania wśród klientów.</p>
═══════════════════════════════════════════════════════════════
Powyższy wzorzec ma ~1000 znaków. Napisz tekst O TAKIEJ SAMEJ DŁUGOŚCI na podany temat.
Struktura: <h1> + 2 sekcje <h2> + 3 akapity <p> po 3-4 zdania. KRÓTKO I ZWIĘŹLE.`;
  }

  if (targetLength <= 2200) {
    return `
WZORZEC DŁUGOŚCI (~2000 znaków) — Twój tekst musi mieć PODOBNĄ długość do poniższego:
═══════════════════════════════════════════════════════════════
<h1>Czym jest copywriting? Kompletny przewodnik po sztuce pisania tekstów sprzedażowych</h1>
<h2>Definicja i podstawowe pojęcia copywritingu</h2>
<p>Copywriting to sztuka i nauka pisania tekstów, które mają na celu przekonanie czytelnika do podjęcia konkretnego działania. Może to być zakup produktu, zapisanie się na newsletter, pobranie aplikacji lub jakikolwiek inny cel biznesowy. Copywriter to specjalista, który tworzy zawartość marketingową dostosowaną do konkretnej grupy docelowej, wykorzystując psychologię konsumenta i techniki persuazji. Tekst napisany przez dobrego copywritera nie tylko informuje, ale przede wszystkim inspiruje i motywuje do działania.</p>
<p>Różnica między copywritingiem a zwykłym pisaniem polega na intencji i efektywności. Podczas gdy artykuł prasowy ma na celu poinformowanie czytelnika, copy ma konkretny cel biznesowy. Copywriter musi rozumieć potrzeby swojej grupy docelowej, znać konkurencję i wiedzieć, jak wykorzystać emocje do zwiększenia konwersji. Każde słowo w copywritingu jest wybierane świadomie, aby maksymalizować wpływ na czytelnika.</p>
<p>Copywriting pojawia się wszędzie wokół nas: w reklamach telewizyjnych, banerach internetowych, e-mailach marketingowych, opisach produktów na stronach internetowych oraz w postach na mediach społecznościowych. To umiejętność, która jest niezwykle cenna w dzisiejszym cyfrowym świecie, gdzie konkurencja o uwagę konsumenta jest ogromna.</p>
<h2>Kluczowe elementy efektywnego copywritingu</h2>
<p>Efektywny copywriting opiera się na kilku fundamentalnych elementach, które muszą być obecne w każdym tekście. Po pierwsze, musi być jasny i zrozumiały dla grupy docelowej, bez zbędnych zawiłości i trudnych słów. Po drugie, powinien zawierać mocne nagłówki, które przyciągają uwagę i zachęcają do dalszego czytania. Po trzecie, tekst musi być zorientowany na korzyści dla czytelnika, a nie na cechy produktu. Wreszcie, każdy dobry copy powinien zawierać wyraźne wezwanie do działania, które mówi czytelnikowi dokładnie, co powinien zrobić.</p>
<p>Praktyczne zastosowania copywritingu są nieograniczone i znajdują się w każdej gałęzi biznesu. E-commerce wykorzystuje copywriting w opisach produktów, aby zwiększyć sprzedaż. Agencje reklamowe tworzą copy na potrzeby kampanii multimedialnych. Firmy technologiczne używają copywritingu do wyjaśniania złożonych funkcji swoich produktów w prosty sposób. Niezależnie od branży, umiejętność pisania przekonujących tekstów jest zawsze poszukiwana i dobrze wynagradzana.</p>
═══════════════════════════════════════════════════════════════
Powyższy wzorzec ma ~2000 znaków. Napisz tekst O TAKIEJ SAMEJ DŁUGOŚCI na podany temat.
Struktura: <h1> + 2-3 sekcje <h2> + 5-6 akapitów <p> po 4-5 zdań.`;
  }

  return `
WZORZEC DŁUGOŚCI (~3000 znaków) — Twój tekst musi mieć PODOBNĄ długość do poniższego:
═══════════════════════════════════════════════════════════════
<h1>Czym jest copywriting? Kompletny przewodnik po sztuce pisania tekstów sprzedażowych</h1>
<h2>Definicja i podstawowe pojęcia copywritingu</h2>
<p>Copywriting to sztuka i nauka pisania tekstów, które mają na celu przekonanie czytelnika do podjęcia konkretnego działania. Może to być zakup produktu, zapisanie się na newsletter, pobranie aplikacji lub jakikolwiek inny cel biznesowy. Copywriter to specjalista, który tworzy zawartość marketingową dostosowaną do konkretnej grupy docelowej, wykorzystując psychologię konsumenta i techniki persuazji. Tekst napisany przez dobrego copywritera nie tylko informuje, ale przede wszystkim inspiruje i motywuje do działania.</p>
<p>Różnica między copywritingiem a zwykłym pisaniem polega na intencji i efektywności. Podczas gdy artykuł prasowy ma na celu poinformowanie czytelnika, copy ma konkretny cel biznesowy. Copywriter musi rozumieć potrzeby swojej grupy docelowej, znać konkurencję i wiedzieć, jak wykorzystać emocje do zwiększenia konwersji. Każde słowo w copywritingu jest wybierane świadomie, aby maksymalizować wpływ na czytelnika.</p>
<p>Copywriting pojawia się wszędzie wokół nas: w reklamach telewizyjnych, banerach internetowych, e-mailach marketingowych, opisach produktów na stronach internetowych oraz w postach na mediach społecznościowych. To umiejętność, która jest niezwykle cenna w dzisiejszym cyfrowym świecie, gdzie konkurencja o uwagę konsumenta jest ogromna. Dobrze napisany copy może być różnicą między sukcesem a porażką kampanii marketingowej.</p>
<h2>Kluczowe elementy efektywnego copywritingu</h2>
<p>Efektywny copywriting opiera się na kilku fundamentalnych elementach. Po pierwsze, musi być jasny i zrozumiały dla grupy docelowej, bez zbędnych zawiłości i trudnych słów. Po drugie, powinien zawierać mocne nagłówki, które przyciągają uwagę i zachęcają do dalszego czytania. Po trzecie, tekst musi być zorientowany na korzyści dla czytelnika, a nie na cechy produktu. Wreszcie, każdy dobry copy powinien zawierać wyraźne wezwanie do działania, które mówi czytelnikowi dokładnie, co powinien zrobić dalej.</p>
<h2>Praktyczne zastosowania i rodzaje copywritingu</h2>
<p>Praktyczne zastosowania copywritingu są nieograniczone i znajdują się w każdej gałęzi biznesu. E-commerce wykorzystuje copywriting w opisach produktów, aby zwiększyć sprzedaż. Agencje reklamowe tworzą copy na potrzeby kampanii multimedialnych. Firmy technologiczne używają copywritingu do wyjaśniania złożonych funkcji swoich produktów w prosty sposób. Influencerzy i twórcy treści stosują techniki copywriterskie do zwiększenia zaangażowania swoich odbiorców w mediach społecznościowych.</p>
<p>Wśród najpopularniejszych rodzajów copywritingu wyróżniamy: copywriting sprzedażowy (bezpośrednia sprzedaż produktów i usług), copywriting SEO (optymalizacja treści pod wyszukiwarki), copywriting UX (teksty interfejsów użytkownika), copywriting e-mailowy (kampanie mailingowe) oraz copywriting brandowy (budowanie wizerunku marki). Każdy z tych typów wymaga nieco innych umiejętności, ale wszystkie łączy jeden cel — skuteczna komunikacja z odbiorcą.</p>
<h2>Jak zostać copywriterem?</h2>
<p>Aby zostać dobrym copywriterem, należy ciągle się uczyć i doskonalić swoje umiejętności. Warto czytać przykłady udanych kampanii, analizować, co sprawia, że teksty działają, i eksperymentować z różnymi podejściami. Copywriting to umiejętność, którą można rozwijać poprzez praktykę, czytanie książek branżowych i udział w szkoleniach. Najważniejsze to pisać regularnie, testować różne style i zbierać feedback od czytelników, bo to jedyna droga do mistrzostwa w tej dziedzinie.</p>
═══════════════════════════════════════════════════════════════
Powyższy wzorzec ma ~3000 znaków. Napisz tekst O TAKIEJ SAMEJ DŁUGOŚCI na podany temat.
Struktura: <h1> + 3-4 sekcje <h2> + 7-8 akapitów <p> po 4-5 zdań.`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 Build prompt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildPrompt(params: {
  topic: string;
  targetLength: number;
  keywords: string[];
}): string {
  const { topic, targetLength, keywords } = params;
  const structure = calculateStructure(targetLength);
  const seoInstructions = buildSeoInstructions(keywords);
  const lengthExample = getLengthExample(targetLength);
  const minChars = Math.floor(targetLength * 0.85);
  const maxChars = Math.floor(targetLength * 1.1);

  return `Jesteś doświadczonym, profesjonalnym polskim copywriterem i redaktorem.
Piszesz WYŁĄCZNIE w języku polskim — poprawnym, naturalnym, bogatym stylistycznie.

ZASADY JĘZYKA POLSKIEGO:
- Pisz poprawną polszczyzną — gramatyka, ortografia, interpunkcja
- Używaj naturalnych, płynnych zdań — NIE tłumacz z angielskiego
- Stosuj polskie zwroty i frazeologię (nie kalki językowe)
- Unikaj sztucznego, „robociego" stylu — pisz jak doświadczony dziennikarz
- Każde zdanie musi być gramatycznie poprawne i zakończone
- Akapity muszą płynnie na siebie przechodzić (spójność logiczna)
- Używaj różnorodnego słownictwa — NIE powtarzaj tych samych słów
- Pisz konkretnie i merytorycznie — każde zdanie musi wnosić wartość

FORMAT: CZYSTY HTML (bez Markdown, bez <!DOCTYPE>, bez komentarzy)
Używaj TYLKO: <h1> <h2> <h3> <p> <strong> <em> <ul> <li> <ol>
NIE używaj: # ## ### * - (Markdown)
Rozpocznij od: <h1>

TEMAT: ${topic}

${lengthExample}

${seoInstructions}

KRYTYCZNE ZASADY DŁUGOŚCI:
- MINIMUM: ${minChars} znaków
- MAKSIMUM: ${maxChars} znaków
- IDEAŁ: ~${targetLength} znaków
- Licz WSZYSTKO łącznie: tagi HTML + tekst + spacje
- Gdy zbliżasz się do limitu → ZAKOŃCZ naturalnym zdaniem i </p>
- NIE PISZ WIĘCEJ niż ${maxChars} znaków!

STRUKTURA:
- <h1>: 1 (tytuł)
- <h2>: ${structure.sections} sekcji
- <p>: ${structure.paragraphs} akapitów (3-5 zdań każdy)

NAPISZ TEKST na temat "${topic}" (${minChars}-${maxChars} znaków):`;
}

function ensureProperEnding(content: string): string {
  let fixed = content.trimEnd();

  // Remove truncated HTML tag
  const lastOpen = fixed.lastIndexOf("<");
  const lastClose = fixed.lastIndexOf(">");
  if (lastOpen > lastClose) {
    fixed = fixed.substring(0, lastOpen).trimEnd();
  }

  // Check if already ends properly
  const closingTags = [
    "</p>",
    "</ul>",
    "</ol>",
    "</table>",
    "</li>",
    "</h1>",
    "</h2>",
    "</h3>",
  ];
  if (closingTags.some((tag) => fixed.endsWith(tag))) {
    return fixed;
  }

  // Text was cut off — find last complete sentence (ending with . ! or ?)
  const lastSentenceEnd = Math.max(
    fixed.lastIndexOf(". "),
    fixed.lastIndexOf(".</"),
    fixed.lastIndexOf(". "),
    fixed.lastIndexOf("! "),
    fixed.lastIndexOf("!</"),
    fixed.lastIndexOf("? "),
    fixed.lastIndexOf("?</"),
  );

  // Also check for sentence ending right before a tag
  const lastDotBeforeTag = fixed.lastIndexOf(".");
  const lastExclBeforeTag = fixed.lastIndexOf("!");
  const lastQuestBeforeTag = fixed.lastIndexOf("?");
  const lastPunctuation = Math.max(
    lastDotBeforeTag,
    lastExclBeforeTag,
    lastQuestBeforeTag,
  );

  if (lastPunctuation > fixed.length * 0.5) {
    // Cut at the last complete sentence
    fixed = fixed.substring(0, lastPunctuation + 1);
  }

  // Ensure ends with closing tag
  if (!closingTags.some((tag) => fixed.endsWith(tag))) {
    fixed += "</p>";
  }

  return fixed;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✍️ Generate with full metrics
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function generateText(params: {
  topic: string;
  length: number;
  keywords: string[];
}): Promise<GenerationMetrics> {
  const { topic, length: targetLength, keywords } = params;
  const maxTokens = calculateMaxTokens(targetLength);
  const prompt = buildPrompt({ topic, targetLength, keywords });

  console.log(
    `\n🎨 GENEROWANIE: "${topic}" | cel: ${targetLength} zn. | max_tokens: ${maxTokens}`,
  );

  const startTime = Date.now();

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  const latencyMs = Date.now() - startTime;

  let result =
    message.content[0].type === "text" ? message.content[0].text : "";
  result = result
    .replace(/```html?\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  result = ensureProperEnding(result);

  const inputTokens = message.usage?.input_tokens || 0;
  const outputTokens = message.usage?.output_tokens || 0;
  const totalTokens = inputTokens + outputTokens;
  const costUsd = calculateCost(inputTokens, outputTokens);
  const plainLength = result.replace(/<[^>]*>/g, "").length;

  console.log(
    `   📏 ${result.length} zn. (plain: ${plainLength}) | ${latencyMs}ms | $${costUsd.toFixed(5)} | stop: ${message.stop_reason}`,
  );

  return {
    result,
    resultLength: result.length,
    plainLength,
    model: MODEL,
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd,
    latencyMs,
    stopReason: message.stop_reason || "unknown",
    promptLength: prompt.length,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📡 Streaming generation with metrics callback
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function generateTextStreamWithMetrics(params: {
  topic: string;
  length: number;
  keywords: string[];
  onChunk: (text: string) => void;
}): Promise<GenerationMetrics> {
  const { topic, length: targetLength, keywords, onChunk } = params;
  const maxTokens = calculateMaxTokens(targetLength);
  const prompt = buildPrompt({ topic, targetLength, keywords });

  const startTime = Date.now();
  let fullResult = "";

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullResult += event.delta.text;
      onChunk(event.delta.text);
    }
  }

  const latencyMs = Date.now() - startTime;
  const finalMessage = await stream.finalMessage();

  fullResult = fullResult
    .replace(/```html?\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();
  fullResult = ensureProperEnding(fullResult);

  const inputTokens = finalMessage.usage?.input_tokens || 0;
  const outputTokens = finalMessage.usage?.output_tokens || 0;
  const costUsd = calculateCost(inputTokens, outputTokens);
  const plainLength = fullResult.replace(/<[^>]*>/g, "").length;

  return {
    result: fullResult,
    resultLength: fullResult.length,
    plainLength,
    model: MODEL,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd,
    latencyMs,
    stopReason: finalMessage.stop_reason || "unknown",
    promptLength: prompt.length,
  };
}
