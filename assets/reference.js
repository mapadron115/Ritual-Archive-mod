// The technique reference: search, filters, a level slider, and entries built from data/data.json
// (generated from the mod's source by docs/tools/site-extract.py).
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const state = { q: "", collection: "", role: "", level: 20, life: 400, domainOnly: false };
  let techniques = [];
  // Techniques the owner has shelved: they stay in the mod but aren't listed here. Remove an id to bring it back.
  const SHELVED = new Set(["e243"]);
  // The artist's animated art (data/art.json, from docs/tools/site-art.py): aliens, and Domain/Maximum art by key.
  let artData = { aliens: [], art: {} };
  const keyOf = (t) => (t.file || "").split("/").pop().replace(/\.cs$/, "");
  const artOf = (t) => artData.art[keyOf(t)] || {};

  // An animated effect on a small dark stage (in either theme), crisp pixels; additive art (drawn on black) is blended
  // as light, so its black falls away.
  function fx(src, additive, alt, cls) {
    return src ? `<span class="fx-stage${cls ? " " + cls : ""}"><img class="fx${additive ? " additive" : ""}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy"></span>` : "";
  }

  // One Codon Archive alien: its idle loop, and a showreel of every move while hovered or tapped. The artist's
  // high-detail drawings show at their own size, smoothly; game-sprite fallbacks at the largest whole-number scale that
  // fits a 260-px box, so the pixels stay crisp (the card can still shrink either on a narrow screen).
  const ALIEN_BOX = 260;
  function alienCard(a) {
    const locked = a.level > state.level;
    const k = a.hd ? 1 : Math.max(1, Math.floor(ALIEN_BOX / Math.max(a.w, a.h)));
    return `<figure class="alien${locked ? " locked" : ""}">
      <img class="${a.hd ? "hd" : ""}" src="${esc(a.idle)}" data-idle="${esc(a.idle)}" data-reel="${esc(a.reel)}" alt="${esc(a.name)}" loading="lazy"
        width="${a.w * k}" height="${a.h * k}" tabindex="0" title="Hover or tap to see its moves">
      <figcaption><span class="nm">${esc(a.name)}</span><span class="lv">L${esc(a.level)}</span></figcaption></figure>`;
  }

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

  // One of Ten Shadows' shadows, its sprite beside it at a whole-number scale (crisp pixels, up to about 120 px tall).
  const MOVES = { Walker: "on foot", Hopper: "leaps", Flyer: "flies", Burrower: "burrows", Swarm: "a swarm", Phaser: "incorporeal" };
  function shadowRow(s, t) {
    const k = s.sprite ? Math.max(1, Math.floor(120 / Math.max(s.h, s.w / 1.3))) : 1;
    const img = s.sprite
      ? `<img src="${esc(s.sprite)}" width="${s.w * k}" height="${s.h * k}" alt="${esc(s.name)}" loading="lazy">`
      : "";
    const meta = [s.ce + " CE", MOVES[s.body] || s.body].join(" · ");
    return `<div class="shadow"><div class="pic">${img}</div>
      <div><div><span class="nm">${esc(s.name)}</span><span class="meta">${esc(meta)}</span></div>
      <div class="tx">${say(s.role, t)}</div>
      <div class="tx gift"><b>Shadow Wearing:</b> ${say(s.wear, t)}</div></div></div>`;
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
    // A Maximum granted by a feat (Sky Manipulation's Hurricane) is extracted among the other arts; it's still the
    // technique's Maximum, so it's shown under that heading with its art.
    const maximum = t.maximum || (t.other || []).find((a) => /^Maximum: /.test(a.name));
    const other = (t.other || []).filter((a) => a !== maximum);
    if (other.length) h += `<h4>Other arts · from keys, forms and feats</h4>` + other.map((a) => artRow(a, t)).join("");
    const art = artOf(t);
    if (maximum) h += `<h4>Maximum <kbd>X</kbd></h4>` + artRow(maximum, t) + fx(art.max, art.maxAdditive, maximum.name, "max-fx")
      + (art.maxParts || []).map((p) => fx(p.src, p.additive, maximum.name + " (" + p.name + ")", "max-fx")).join("");
    // A form's own look outside the Maximum (Scarlet Bloom's wings).
    if (art.forms && art.forms.length)
      h += `<h4>Forms</h4>` + art.forms.map((p) => fx(p.src, p.additive, t.name + " (" + p.name + ")", "max-fx")).join("");
    if (t.passives.length) h += `<h4>Passives</h4>` + t.passives.map((f) => featureRow(f, t)).join("");
    if (t.roster) h += `<h4>The shadows</h4><div class="roster">` + t.roster.map((s) => shadowRow(s, t)).join("") + `</div>`;
    if (t.id === "e243" && artData.aliens.length)
      h += `<h4>The aliens · hover or tap one to see its moves</h4><div class="aliens">` + artData.aliens.map(alienCard).join("") + `</div>`;
    if (t.domain) {
      const d = t.domain;
      const interval = d.sureHitSeconds || 3;
      const facts = [
        `L${d.level}`, `${d.ce} CE`,
        d.open ? "open (no barrier)" : `${Math.round(((d.radiusFeet || 90) / 2) * 10) / 10}-tile radius`,
        `${Math.round(d.durationSeconds || 60)} s`, d.nonlethal ? "harms no one" : `sure-hit every ${interval} s`,
      ];
      const locked = d.level > state.level;
      const scene = art.domain || art.surehit
        ? `<div class="domain-art">${art.domain ? `<img class="backdrop" src="${esc(art.domain)}" alt="${esc(d.name)}" loading="lazy">` : ""}
            ${fx(art.surehit, art.surehitAdditive, "sure-hit", "sure")}</div>`
        : "";
      h += `<h4>Domain Expansion <kbd>C</kbd></h4><div class="domain-box${locked ? " locked" : ""}">${scene}
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
    const featMax = (t.other || []).some((a) => /^Maximum: /.test(a.name));
    const tags = [t.role, t.domain ? "Domain" : "", t.maximum || featMax ? "Maximum" : ""].filter(Boolean);
    el.innerHTML = `<summary><span class="swatch" aria-hidden="true"></span>
      <div><div class="name">${esc(t.name)}</div><div class="sub">${esc(t.franchise)} · ${esc(t.collection)} · ${esc(t.tier)}</div></div>
      <div class="tags">${tags.map((g) => `<span class="tag${g === "Domain" ? " dom" : g === "Maximum" ? " ce" : ""}">${esc(g)}</span>`).join("")}</div>
      <div class="sum">${esc(t.summary)}</div></summary><div class="tech-body"></div>`;
    el.addEventListener("toggle", () => { if (el.open) fill(el, t); });
    return el;
  }

  function fill(el, t) {
    el.querySelector(".tech-body").innerHTML = body(t);
    // Aliens play their showreel while hovered (or after a tap on touch screens), then go back to idling.
    for (const img of el.querySelectorAll(".alien img")) {
      const reel = () => { if (img.src.indexOf(img.dataset.reel) < 0) img.src = img.dataset.reel; };
      const idle = () => { img.src = img.dataset.idle; };
      img.addEventListener("mouseenter", reel);
      img.addEventListener("mouseleave", idle);
      img.addEventListener("focus", reel);
      img.addEventListener("blur", idle);
      img.addEventListener("click", () => (img.src.indexOf(img.dataset.reel) < 0 ? reel() : idle()));
    }
  }

  function haystack(t) {
    const parts = [t.name, t.franchise, t.collection, t.role, t.summary];
    for (const a of [...t.arts, t.quick, t.maximum, ...t.other].filter(Boolean)) parts.push(a.name, a.text);
    for (const f of [...t.passives, ...t.feats]) parts.push(f.name, f.text);
    if (t.domain) parts.push(t.domain.name, t.domain.sureHit);
    for (const s of t.roster || []) parts.push(s.name, s.role, s.wear);
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
    techniques = data.techniques.filter((t) => !SHELVED.has(t.id));
    try { artData = await (await fetch("data/art.json")).json(); } catch (e) { /* the page works without art */ }
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
