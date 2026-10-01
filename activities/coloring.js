(function () {
  var COLORS = [
    ['Red', '#ff5a5f'], ['Orange', '#ff9f43'], ['Yellow', '#ffe14d'], ['Lime', '#9be564'],
    ['Green', '#3ec46d'], ['Teal', '#2ec4b6'], ['Sky blue', '#5bc0ff'], ['Blue', '#3d7dff'],
    ['Purple', '#a66cff'], ['Pink', '#ff8fc7'], ['Brown', '#a9714b'], ['White (eraser)', '#ffffff']
  ];
  var color = COLORS[2][1];
  var $ = function (id) { return document.getElementById(id); };
  var sheet = $('sheet-bobo');
  var history = {};   // sheet id -> stack of change-lists [[el, previousFill], ...]

  var pal = $('palette');
  COLORS.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'swatch'; b.style.background = c[1];
    b.setAttribute('aria-label', c[0]);
    b.setAttribute('aria-pressed', i === 2);
    b.addEventListener('click', function () {
      color = c[1];
      Array.prototype.forEach.call(pal.children, function (o) { o.setAttribute('aria-pressed', o === b); });
      $('note').textContent = 'Color: ' + c[0];
    });
    pal.appendChild(b);
  });

  function stack() { return history[sheet.id] || (history[sheet.id] = []); }
  function syncUndo() { $('undo').disabled = stack().length === 0; }

  $('sheets').addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.fill') : null;
    if (!el || el.getAttribute('fill') === color) return;
    stack().push([[el, el.getAttribute('fill')]]);
    el.setAttribute('fill', color);
    syncUndo();
  });

  $('undo').addEventListener('click', function () {
    var last = stack().pop();
    if (last) last.forEach(function (c) { c[0].setAttribute('fill', c[1]); });
    syncUndo();
  });

  $('clear').addEventListener('click', function () {
    var changes = [];
    Array.prototype.forEach.call(sheet.querySelectorAll('.fill'), function (el) {
      if (el.getAttribute('fill') !== '#fff') { changes.push([el, el.getAttribute('fill')]); el.setAttribute('fill', '#fff'); }
    });
    if (changes.length) stack().push(changes);   // Clear can be undone too
    syncUndo();
  });

  $('print').addEventListener('click', function () { window.print(); });

  $('tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-sheet]');
    if (!b) return;
    sheet.hidden = true;
    sheet = $('sheet-' + b.getAttribute('data-sheet'));
    sheet.hidden = false;
    Array.prototype.forEach.call($('tabs').children, function (o) {
      o.setAttribute('aria-pressed', o === b); o.classList.toggle('on', o === b);
    });
    syncUndo();
  });
})();
