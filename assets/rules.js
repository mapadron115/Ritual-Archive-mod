// Fills the rules page's class and feat lists from data/data.json, so they match the mod's own text. Numbers are
// worked out (no dice) the way the book does it, at the level and max life last picked on the Techniques page.
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NAMES = { ShikigamiUser: "Shikigami User", SupportSpecialist: "Support Specialist", HeavenlyRestriction: "Heavenly Restriction" };
  const stored = (k, d) => { try { const v = localStorage.getItem("ra-ref-" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const ctx = { level: stored("level", 20), life: stored("life", 400) };
  const say = (s) => esc(window.Describe ? Describe.text(s, null, ctx) : s);
  const row = (f) => `<div class="feature"><span class="lv">L${esc(f.level ?? 1)}</span><div><span class="nm">${esc(f.name)}</span>`
    + (f.needs ? `<span class="meta">needs ${esc(f.needs)}</span>` : "") + `</div><div class="tx">${say(f.text)}`
    + (f.options && f.options.length ? `<ul>${f.options.map((o) => `<li>${say(o)}</li>`).join("")}</ul>` : "") + `</div></div>`;
  const note = `<p class="muted">Numbers are shown for level ${esc(ctx.level)} and ${esc(ctx.life)} max life (set them on the <a href="techniques.html">Techniques</a> page).</p>`;

  fetch("data/data.json").then((r) => r.json()).then((data) => {
    document.getElementById("classList").innerHTML = note + data.classes.map((c) =>
      `<details class="fold"><summary>${esc(NAMES[c.key] || c.key)} <small>${say(c.pitch)}</small></summary>
       <div class="fold-body">${c.features.map(row).join("")}</div></details>`).join("");

    const groups = {};
    for (const f of data.feats) (groups[f.category] = groups[f.category] || []).push(f);
    document.getElementById("featList").innerHTML = note + Object.keys(groups).map((g) =>
      `<details class="fold"><summary>${esc(g)} <small>${groups[g].length} feats</small></summary>
       <div class="fold-body">${groups[g].map(row).join("")}</div></details>`).join("");
  }).catch(() => {
    const msg = "<p class=\"muted\">This list didn't load. Open the page from the website, not from a file on disk.</p>";
    document.getElementById("classList").innerHTML = msg;
    document.getElementById("featList").innerHTML = msg;
  });
})();
