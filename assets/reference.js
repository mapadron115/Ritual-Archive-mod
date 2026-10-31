// The technique reference: search, filters, a level slider, and entries built from data/data.json
// (generated from the mod's source by docs/tools/site-extract.py).
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const state = { q: "", collection: "", role: "", level: 20, life: 400, domainOnly: false };
  let techniques = [];

  const store = {
    get(k, d) { try { const v = localStorage.getItem("ra-ref-" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("ra-ref-" + k, JSON.stringify(v)); } catch (e) {} },
  };

  const ctx = () => ({ level: state.level, life: state.life });
  const say = (text, t) => esc(Describe.text(text, t, ctx()));

  function cost(a) {
    if (a.ce === null || a.ce === undefined) return "CE varies";
    return a.ce === 0 ? "no CE" : a.ce + " CE";
  }

  function artRow(a, t, label) {
    const locked = a.level > state.level;
    const meta = [cost(a), a.kind, a.charge ? "hold to charge" : ""].filter(Boolean).join(" · ");
    return `<div class="feature${locked ? " locked" : ""}">
      <span class="lv">L${esc(a.level ?? "?")}</span>
      <div><span class="nm">${esc(label ? label + a.name.replace(/^Maximum: /, "") : a.name)}</span><span class="meta">${esc(meta)}</span></div>
      <div class="tx">${say(a.text, t)}</div></div>`;
  }

  function featureRow(f, t) {
    const locked = (f.level ?? 1) > state.level;
    return `<div class="feature${locked ? " locked" : ""}"><span class="lv">L${esc(f.level ?? "?")}</span>
      <div><span class="nm">${esc(f.name)}</span></div><div class="tx">${say(f.text, t)}</div></div>`;
  }

  function body(t) {
    let h = "";
    h += `<h4>Arts · cast key, switch with <kbd>V</kbd></h4>` + t.arts.map((a) => artRow(a, t)).join("");
    if (t.quick) h += `<h4>Quick key <kbd>F</kbd></h4>` + artRow(t.quick, t);
    if (t.shortcuts) {
      const lines = [];
      if (t.shortcuts.quick) lines.push(`<div class="shortcut"><kbd>F</kbd> also casts <b>${esc(t.shortcuts.quick)}</b></div>`);
      if (t.shortcuts.key1) lines.push(`<div class="shortcut"><kbd>Q</kbd> also casts <b>${esc(t.shortcuts.key1)}</b></div>`);
      if (lines.length) h += `<h4>Shortcut keys · these stay in the cycle too</h4>` + lines.join("");
    }
    // Technique Key 1 already shown as a shortcut isn't listed again.
    const keys = (t.keys || []).map((k, i) => (i === 0 && t.shortcuts && t.shortcuts.key1 ? null : k));
    if (keys.some(Boolean)) {
      const names = ["Q", "Y", "U", "P"];
      h += `<h4>Technique keys</h4>` + keys.map((k, i) => k ? `<div class="shortcut"><kbd>${names[i]}</kbd> ${esc(k)}</div>` : "").join("");
    }
    if (t.other && t.other.length) h += `<h4>Other arts · from keys, forms and feats</h4>` + t.other.map((a) => artRow(a, t)).join("");
    if (t.maximum) h += `<h4>Maximum <kbd>X</kbd></h4>` + artRow(t.maximum, t);
    if (t.passives.length) h += `<h4>Passives</h4>` + t.passives.map((f) => featureRow(f, t)).join("");
    if (t.domain) {
      const d = t.domain;
      const interval = d.sureHitSeconds || 3;
      const facts = [
        `L${d.level}`, `${d.ce} CE`,
        d.open ? "open (no barrier)" : `${Math.round(((d.radiusFeet || 90) / 2) * 10) / 10}-tile radius`,
        `${Math.round(d.durationSeconds || 60)} s`, d.nonlethal ? "harms no one" : `sure-hit every ${interval} s`,
      ];
      const locked = d.level > state.level;
      h += `<h4>Domain Expansion <kbd>C</kbd></h4><div class="domain-box${locked ? " locked" : ""}">
        <div class="nm">${esc(d.name || "Domain")}</div><div class="facts">${esc(facts.join(" · "))}</div>
        ${d.sureHit ? `<div>${esc(Describe.domain(d.sureHit, t, interval, ctx()))}</div>` : ""}</div>`;
    }
    if (t.feats.length) h += `<h4>Technique feats · picked in the book</h4>` + t.feats.map((f) => featureRow(f, t)).join("");
    h += `<p class="link-here"><a href="#${esc(t.id)}">Link to this technique</a></p>`;
    return h;
  }

  function entry(t) {
    const el = document.createElement("details");
    el.className = "tech";
    el.id = t.id;
    if (t.accent) el.style.setProperty("--accent", t.accent);
    const tags = [t.role, t.domain ? "Domain" : "", t.maximum ? "Maximum" : ""].filter(Boolean);
    el.innerHTML = `<summary><span class="swatch" aria-hidden="true"></span>
      <div><div class="name">${esc(t.name)}</div><div class="sub">${esc(t.franchise)} · ${esc(t.collection)} · ${esc(t.tier)}</div></div>
      <div class="tags">${tags.map((g) => `<span class="tag${g === "Domain" ? " dom" : g === "Maximum" ? " ce" : ""}">${esc(g)}</span>`).join("")}</div>
      <div class="sum">${esc(t.summary)}</div></summary><div class="tech-body"></div>`;
    el.addEventListener("toggle", () => { if (el.open) fill(el, t); });
    return el;
  }

  function fill(el, t) { el.querySelector(".tech-body").innerHTML = body(t); }

  function haystack(t) {
    const parts = [t.name, t.franchise, t.collection, t.role, t.summary];
    for (const a of [...t.arts, t.quick, t.maximum, ...t.other].filter(Boolean)) parts.push(a.name, a.text);
    for (const f of [...t.passives, ...t.feats]) parts.push(f.name, f.text);
    if (t.domain) parts.push(t.domain.name, t.domain.sureHit);
    return parts.join(" ").toLowerCase();
  }

  function render() {
    const list = $("#list");
    const q = state.q.trim().toLowerCase();
    let shown = 0;
    for (const t of techniques) {
      const ok = (!state.collection || t.collection === state.collection)
        && (!state.role || t.roles.includes(state.role))
        && (!state.domainOnly || t.domain)
        && (!q || t._hay.includes(q));
      t._el.hidden = !ok;
      if (ok) shown++;
      if (ok && t._el.open) fill(t._el, t);
    }
    $("#count").textContent = `${shown} of ${techniques.length}`;
    $("#empty").hidden = shown > 0;
    list.hidden = shown === 0;
  }

  function options(sel, values) {
    for (const v of values) { const o = document.createElement("option"); o.value = v; o.textContent = v; sel.appendChild(o); }
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const t = techniques.find((x) => x.id === id);
    if (!t) return;
    if (t._el.hidden) { state.q = ""; state.collection = ""; state.role = ""; state.domainOnly = false; syncControls(); render(); }
    t._el.open = true;
    fill(t._el, t);
    t._el.scrollIntoView({ block: "start" });
  }

  function syncControls() {
    $("#q").value = state.q; $("#collection").value = state.collection; $("#role").value = state.role;
    $("#domainOnly").checked = state.domainOnly; $("#level").value = state.level; $("#levelOut").textContent = state.level;
    $("#life").value = state.life;
  }

  async function start() {
    state.level = store.get("level", 20);
    state.life = store.get("life", 400);
    let data;
    try {
      data = await (await fetch("data/data.json")).json();
    } catch (e) {
      $("#empty").hidden = false;
      $("#empty").textContent = "The technique list didn't load. Open this page from the website, not from a file on disk.";
      return;
    }
    techniques = data.techniques;
    const list = $("#list");
    const frag = document.createDocumentFragment();
    for (const t of techniques) {
      t.roles = (t.role || "").split("/").map((r) => r.replace(/\(.*\)/, "").trim()).filter(Boolean);
      t._hay = haystack(t);
      t._el = entry(t);
      frag.appendChild(t._el);
    }
    list.appendChild(frag);
    options($("#collection"), [...new Set(techniques.map((t) => t.collection))].sort());
    options($("#role"), [...new Set(techniques.flatMap((t) => t.roles))].sort());
    $("#total").textContent = techniques.length;
    syncControls();
    render();
    openFromHash();
  }

  $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#collection").addEventListener("change", (e) => { state.collection = e.target.value; render(); });
  $("#role").addEventListener("change", (e) => { state.role = e.target.value; render(); });
  $("#domainOnly").addEventListener("change", (e) => { state.domainOnly = e.target.checked; render(); });
  $("#level").addEventListener("input", (e) => {
    state.level = parseInt(e.target.value, 10); $("#levelOut").textContent = state.level; store.set("level", state.level); render();
  });
  $("#life").addEventListener("change", (e) => {
    const v = Math.max(100, Math.min(1000, parseInt(e.target.value, 10) || 400));
    state.life = v; e.target.value = v; store.set("life", v); render();
  });
  window.addEventListener("hashchange", openFromHash);
  start();
})();
