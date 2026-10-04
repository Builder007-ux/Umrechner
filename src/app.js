(function () {
"use strict";
const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
const tools = window.ToolsRegistry;

const categories = [
  { id: "network", icon: "🌐", name: "Netzwerk" },
  { id: "developer", icon: "💻", name: "Developer" },
  { id: "security", icon: "🔐", name: "Security" },
  { id: "system", icon: "🖥️", name: "System" },
  { id: "mass", icon: "📏", name: "Maße" },
  { id: "currency", icon: "💱", name: "Währungen" },
];
const catById = id => categories.find(c => c.id === id);
const byCategory = id => Object.keys(tools).filter(k => tools[k].category === id);

let current = null, activeCat = null, verlauf = [], lastRun = null, runToken = 0;
try { verlauf = JSON.parse(localStorage.getItem("hist") || "[]"); } catch {}
const saveHist = () => { try { localStorage.setItem("hist", JSON.stringify(verlauf)); } catch {} };

// ---------- Theme ----------
function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === "light") root.setAttribute("data-theme", "light");
  else if (mode === "dark") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  $("themeBtn").textContent = mode === "light" ? "☀️" : mode === "dark" ? "🌙" : "🖥️";
}
let themeMode = "auto";
try { themeMode = localStorage.getItem("theme") || "auto"; } catch {}
applyTheme(themeMode);
$("themeBtn").onclick = () => {
  themeMode = themeMode === "auto" ? "dark" : themeMode === "dark" ? "light" : "auto";
  try { localStorage.setItem("theme", themeMode); } catch {}
  applyTheme(themeMode);
};

// ---------- Kategorien & Tool-Tabs ----------
const catButtons = categories.map(c => {
  const b = el("button", "catbtn", ""); b.dataset.id = c.id;
  b.append(el("span", "catbtn-icon", c.icon), el("span", "", c.name));
  b.onclick = () => { addHistory(); setCategory(c.id); scrollToWorkspace(); };
  $("cats").append(b);
  return b;
});
let toolButtons = [];

function scrollToWorkspace() { $("workspace").scrollIntoView({ behavior: "smooth", block: "start" }); }

function rebuildToolTabs(catId) {
  activeCat = catId;
  catButtons.forEach(b => b.classList.toggle("active", b.dataset.id === catId));
  try { localStorage.setItem("lastCat", catId); } catch {}
  $("tabs").textContent = "";
  toolButtons = byCategory(catId).map(id => {
    const b = el("button", "", tools[id].name); b.dataset.id = id;
    b.onclick = () => { addHistory(); jumpTo(id, ""); };
    $("tabs").append(b);
    return b;
  });
}

function setCategory(catId) {
  rebuildToolTabs(catId);
  let start;
  try { start = localStorage.getItem("lastTool:" + catId); } catch {}
  if (!start || tools[start]?.category !== catId) start = byCategory(catId)[0];
  setTool(start, "");
}

function jumpTo(id, text) {
  if (tools[id].category !== activeCat) rebuildToolTabs(tools[id].category);
  setTool(id, text);
}

function setTool(id, text = "") {
  current = id; $("q").value = text; $("q").placeholder = tools[id].ph; $("hint").textContent = tools[id].hint;
  toolButtons.forEach(b => b.setAttribute("aria-pressed", b.dataset.id === id));
  try { localStorage.setItem("lastTool:" + tools[id].category, id); } catch {}
  render();
}

function setHash(s) {
  const v = s ? `t=${current}&q=${encodeURIComponent(s)}` : "";
  try { window.history.replaceState(null, "", v ? "#" + v : location.pathname + location.search); } catch { location.hash = v; }
}

