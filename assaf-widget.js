/*!
 * ASSAF AI Shopping Assistant — production widget loader
 * Drop into any page with ONE tag:
 *   <script src="https://hashmi-2k.github.io/assistant-test/assaf-widget.js" defer></script>
 * Self-contained: injects its own fonts, styles and markup, then boots.
 */
(function () {
  if (window.__assafWidgetLoaded) return;      // guard against double-injection
  window.__assafWidgetLoaded = true;

  function boot() {
    if (document.getElementById("assaf-assistant")) return;

    // 1) Fonts — try to load Google Fonts; if the store's CSP blocks them,
    //    the CSS font stacks fall back to system fonts automatically.
    try {
      var pre1 = document.createElement("link");
      pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
      document.head.appendChild(pre1);
      var pre2 = document.createElement("link");
      pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "anonymous";
      document.head.appendChild(pre2);
      var font = document.createElement("link");
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Jost:wght@300;400;500;600&family=Noto+Kufi+Arabic:wght@400;500;700&display=swap";
      document.head.appendChild(font);
    } catch (e) {}

    // 2) Styles
    var style = document.createElement("style");
    style.id = "assaf-assistant-styles";
    style.textContent = AA_CSS;
    document.head.appendChild(style);

    // 3) Markup
    var holder = document.createElement("div");
    holder.innerHTML = AA_HTML;
    while (holder.firstChild) document.body.appendChild(holder.firstChild);

    // 4) Boot the widget logic
    AA_INIT();
  }

  var AA_CSS = `/* ═══════════════════ WIDGET STYLES (this is what ships) ═══════════════════ */
  #assaf-assistant, #assaf-assistant * { box-sizing: border-box; }
  #assaf-assistant {
    --ink: #141414;
    --ink-soft: #7a7a7a;
    --line: #ececec;
    --bg: #ffffff;
    --panel-tint: #fcfbf9;       /* barely-warm off-white, softer than pure #fff */
    --accent: #b08a3e;           /* gold hairline / details */
    --accent-soft: #f3ecdd;      /* pale gold wash for chips / hovers */
    --sale: #9a3b2e;             /* muted terracotta-red for sale prices only */
    --user-bubble: #141414;
    --radius: 18px;
    --font-display: "Cormorant Garamond", Georgia, serif;
    --font-body: "Jost", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    --font-ar: "Noto Kufi Arabic", "Jost", system-ui, sans-serif;
    position: fixed; bottom: 24px; right: 24px; left: auto; z-index: 999999;
    font-family: var(--font-body);
  }
  #assaf-assistant[dir="rtl"] .aa-panel, #assaf-assistant[dir="rtl"] .aa-msg,
  #assaf-assistant[dir="rtl"] .aa-input, #assaf-assistant[dir="rtl"] .aa-name,
  #assaf-assistant[dir="rtl"] .aa-welcome { font-family: var(--font-ar); }
  #assaf-assistant[dir="rtl"] { right: 24px; left: auto; }

  /* Launcher bubble */
  .aa-launcher {
    position: relative;
    width: 64px; height: 64px; border-radius: 50%;
    background: linear-gradient(150deg, #262626 0%, #000 100%);
    color: #fff; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 28px rgba(0,0,0,0.24);
    transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
  }
  .aa-launcher:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 14px 36px rgba(0,0,0,0.3); }
  .aa-launcher:active { transform: translateY(-1px) scale(.99); }
  .aa-launcher svg { width: 27px; height: 27px; }
  .aa-launcher .aa-logo { width: 34px; height: 34px; object-fit: contain; }
  .aa-launcher .aa-ring { position: absolute; inset: -4px; border-radius: 50%; border: 1px solid var(--accent); opacity: .55; animation: aa-pulse 3s ease-in-out infinite; }

  /* Nudge bubble (promo message above the launcher) */
  .aa-nudge {
    position: absolute; bottom: 76px; right: 0;
    max-width: 260px; width: max-content;
    background: #fff; color: var(--ink);
    border: 1px solid var(--line); border-inline-start: 3px solid var(--accent);
    border-radius: 14px; padding: 12px 34px 12px 15px;
    font-size: 13.5px; line-height: 1.5; font-family: var(--font-ar);
    box-shadow: 0 10px 30px rgba(0,0,0,0.16);
    cursor: pointer; opacity: 0; transform: translateY(8px) scale(.96);
    transition: opacity .3s ease, transform .3s cubic-bezier(.34,1.4,.5,1);
    pointer-events: none;
  }
  #assaf-assistant:not([dir="rtl"]) .aa-nudge { font-family: var(--font-body); padding: 12px 15px 12px 34px; }
  #assaf-assistant[dir="rtl"] .aa-nudge { right: 0; left: auto; }
  .aa-nudge.show { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
  .aa-nudge:hover { border-color: var(--accent); }
  .aa-nudge-x {
    position: absolute; top: 6px; background: none; border: none;
    font-size: 17px; line-height: 1; color: var(--ink-soft); cursor: pointer; padding: 2px 5px;
  }
  #assaf-assistant:not([dir="rtl"]) .aa-nudge-x { right: 6px; }
  #assaf-assistant[dir="rtl"] .aa-nudge-x { left: 6px; }
  .aa-nudge-x:hover { color: var(--ink); }
  @keyframes aa-pulse { 0%,100%{ transform: scale(1); opacity:.55 } 50%{ transform: scale(1.06); opacity:.2 } }

  /* Panel */
  .aa-panel {
    position: absolute; bottom: 78px; right: 0;
    width: 400px; max-width: calc(100vw - 44px);
    height: 600px; max-height: calc(100vh - 128px);
    background: var(--panel-tint); border: 1px solid var(--line); border-radius: var(--radius);
    box-shadow: 0 24px 70px rgba(0,0,0,0.2);
    display: none; flex-direction: column; overflow: hidden;
    transform: translateY(16px) scale(.96); opacity: 0;
    transform-origin: bottom right;
    transition: transform .34s cubic-bezier(.34,1.4,.5,1), opacity .26s ease;
  }
  #assaf-assistant[dir="rtl"] .aa-panel { right: 0; left: auto; transform-origin: bottom right; }
  .aa-panel.open { display: flex; transform: translateY(0) scale(1); opacity: 1; }

  /* Header */
  .aa-header { padding: 20px 22px 18px; border-bottom: 1px solid var(--line); position: relative;
    background: linear-gradient(180deg, var(--accent-soft) 0%, transparent 92%); }
  .aa-header .aa-hairline { position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); }
  .aa-brand { font-size: 10.5px; letter-spacing: 4px; color: var(--ink-soft); text-transform: uppercase; }
  .aa-title { font-family: var(--font-display); font-size: 25px; color: var(--ink); margin-top: 3px; font-weight: 600; letter-spacing: .3px; line-height: 1.1; }
  #assaf-assistant[dir="rtl"] .aa-title { font-family: var(--font-ar); font-size: 20px; font-weight: 700; }
  .aa-actions { position: absolute; top: 13px; display: flex; gap: 6px; align-items: center; }
  #assaf-assistant:not([dir="rtl"]) .aa-actions { right: 14px; }
  #assaf-assistant[dir="rtl"] .aa-actions { left: 14px; }
  .aa-lang { background: #fff; border: 1px solid var(--line); border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: .5px; color: var(--ink); cursor: pointer; padding: 4px 10px; transition: border-color .15s, background .15s; }
  .aa-lang:hover { border-color: var(--accent); background: var(--accent-soft); }
  .aa-close { background: none; border: none; font-size: 22px; color: var(--ink-soft); cursor: pointer; line-height: 1; padding: 0 2px; }

  /* Messages */
  .aa-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
  .aa-welcome { text-align: center; margin: auto 0; color: var(--ink-soft); font-size: 14.5px; line-height: 1.8; }
  .aa-welcome .aa-mark { margin-bottom: 10px; line-height: 1;
    width: 74px; height: 74px; margin-inline: auto; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(150deg, #262626 0%, #000 100%);
    border: 1px solid var(--accent); border-radius: 50%; }
  .aa-welcome .aa-mark img { width: 40px; height: 40px; object-fit: contain; }
  .aa-chips { display: flex; flex-wrap: wrap; gap: 9px; justify-content: center; margin-top: 20px; }
  .aa-chip { font-size: 12.5px; padding: 9px 14px; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--ink); cursor: pointer; transition: border-color .2s, background .2s, transform .2s; }
  .aa-chip:hover { border-color: var(--accent); background: var(--accent-soft); transform: translateY(-1px); }

  .aa-msg { max-width: 86%; font-size: 14.5px; line-height: 1.65; padding: 12px 15px; border-radius: 15px; white-space: pre-wrap;
    animation: aa-in .32s cubic-bezier(.2,.8,.3,1); }
  .aa-msg b { font-weight: 700; }
  .aa-msg .aa-inline-link {
    font-weight: 700; color: var(--ink); text-decoration: none;
    border-bottom: 1.5px solid var(--accent);
    transition: color .15s, border-color .15s;
  }
  .aa-msg .aa-inline-link:hover { color: var(--accent); border-color: var(--ink); }
  @keyframes aa-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .aa-msg.user { align-self: flex-end; background: var(--user-bubble); color: #fff; border-bottom-right-radius: 5px; }
  #assaf-assistant[dir="rtl"] .aa-msg.user { border-bottom-right-radius: 13px; border-bottom-left-radius: 5px; }
  .aa-msg.bot { align-self: flex-start; background: #f6f6f4; color: var(--ink); border-bottom-left-radius: 5px; }
  #assaf-assistant[dir="rtl"] .aa-msg.bot { border-bottom-left-radius: 13px; border-bottom-right-radius: 5px; }

  /* Product cards */
  .aa-cards { display: flex; flex-direction: column; gap: 10px; align-self: flex-start; max-width: 92%; width: 92%; }
  .aa-card { display: flex; gap: 13px; align-items: stretch; text-decoration: none; color: inherit;
    border: 1px solid var(--line); border-radius: 14px; padding: 0; overflow: hidden;
    transition: border-color .2s, transform .2s, box-shadow .2s; background:#fff;
    animation: aa-in .38s cubic-bezier(.2,.8,.3,1); }
  .aa-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,0.08); }
  .aa-card .aa-thumb { width: 92px; min-height: 92px; align-self: stretch; object-fit: contain; padding: 8px; background: #fff; flex-shrink: 0; }
  .aa-card .aa-info { min-width: 0; flex: 1; padding: 11px 13px 11px 0; display: flex; flex-direction: column; justify-content: center; }
  #assaf-assistant[dir="rtl"] .aa-card .aa-info { padding: 11px 0 11px 13px; }
  .aa-card .aa-name { font-size: 14.5px; font-weight: 600; color: var(--ink); margin-bottom: 3px; line-height: 1.3; }
  .aa-card .aa-meta { font-size: 11.5px; letter-spacing: .5px; text-transform: uppercase; color: var(--ink-soft); }
  .aa-card .aa-priceline { display: flex; align-items: baseline; gap: 7px; margin-top: 7px; }
  .aa-card .aa-price { font-size: 15px; font-weight: 700; color: var(--ink); }
  .aa-card .aa-price.on-sale { color: var(--sale); }
  .aa-card .aa-was { font-size: 12px; color: var(--ink-soft); text-decoration: line-through; font-weight: 400; }
  .aa-card .aa-cur { font-size: 12px; font-weight: 500; }
  /* Out-of-stock: dim the card slightly and show a badge next to the name */
  .aa-card.aa-oos { opacity: .72; }
  .aa-card.aa-oos .aa-thumb { filter: grayscale(35%); }
  .aa-oos-badge {
    display: inline-block; margin-inline-start: 7px; vertical-align: middle;
    font-size: 10px; font-weight: 700; letter-spacing: .3px;
    color: var(--sale); background: #f7e9e6; border: 1px solid #eccec8;
    border-radius: 999px; padding: 2px 8px; white-space: nowrap;
  }

  /* Typing dots */
  .aa-typing { align-self: flex-start; background: #f6f6f4; border-radius: 13px; padding: 12px 15px; display: flex; gap: 4px; }
  .aa-typing span { width: 6px; height: 6px; border-radius: 50%; background: #bbb; animation: aa-bounce 1.2s infinite; }
  .aa-typing span:nth-child(2){ animation-delay:.15s } .aa-typing span:nth-child(3){ animation-delay:.3s }
  @keyframes aa-bounce { 0%,60%,100%{ transform: translateY(0); opacity:.5 } 30%{ transform: translateY(-5px); opacity:1 } }

  /* Input */
  .aa-input-row { border-top: 1px solid var(--line); padding: 13px; display: flex; gap: 9px; background: #fff; align-items: center; }
  .aa-input { flex: 1 1 auto; min-width: 0; border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; font-size: 14.5px; font-family: inherit; outline: none; color: var(--ink); transition: border-color .2s, box-shadow .2s; }
  .aa-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .aa-send { flex: 0 0 auto; white-space: nowrap; border: none; background: var(--ink); color: #fff; border-radius: 12px; padding: 0 20px; height: 46px; font-size: 14px; font-weight: 500; letter-spacing: .5px; cursor: pointer; transition: background .2s, box-shadow .2s, transform .1s; }
  .aa-send:hover:not(:disabled) { background: #000; box-shadow: inset 0 0 0 1px var(--accent); }
  .aa-send:active:not(:disabled) { transform: scale(.97); }
  .aa-send:disabled { opacity: .35; cursor: default; }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }`;

  var AA_HTML = `<div id="assaf-assistant" dir="rtl">
    <div class="aa-panel" id="aa-panel">
      <div class="aa-header">
        <div class="aa-brand">ASSAF · عساف</div>
        <div class="aa-title" id="aa-title">مساعد التسوق</div>
        <div class="aa-actions">
          <button class="aa-lang" id="aa-lang">EN</button>
          <button class="aa-close" id="aa-close" aria-label="إغلاق">×</button>
        </div>
        <div class="aa-hairline"></div>
      </div>
      <div class="aa-messages" id="aa-messages">
        <div class="aa-welcome" id="aa-welcome">
          <div class="aa-mark"><img src="https://hashmi-2k.github.io/assistant-test/ASSAF%20Logo_FAW.png" alt="ASSAF"></div>
          <span id="aa-welcome-text">كيف أقدر أساعدك اليوم؟<br>اسأل عن العطور، الساعات، الهدايا وغيرها.</span>
          <div class="aa-chips" id="aa-chips"></div>
        </div>
      </div>
      <div class="aa-input-row">
        <input class="aa-input" id="aa-input" placeholder="اكتب رسالتك…" dir="auto" autocomplete="off">
        <button class="aa-send" id="aa-send">إرسال</button>
      </div>
    </div>

    <div class="aa-nudge" id="aa-nudge" role="button" tabindex="0">
      <span class="aa-nudge-text" id="aa-nudge-text"></span>
      <button class="aa-nudge-x" id="aa-nudge-x" aria-label="إغلاق">×</button>
    </div>
    <button class="aa-launcher" id="aa-launcher" aria-label="افتح مساعد التسوق">
      <span class="aa-ring"></span>
      <img class="aa-logo" src="https://hashmi-2k.github.io/assistant-test/ASSAF%20Logo_FAW.png" alt="ASSAF">
    </button>
  </div>`;

  function AA_INIT() {
(function () {
  // ─────────── CONFIG ───────────
  var WORKER_URL = "https://assaf-bot.s-hashmi.workers.dev"; // your Worker
  var USE_STREAMING = true;

  // ─────────── NUDGE MESSAGE (the little bubble that pops up above the icon) ───
  // EDIT THIS to change the promo message. Set enabled:false to hide it entirely.
  // {ar} shows on the Arabic site, {en} on the English site.
  var NUDGE = {
    enabled: true,
    delayMs: 3000,        // how long after page load before it appears
    ar: "🇸🇦 عروض اليوم الوطني وصلت! اسألني عن أفضل العطور",
    en: "🇸🇦 National Day offers are here! Ask me for the best picks"
  };

  // ─────────── Language strings ───────────
  var I18N = {
    ar: {
      dir: "rtl", langBtn: "EN",
      title: "مساعد التسوق",
      welcome: "كيف أقدر أساعدك اليوم؟<br>اسأل عن العطور، الساعات، الهدايا وغيرها.",
      placeholder: "اكتب رسالتك…",
      send: "إرسال",
      error: "تعذّر الاتصال، حاول مرة ثانية.",
      chips: ["أبغى عطر صيفي نسائي", "هدية لزوجتي بأقل من ٣٠٠ ريال", "أحدث عطور الصيف"]
    },
    en: {
      dir: "ltr", langBtn: "ع",
      title: "Shopping Assistant",
      welcome: "How can I help you today?<br>Ask about perfumes, watches, gifts and more.",
      placeholder: "Type your message…",
      send: "Send",
      error: "Connection failed, please try again.",
      chips: ["A summer perfume for women", "Gift for my wife under 300 SAR", "Latest summer perfumes"]
    }
  };
  // Detect the store's language from the page so the widget matches it on load.
  // Salla sets <html lang="ar"> or "en" (and dir). Falls back to Arabic.
  function detectPageLang() {
    try {
      var htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
      if (htmlLang.indexOf("en") === 0) return "en";
      if (htmlLang.indexOf("ar") === 0) return "ar";
      var dir = (document.documentElement.getAttribute("dir") || "").toLowerCase();
      if (dir === "ltr") return "en";
      if (dir === "rtl") return "ar";
      // last resort: URL path like /en or /en/
      if (/\/en(\/|$|\?)/i.test(location.pathname)) return "en";
    } catch (e) {}
    return "ar";
  }
  // ─────────── UTM tracking ───────────
  // Tags every product link so GA4 attributes the visit (and any purchase) to the
  // assistant. Appends with & if the link already has query params, ? otherwise.
  var UTM = "utm_source=ai_assistant&utm_medium=chat";
  function withUTM(link) {
    if (!link || link === "#") return link || "#";
    if (link.indexOf("utm_source=") !== -1) return link; // already tagged
    link = link.replace(/&amp;/g, "&");                  // fix any encoded ampersands
    var sep = link.indexOf("?") !== -1 ? "&" : "?";
    return link + sep + UTM;
  }

  var lang = detectPageLang();

  var $ = function (id) { return document.getElementById(id); };
  var root = $("assaf-assistant"), panel = $("aa-panel"), messages = $("aa-messages"), input = $("aa-input");
  var history = [];
  var busy = false;

  function applyLang() {
    var t = I18N[lang];
    root.setAttribute("dir", t.dir);
    $("aa-title").textContent = t.title;
    $("aa-lang").textContent = t.langBtn;
    $("aa-send").textContent = t.send;
    input.placeholder = t.placeholder;
    var wt = $("aa-welcome-text"); if (wt) wt.innerHTML = t.welcome;
    renderChips();
  }
  function renderChips() {
    var box = $("aa-chips"); if (!box) return;
    box.innerHTML = "";
    I18N[lang].chips.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "aa-chip"; b.textContent = c;
      b.onclick = function () { send(c); };
      box.appendChild(b);
    });
  }
  function toggleLang() {
    lang = (lang === "ar") ? "en" : "ar";
    applyLang();
    updateNudgeText();
  }

  // Strip markdown so ** ** and * don't show as literal characters
  function stripMd(s) {
    if (!s) return "";
    return s
      .replace(/\*\*(.*?)\*\*/g, "$1")   // **bold**
      .replace(/(^|\s)\*(?!\s)(.*?)\*/g, "$1$2") // *italic*
      .replace(/^#{1,6}\s+/gm, "")       // headings
      .replace(/`([^`]+)`/g, "$1");      // `code`
  }

  // Render reply text as SAFE html: escape everything, then turn **x** into <b>x</b>.
  // Handles a dangling "**" mid-stream (odd number) by treating the tail as open bold.
  function renderRich(s) {
    if (!s) return "";
    // escape html first
    var e = String(s).replace(/[&<>"]/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c];
    });
    // strip headings / inline code / single-star italics (keep it simple)
    e = e.replace(/^#{1,6}\s+/gm, "").replace(/`([^`]+)`/g, "$1");
    // convert paired ** ** to bold
    var parts = e.split("**");
    var html = "";
    for (var i = 0; i < parts.length; i++) {
      html += (i % 2 === 1) ? "<b>" + parts[i] + "</b>" : parts[i];
    }
    // if we opened a <b> but never closed (odd count, mid-stream), it's fine—browser tolerates,
    // but close it cleanly to be safe:
    if (parts.length % 2 === 0) html += "</b>";
    return html;
  }

  function open() { panel.classList.add("open"); dismissNudge(); setTimeout(function(){ input.focus(); }, 200); }
  function close() { panel.classList.remove("open"); }

  // ─────────── Nudge bubble ───────────
  var nudgeDismissed = false;
  function updateNudgeText() {
    var el = $("aa-nudge-text");
    if (el) el.textContent = NUDGE[lang] || "";
  }
  function showNudge() {
    if (!NUDGE.enabled || nudgeDismissed) return;
    if (panel.classList.contains("open")) return;  // don't show if already chatting
    updateNudgeText();
    var n = $("aa-nudge"); if (n) n.classList.add("show");
  }
  function dismissNudge() {
    nudgeDismissed = true;
    var n = $("aa-nudge"); if (n) n.classList.remove("show");
  }
  (function initNudge() {
    var n = $("aa-nudge"), x = $("aa-nudge-x");
    if (!n) return;
    // clicking the bubble opens the chat; the × just dismisses
    n.onclick = function () { open(); };
    if (x) x.onclick = function (e) { e.stopPropagation(); dismissNudge(); };
    if (NUDGE.enabled) setTimeout(showNudge, NUDGE.delayMs || 3000);
  })();
  $("aa-launcher").onclick = function () { panel.classList.contains("open") ? close() : open(); };
  $("aa-close").onclick = close;
  $("aa-lang").onclick = toggleLang;
  applyLang(); // build initial chips + strings

  $("aa-send").onclick = function () { send(input.value); };
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(input.value); });

  function clearWelcome() { var w = $("aa-welcome"); if (w) w.remove(); }
  function scroll() { messages.scrollTop = messages.scrollHeight; }

  function addMsg(text, who) {
    var d = document.createElement("div");
    d.className = "aa-msg " + who; d.dir = "auto"; d.textContent = text;
    messages.appendChild(d); scroll(); return d;
  }
  function addTyping() {
    var d = document.createElement("div"); d.className = "aa-typing";
    d.innerHTML = "<span></span><span></span><span></span>";
    messages.appendChild(d); scroll(); return d;
  }
  function addCards(products, replyLang) {
    if (!products || !products.length) return;
    var useEn = (replyLang || lang) === "en";
    var wrap = document.createElement("div"); wrap.className = "aa-cards";
    products.forEach(function (p) {
      var a = document.createElement("a");
      a.className = "aa-card" + (p.in_stock === false ? " aa-oos" : "");
      a.href = withUTM(p.link || "#"); a.target = "_blank"; a.rel = "noreferrer"; a.dir = "auto";
      // English reply → use the English name when the product has a trustworthy one,
      // otherwise fall back to the Arabic name.
      var displayName = (useEn && p.name_en) ? p.name_en : (p.name || p.name_en);
      var price = p.sale ? p.sale : p.price;
      var wasHtml = p.sale ? '<span class="aa-was">' + p.price + '</span>' : '';
      var oosBadge = (p.in_stock === false)
        ? '<span class="aa-oos-badge">' + (useEn ? "Out of stock" : "غير متوفر حالياً") + '</span>'
        : '';
      a.innerHTML =
        '<img class="aa-thumb" src="' + (p.img || "") + '" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="aa-info">' +
          '<div class="aa-name">' + esc(displayName) + oosBadge + '</div>' +
          '<div class="aa-meta">' + esc(p.cat || "") + '</div>' +
          '<div class="aa-priceline">' +
            '<span class="aa-price' + (p.sale ? ' on-sale' : '') + '">' + price + ' <span class="aa-cur">﷼</span></span>' +
            wasHtml +
          '</div>' +
        '</div>';
      wrap.appendChild(a);
    });
    messages.appendChild(wrap); scroll();
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]; }); }

  // Cached product index (fetched once) used to resolve cards and linkify names
  var productIndex = null;
  function getProducts() {
    if (productIndex) return Promise.resolve(productIndex);
    return fetch(WORKER_URL + "/products")
      .then(function (r) { return r.json(); })
      .then(function (all) { productIndex = Array.isArray(all) ? all : []; return productIndex; })
      .catch(function () { return []; });
  }

  // Normalise Arabic/English for name matching
  function normName(s) {
    if (!s) return "";
    s = String(s).toLowerCase();
    s = s.replace(/[\u064B-\u0652\u0640]/g, "");
    s = s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
    s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");
    return s.replace(/\s+/g, " ").trim();
  }

  // Find products whose names appear in the reply text (fallback when ids missing)
  function productsFromText(text, all) {
    if (!text || !all || !all.length) return [];
    var t = normName(text);
    var sorted = all.slice().sort(function (a, b) {
      var al = Math.max((a.name || "").length, (a.name_en || "").length);
      var bl = Math.max((b.name || "").length, (b.name_en || "").length);
      return bl - al;
    });
    var hits = [];
    for (var i = 0; i < sorted.length && hits.length < 6; i++) {
      var names = [sorted[i].name, sorted[i].name_en]
        .filter(Boolean).map(normName).filter(function (n) { return n && n.length >= 4; });
      var matched = names.some(function (n) { return t.indexOf(n) !== -1; });
      if (matched) {
        var dup = hits.some(function (h) {
          var hn = [h.name, h.name_en].filter(Boolean).map(normName);
          return names.some(function (n) { return hn.some(function (x) { return x.indexOf(n) !== -1; }); });
        });
        if (!dup) hits.push(sorted[i]);
      }
    }
    return hits;
  }

  // Turn <b>Product Name</b> into a clickable link when it matches a real product
  function linkifyNames(bubbleEl, all) {
    if (!bubbleEl || !all || !all.length) return;
    var bolds = bubbleEl.querySelectorAll("b");
    Array.prototype.forEach.call(bolds, function (b) {
      var bn = normName(b.textContent);
      if (!bn || bn.length < 3) return;
      var match = null, matchLen = 0;
      for (var i = 0; i < all.length; i++) {
        var cand = [all[i].name, all[i].name_en].filter(Boolean);
        for (var j = 0; j < cand.length; j++) {
          var n = normName(cand[j]);
          if (!n) continue;
          if (n === bn || n.indexOf(bn) !== -1 || bn.indexOf(n) !== -1) {
            if (cand[j].length > matchLen) { match = all[i]; matchLen = cand[j].length; }
          }
        }
      }
      if (match && match.link) {
        var a = document.createElement("a");
        a.href = withUTM(match.link); a.target = "_blank"; a.rel = "noreferrer";
        a.className = "aa-inline-link";
        a.textContent = b.textContent;
        b.parentNode.replaceChild(a, b);
      }
    });
  }

  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    busy = true; input.value = ""; clearWelcome();
    addMsg(text, "user");
    USE_STREAMING ? streamReply(text) : jsonReply(text);
  }

  // Non-streaming fallback
  function jsonReply(text) {
    var typing = addTyping();
    fetch(WORKER_URL + "/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history })
    }).then(function (r) { return r.json(); }).then(function (data) {
      typing.remove();
      var reply = data.reply || "…";
      var b = addMsg("", "bot"); b.innerHTML = renderRich(reply);
      getProducts().then(function (all) {
        linkifyNames(b, all);
        var prods = data.products && data.products.length
          ? data.products
          : productsFromText(reply, all).map(function (p) {
              return { name: p.name, name_en: p.name_en, cat: p.cat,
                       price: p.was ? p.was : p.price, sale: p.was ? p.price : null,
                       link: p.link, img: p.img, in_stock: p.in_stock };
            });
        addCards(prods, data.lang);
      });
      history.push({ role: "user", content: text });
      history.push({ role: "assistant", content: reply });
      busy = false;
    }).catch(function () { typing.remove(); addMsg(I18N[lang].error, "bot"); busy = false; });
  }

  // Streaming path — shows text as it generates, then resolves product cards
  function streamReply(text) {
    var typing = addTyping();
    fetch(WORKER_URL + "/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history, stream: true })
    }).then(function (res) {
      typing.remove();
      var bubble = addMsg("", "bot");
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var acc = "";       // full raw accumulated model text
      var buffer = "";    // SSE line buffer

      function pump() {
        return reader.read().then(function (result) {
          if (result.done) { finish(); return; }
          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split("\n");
          buffer = lines.pop();
          lines.forEach(function (line) {
            line = line.trim();
            if (!line.startsWith("data:")) return;
            var payload = line.slice(5).trim();
            if (payload === "[DONE]") return;
            try {
              var evt = JSON.parse(payload);
              if (evt.type === "content_block_delta" && evt.delta && evt.delta.text) {
                acc += evt.delta.text;
                bubble.innerHTML = renderRich(extractReply(acc));
                scroll();
              }
            } catch (e) {}
          });
          return pump();
        });
      }
      function finish() {
        var reply = extractReply(acc, true);
        bubble.innerHTML = renderRich(reply || acc);
        var replyLang = /[\u0600-\u06FF]/.test(reply) ? "ar" : "en";
        var ids = extractIds(acc);
        // Did the AI explicitly recommend nothing (empty array), e.g. it asked a
        // clarifying question? If so, don't force cards from name-detection.
        var emptyRec = /"recommended_ids"\s*:\s*\[\s*\]/.test(acc);
        getProducts().then(function (all) {
          linkifyNames(bubble, all);
          var byId = {}; all.forEach(function (p) { byId[String(p.id)] = p; });
          var chosen = [];
          var seen = {};
          // 1) products the AI explicitly returned by id
          ids.forEach(function (id) {
            var p = byId[String(id)];
            if (p && !seen[p.id]) { seen[p.id] = 1; chosen.push(p); }
          });
          // 2) plus any product whose name appears in the reply text (merge, don't replace)
          //    — but only if the AI didn't deliberately recommend nothing.
          if (!emptyRec) {
            productsFromText(reply, all).forEach(function (p) {
              if (!seen[p.id]) { seen[p.id] = 1; chosen.push(p); }
            });
          }
          addCards(chosen.map(function (p) {
            return { name: p.name, name_en: p.name_en, cat: p.cat,
                     price: p.was ? p.was : p.price, sale: p.was ? p.price : null,
                     link: p.link, img: p.img, in_stock: p.in_stock };
          }), replyLang);
        });
        history.push({ role: "user", content: text });
        history.push({ role: "assistant", content: reply });
        busy = false;
      }
      pump();
    }).catch(function () { typing.remove(); addMsg(I18N[lang].error, "bot"); busy = false; });
  }

  // Pull the "reply" string out of partial/complete JSON as it streams
  function extractReply(raw, done) {
    var m = raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/);
    if (m) {
      var s = m[1];
      // if closing quote reached, trim there
      try { s = JSON.parse('"' + s.replace(/\\?$/, "") + '"'); } catch (e) { s = s.replace(/\\n/g, "\n").replace(/\\"/g, '"'); }
      return s;
    }
    return done ? raw.replace(/[{}"]/g, "") : raw;
  }
  function extractIds(raw) {
    var m = raw.match(/"recommended_ids"\s*:\s*\[([^\]]*)\]/);
    if (!m) return [];
    var ids = m[1].match(/"([^"]+)"/g) || [];
    return ids.map(function (x) { return x.replace(/"/g, ""); });
  }

  // After streaming, fetch product details for the recommended ids via a light call
  function resolveCards(ids, replyLang) {
    fetch(WORKER_URL + "/products").then(function (r) { return r.json(); }).then(function (all) {
      var map = {}; all.forEach(function (p) { map[String(p.id)] = p; });
      var products = ids.map(function (id) { return map[String(id)]; }).filter(Boolean).map(function (p) {
        return { name: p.name, name_en: p.name_en, cat: p.cat, price: p.was ? p.was : p.price, sale: p.was ? p.price : null, link: p.link, img: p.img, in_stock: p.in_stock };
      });
      addCards(products, replyLang);
    }).catch(function(){});
  }

  // RTL/LTR auto by first message could be added; default RTL for ASSAF KSA.
})();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
