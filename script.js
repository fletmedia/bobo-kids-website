// Confetti burst on hero button click
(function () {
  var colors = ['#a8dcff', '#ffe27a', '#ffb8d2', '#b5ecd0', '#ff8fb1', '#7cc6ff'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function burst(x, y) {
    if (reduce) return;
    for (var i = 0; i < 40; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti';
      piece.style.background = colors[i % colors.length];
      if (i % 3 === 0) piece.style.borderRadius = '50%';
      document.body.appendChild(piece);

      var angle = Math.random() * Math.PI * 2;
      var dist = 80 + Math.random() * 180;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist - 60;
      var anim = piece.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy + 300) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }
      ], { duration: 1000 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' });
      anim.onfinish = piece.remove.bind(piece);
    }
  }

  var btn = document.getElementById('hero-btn');
  if (btn) {
    btn.addEventListener('click', function (e) {
      var r = btn.getBoundingClientRect();
      burst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    });
  }

  // Smooth scrolling nav (CSS handles most; this covers older browsers)
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
