// The level control (technique and class pages) and the plain table filter (feats, Domains). Every page reads fine
// without this: it just stays at level 20 and unfiltered.
(function () {
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* a private window or a file:// page may refuse; nothing depends on it */ }
    return null;
  }

  var bar = document.querySelector('[data-levelbar]');
  if (bar) {
    var range = bar.querySelector('input');
    var out = bar.querySelector('output');
    var spans = Array.prototype.map.call(document.querySelectorAll('.v'), function (el) {
      return { el: el, runs: JSON.parse(el.getAttribute('data-r')) };
    });
    var entries = document.querySelectorAll('[data-lv]');
    var apply = function (level) {
      out.textContent = level;
      spans.forEach(function (s) {
        var text = s.runs[0][1];
        s.runs.forEach(function (r) { if (r[0] <= level) text = r[1]; });
        s.el.textContent = text;
      });
      Array.prototype.forEach.call(entries, function (e) {
        e.classList.toggle('later', +e.getAttribute('data-lv') > level);
      });
    };
    var saved = parseInt(store('ra-level'), 10);
    if (saved >= 1 && saved <= 20) range.value = saved;
    apply(+range.value);
    range.addEventListener('input', function () {
      apply(+range.value);
      store('ra-level', range.value);
    });
  }

  // <input data-filter="#tableId"> and optional <select data-filter-col="cat">: AND of words over each row's text.
  Array.prototype.forEach.call(document.querySelectorAll('[data-filter]'), function (input) {
    var table = document.querySelector(input.getAttribute('data-filter'));
    var select = document.querySelector('[data-filter-select="' + input.getAttribute('data-filter') + '"]');
    var count = document.querySelector('[data-filter-count="' + input.getAttribute('data-filter') + '"]');
    var empty = document.querySelector('[data-filter-empty="' + input.getAttribute('data-filter') + '"]');
    var rows = Array.prototype.map.call(table.tBodies[0].rows, function (r) {
      return { r: r, text: r.textContent.toLowerCase(), cat: r.getAttribute('data-cat') };
    });
    var run = function () {
      var words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      var cat = select ? select.value : '';
      var shown = 0;
      rows.forEach(function (x) {
        var ok = (!cat || x.cat === cat) && words.every(function (w) { return x.text.indexOf(w) >= 0; });
        x.r.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown + ' of ' + rows.length;
      if (empty) empty.hidden = shown > 0;
    };
    input.addEventListener('input', run);
    if (select) select.addEventListener('change', run);
    run();
  });
})();
