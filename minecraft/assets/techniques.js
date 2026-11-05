// Search over every technique: names, summaries and all book text (as printed at level 20). Words are ANDed. The list
// is already in the page; this only hides rows and says where each match was found. window.RA_INDEX is search-index.js.
(function () {
  var q = document.getElementById('q');
  if (!q || !window.RA_INDEX) return;
  var coll = document.getElementById('collection');
  var dom = document.getElementById('hasDomain');
  var max = document.getElementById('hasMaximum');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var total = window.RA_INDEX.length;
  var norm = function (s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‘’]/g, "'");
  };

  var items = window.RA_INDEX.map(function (t) {
    var row = document.getElementById('row-' + t.id);
    return {
      t: t, row: row, hits: row.querySelector('.hits'),
      name: norm(t.n + ' ' + t.id + ' ' + t.c), sum: norm(t.s),
      parts: t.p.map(function (p) { return { n: p[0], a: p[1], text: norm(p[0] + ' ' + p[2]) }; })
    };
  });

  var linkFor = function (it, part) {
    var a = document.createElement('a');
    a.href = 'techniques/' + it.t.id + '.html#' + part.a;
    a.textContent = part.n;
    return a;
  };

  var run = function () {
    var words = norm(q.value).split(/\s+/).filter(Boolean);
    var c = coll.value, wantDom = dom.checked, wantMax = max.checked, shown = 0;
    items.forEach(function (it) {
      var ok = (!c || it.t.c === c) && (!wantDom || it.t.d) && (!wantMax || it.t.m);
      var matched = [];
      if (ok && words.length) {
        ok = words.every(function (w) {
          if (it.name.indexOf(w) >= 0 || it.sum.indexOf(w) >= 0) return true;
          return it.parts.some(function (p) { return p.text.indexOf(w) >= 0; });
        });
        if (ok) {
          // Where to look: the entries holding the most of the words, unless the name itself is the match.
          var inName = words.every(function (w) { return it.name.indexOf(w) >= 0; });
          if (!inName) {
            matched = it.parts.filter(function (p) {
              return words.every(function (w) { return p.text.indexOf(w) >= 0; });
            });
            if (!matched.length) matched = it.parts.filter(function (p) {
              return words.some(function (w) { return p.text.indexOf(w) >= 0; });
            });
          }
        }
      }
      it.row.hidden = !ok;
      if (ok) shown++;
      it.hits.textContent = '';
      it.hits.hidden = !matched.length;
      if (matched.length) {
        it.hits.appendChild(document.createTextNode('Found in '));
        matched.slice(0, 4).forEach(function (p, i) {
          if (i) it.hits.appendChild(document.createTextNode(', '));
          it.hits.appendChild(linkFor(it, p));
        });
        if (matched.length > 4) it.hits.appendChild(document.createTextNode(' and ' + (matched.length - 4) + ' more'));
      }
    });
    count.textContent = shown + ' of ' + total;
    empty.hidden = shown > 0;
    var url = q.value ? '?q=' + encodeURIComponent(q.value) : location.pathname.split('/').pop();
    try { history.replaceState(null, '', url); } catch (e) { /* file:// in some browsers */ }
  };

  [q, coll, dom, max].forEach(function (el) {
    el.addEventListener('input', run);
    el.addEventListener('change', run);
  });
  var m = /[?&]q=([^&]*)/.exec(location.search);
  if (m) q.value = decodeURIComponent(m[1].replace(/\+/g, ' '));
  run();
})();
