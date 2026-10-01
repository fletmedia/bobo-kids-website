(function () {
  var WORDS = [
    ['A', 'Apple', '🍎'], ['B', 'Bear', '🐻'], ['C', 'Cat', '🐱'], ['D', 'Duck', '🦆'],
    ['E', 'Elephant', '🐘'], ['F', 'Fish', '🐟'], ['G', 'Grapes', '🍇'], ['H', 'Hat', '🎩'],
    ['I', 'Ice cream', '🍦'], ['J', 'Jeep', '🚙'], ['K', 'Kite', '🪁'], ['L', 'Lion', '🦁'],
    ['M', 'Moon', '🌙'], ['N', 'Nose', '👃'], ['O', 'Orange', '🍊'], ['P', 'Pig', '🐷'],
    ['Q', 'Queen', '👑'], ['R', 'Rainbow', '🌈'], ['S', 'Star', '⭐'], ['T', 'Tree', '🌳'],
    ['U', 'Umbrella', '☂️'], ['V', 'Violin', '🎻'], ['W', 'Whale', '🐳'], ['X', 'Xylophone', '🎶'],
    ['Y', 'Yarn', '🧶'], ['Z', 'Zebra', '🦓']
  ];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  // ---- Speech (Web Speech API; nothing leaves the device) ----
  var synth = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;
  var muted = false, voice = null, speakTimer = 0;
  var NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|pipe|trinoids|whisper|zarvox|superstar|wobble|fred|junior|ralph|kathy|princess|agnes|eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|espeak|robot/i;
  function voiceScore(v) {
    var n = v.name || '', lang = (v.lang || '').replace('_', '-');
    if (!/^en/i.test(lang) || NOVELTY.test(n)) return -1;
    var s = /^en-(US|GB)$/i.test(lang) ? 10 : 5;
    if (/natural|neural|enhanced|premium/i.test(n)) s += 100;   // (a) natural / enhanced / premium
    else if (/google (us )?english/i.test(n)) s += 80;          // (b) Google US English
    else if (/samantha|ava|allison|susan|serena|karen|moira|tessa/i.test(n)) s += 60; // (c) Apple voices
    else if (/^en-US$/i.test(lang)) s += 40;                    // (d) any other en-US
    if (/^en-US$/i.test(lang)) s += 3;
    if (!v.localService) s += 1;
    return s;
  }
  function pickVoice() {
    var best = null, bestScore = -1;
    synth.getVoices().forEach(function (v) {
      var s = voiceScore(v);
      if (s > bestScore) { best = v; bestScore = s; }
    });
    if (best && best !== voice) {
      voice = best;
      if (window.console) console.log('[ABC] speech voice:', voice.name, '(' + voice.lang + ')');
    }
  }
  function speak() {
    if (!synth || muted) return;
    var texts = Array.prototype.slice.call(arguments);
    synth.cancel();
    clearTimeout(speakTimer);
    // short gap after cancel() so browsers don't drop or stutter the next utterance
    speakTimer = setTimeout(function () {
      if (muted) return;
      if (!voice) pickVoice();
      texts.forEach(function (text) {
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 0.9; u.pitch = 1.1; u.volume = 1;
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        synth.speak(u);
      });
    }, 60);
  }
  var muteBtn = $('mute');
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
    else synth.onvoiceschanged = pickVoice;
    // some browsers never fire voiceschanged reliably; poll briefly until voices appear
    var tries = 0, poll = setInterval(function () {
      pickVoice();
      if (synth.getVoices().length || ++tries > 20) clearInterval(poll);
    }, 250);
    muteBtn.hidden = false;
    muteBtn.addEventListener('click', function () {
      muted = !muted;
      muteBtn.setAttribute('aria-pressed', muted);
      muteBtn.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
      if (muted) { clearTimeout(speakTimer); synth.cancel(); }
    });
  }
  function sayLetter(i) { speak(WORDS[i][0] + '!', WORDS[i][0] + ' is for ' + WORDS[i][1]); }

  // ---- Learn mode ----
  var grid = $('grid'), stage = $('stage'), cur = 0, opener = null;
  WORDS.forEach(function (w, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'letter-tile'; b.textContent = w[0];
    b.setAttribute('aria-label', 'Letter ' + w[0] + ', ' + w[1]);
    b.addEventListener('click', function () { opener = b; show(i); });
    grid.appendChild(b);
  });
  function show(i) {
    cur = (i + WORDS.length) % WORDS.length;
    $('st-letter').textContent = WORDS[cur][0] + ' ' + WORDS[cur][0].toLowerCase();
    $('st-pic').textContent = WORDS[cur][2];
    $('st-word').textContent = WORDS[cur][1];
    stage.hidden = false;
    $('st-close').focus();
    sayLetter(cur);
  }
  function closeStage() {
    stage.hidden = true;
    if (synth) synth.cancel();
    if (opener) opener.focus();
  }
  $('st-prev').addEventListener('click', function () { show(cur - 1); });
  $('st-next').addEventListener('click', function () { show(cur + 1); });
  $('st-say').addEventListener('click', function () { sayLetter(cur); });
  $('st-close').addEventListener('click', closeStage);
  stage.addEventListener('click', function (e) { if (e.target === stage) closeStage(); });
  document.addEventListener('keydown', function (e) {
    if (stage.hidden) return;
    if (e.key === 'Escape') closeStage();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
  });

  // ---- Game mode: Find the letter ----
  var target = -1, stars = 0, timer = 0, locked = false;
  var opts = $('opts');
  function say() { speak('Find the letter ' + WORDS[target][0] + '!'); }
  function round() {
    clearTimeout(timer); locked = false;
    var prev = target, picks = [];
    do { target = Math.floor(Math.random() * 26); } while (target === prev);
    picks.push(target);
    while (picks.length < 3) {
      var r = Math.floor(Math.random() * 26);
      if (picks.indexOf(r) < 0) picks.push(r);
    }
    picks.sort(function () { return Math.random() - 0.5; });
    $('prompt').textContent = 'Find the letter ' + WORDS[target][0] + '!';
    opts.textContent = '';
    picks.forEach(function (i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opt'; b.textContent = WORDS[i][0];
      b.setAttribute('aria-label', 'Letter ' + WORDS[i][0]);
      b.addEventListener('click', function () { choose(i, b); });
      opts.appendChild(b);
    });
    say();
  }
  function choose(i, b) {
    if (locked) return;
    if (i !== target) {
      b.classList.remove('oops'); void b.offsetWidth; b.classList.add('oops');
      speak('Oops, try again! Find the letter ' + WORDS[target][0]);
      return;
    }
    locked = true;
    b.classList.add('yay');
    Array.prototype.forEach.call(opts.children, function (o) { if (o !== b) o.disabled = true; });
    stars++;
    $('score').textContent = new Array(Math.min(stars, 10) + 1).join('⭐') + (stars > 10 ? ' ×' + stars : '');
    var r = b.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2);
    speak('Yay! ' + WORDS[i][0] + '! ' + WORDS[i][0] + ' is for ' + WORDS[i][1] + '!');
    timer = setTimeout(round, 3200);
  }
  $('again').addEventListener('click', function () { if (target >= 0) say(); });

  function confetti(x, y) {
    if (reduce) return;
    var colors = ['#a8dcff', '#ffe27a', '#ffb8d2', '#b5ecd0', '#ff8fb1', '#7cc6ff'];
    for (var i = 0; i < 36; i++) {
      var p = document.createElement('div');
      p.className = 'confetti';
      p.style.background = colors[i % colors.length];
      if (i % 3 === 0) p.style.borderRadius = '50%';
      document.body.appendChild(p);
      var a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
      var an = p.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px)', opacity: 1 },
        { transform: 'translate(' + (x + Math.cos(a) * d) + 'px,' + (y + Math.sin(a) * d + 200) + 'px) rotate(' + Math.random() * 720 + 'deg)', opacity: 0 }
      ], { duration: 1000 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' });
      an.onfinish = p.remove.bind(p);
    }
  }

  // ---- Mode tabs ----
  function mode(game) {
    $('learn').hidden = game; $('game').hidden = !game;
    $('tab-learn').setAttribute('aria-pressed', !game); $('tab-learn').classList.toggle('on', !game);
    $('tab-game').setAttribute('aria-pressed', game); $('tab-game').classList.toggle('on', game);
    if (synth) synth.cancel();
    clearTimeout(timer);
    if (game) { stars = 0; $('score').textContent = ''; target = -1; round(); }
  }
  $('tab-learn').addEventListener('click', function () { mode(false); });
  $('tab-game').addEventListener('click', function () { mode(true); });
})();