// ---------- Ergebnisse rendern ----------
async function render() {
  const s = $("q").value.trim(), out = $("out"), sw = $("sw"), token = ++runToken;
  out.textContent = ""; sw.hidden = true;
  setHash(s);
  if (!s) {
    const c = el("div", "card"), b = el("button", "sm", "Beispiel: " + tools[current].ph);
    b.onclick = () => { $("q").value = tools[current].ph; render(); };
    c.append(el("p", "hint", "Gib oben einen Wert ein oder probiere ein Beispiel."), b);
    out.append(c); return;
  }
  let r = tools[current].run(s);
  if (r && typeof r.then === "function") {
    out.append(el("div", "card loading", "Wird berechnet …"));
    r = await r;
    if (token !== runToken) return;
    out.textContent = "";
  }
  lastRun = { tool: current, text: s, r };
  if (r.error) { const c = el("div", "card"); c.append(el("p", "err", r.error)); out.append(c); return; }
  if (r.swatch) { sw.style.background = r.swatch; sw.hidden = false; }
  if (current === "subnet" && r.rows.length > 1) {
    const c = el("div", "card"), b = el("button", "sm", "Alle Adressen kopieren");
    b.onclick = () => { navigator.clipboard?.writeText(r.rows.map(x => x.copy).join("\n")); b.textContent = "Kopiert"; setTimeout(() => b.textContent = "Alle Adressen kopieren", 1200); };
    c.append(b); out.append(c);
  }
  r.rows.forEach(row => {
    const c = el("div", "card res"), val = el("div", "val");
    if (row.parts) row.parts.forEach((p, i) => val.append(el("span", "p" + i, p)));
    else val.textContent = row.value;
    const cp = el("button", "sm", "Kopieren");
    cp.onclick = () => { navigator.clipboard?.writeText(row.copy || (row.parts ? row.parts.join(" ") : row.value)); cp.textContent = "Kopiert"; setTimeout(() => cp.textContent = "Kopieren", 1200); };
    c.append(el("span", "lab", row.label + ":"), val, cp);
    if (row.send) {
      const b = el("button", "sm", "Weiter"); b.title = `In ${tools[row.send.tool].name} öffnen`;
      b.onclick = () => { addHistory(); jumpTo(row.send.tool, row.send.text); };
      c.append(b);
    }
    out.append(c);
  });
}

async function addHistory() {
  const s = $("q").value.trim();
  if (!s || !current) return;
  let r = (lastRun && lastRun.tool === current && lastRun.text === s) ? lastRun.r : tools[current].run(s);
  if (r && typeof r.then === "function") r = await r;
  if (r.error) return;
  verlauf = [{ tool: current, text: s }, ...verlauf.filter(h => !(h.tool === current && h.text === s))].slice(0, 12);
  saveHist(); renderHistory();
}

function renderHistory() {
  const wrap = $("recent"), list = $("hist");
  list.textContent = "";
  wrap.hidden = verlauf.length === 0;
  verlauf.forEach(h => {
    const b = el("button", "chip", `${tools[h.tool].name}: ${h.text}`);
    b.title = b.textContent;
    b.onclick = () => { jumpTo(h.tool, h.text); scrollToWorkspace(); };
    list.append(b);
  });
}
$("clr").onclick = () => { verlauf = []; saveHist(); renderHistory(); };

// ---------- Suche ----------
function normalize(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
const searchIndex = Object.entries(tools).map(([id, t]) => ({
  id, name: t.name, category: t.category,
  haystack: normalize([t.name, ...(t.keywords || [])].join(" ")),
}));

function runSearch(q) {
  const nq = normalize(q.trim());
  const results = $("searchResults");
  results.textContent = "";
  if (!nq) { results.hidden = true; return; }
  const hits = searchIndex
    .map(e => ({ e, i: e.haystack.indexOf(nq) }))
    .filter(x => x.i !== -1)
    .sort((a, b) => a.i - b.i || a.e.name.length - b.e.name.length)
    .slice(0, 8);
  if (!hits.length) { results.append(el("div", "search-empty", "Kein Tool gefunden.")); results.hidden = false; return; }
  hits.forEach(({ e }) => {
    const b = el("button", "search-hit");
    b.append(el("span", "catbtn-icon", catById(e.category).icon), el("span", "", e.name), el("span", "search-cat", catById(e.category).name));
    b.onclick = () => { $("search").value = ""; results.hidden = true; addHistory(); jumpTo(e.id, ""); scrollToWorkspace(); };
    results.append(b);
  });
  results.hidden = false;
}
$("search").addEventListener("input", e => runSearch(e.target.value));
$("search").addEventListener("keydown", e => { if (e.key === "Escape") { e.target.value = ""; $("searchResults").hidden = true; } });
document.addEventListener("click", e => { if (!$("searchWrap").contains(e.target)) $("searchResults").hidden = true; });

// ---------- Eingabe & Tastenkürzel ----------
$("q").addEventListener("input", render);
$("q").addEventListener("keydown", e => { if (e.key === "Enter") addHistory(); });
document.addEventListener("keydown", e => {
  if (document.activeElement === $("q") || document.activeElement === $("search")) return;
  const i = Number(e.key) - 1;
  if (i >= 0 && i < toolButtons.length) { addHistory(); setTool(toolButtons[i].dataset.id, ""); }
});
$("go").onclick = addHistory;

// ---------- Start ----------
const params = new URLSearchParams(location.hash.slice(1));
renderHistory();
const linkedTool = params.get("t");
if (linkedTool && tools[linkedTool]) {
  rebuildToolTabs(tools[linkedTool].category);
  setTool(linkedTool, params.get("q") || "");
} else {
  let startCat = "network";
  try { const c = localStorage.getItem("lastCat"); if (categories.some(x => x.id === c)) startCat = c; } catch {}
  setCategory(startCat);
}
})();
