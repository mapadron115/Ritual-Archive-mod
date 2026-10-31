// Fills the rules page's class and feat lists from data/data.json, so they match the mod's own text.
(function () {
  "use strict";
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const NAMES = { ShikigamiUser: "Shikigami User", SupportSpecialist: "Support Specialist", HeavenlyRestriction: "Heavenly Restriction" };
  const row = (f) => `<div class="feature"><span class="lv">L${esc(f.level ?? 1)}</span><div><span class="nm">${esc(f.name)}</span>`
    + (f.needs ? `<span class="meta">needs ${esc(f.needs)}</span>` : "") + `</div><div class="tx">${esc(f.text)}`
    + (f.options && f.options.length ? `<ul>${f.options.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>` : "") + `</div></div>`;

  fetch("data/data.json").then((r) => r.json()).then((data) => {
    document.getElementById("classList").innerHTML = data.classes.map((c) =>
      `<details class="fold"><summary>${esc(NAMES[c.key] || c.key)} <small>${esc(c.pitch)}</small></summary>
       <div class="fold-body">${c.features.map(row).join("")}</div></details>`).join("");

    const groups = {};
    for (const f of data.feats) (groups[f.category] = groups[f.category] || []).push(f);
    document.getElementById("featList").innerHTML = Object.keys(groups).map((g) =>
      `<details class="fold"><summary>${esc(g)} <small>${groups[g].length} feats</small></summary>
       <div class="fold-body">${groups[g].map(row).join("")}</div></details>`).join("");
  }).catch(() => {
    const msg = "<p class=\"muted\">This list didn't load. Open the page from the website, not from a file on disk.</p>";
    document.getElementById("classList").innerHTML = msg;
    document.getElementById("featList").innerHTML = msg;
  });
})();
