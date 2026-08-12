(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHOTO_COUNT = 35;

  var DESTINATIONS = [
    { name: 'Costa Rica', lon: -84, lat: 10 },
    { name: 'Sri Lanka', lon: 80, lat: 7 },
    { name: 'Indonesia', lon: 113, lat: -2 },
    { name: 'Filippine', lon: 122, lat: 12 },
    { name: 'Messico', lon: -102, lat: 23 },
    { name: 'Nicaragua', lon: -85, lat: 12 },
    { name: 'Panama', lon: -80, lat: 9 },
    { name: 'Guatemala', lon: -90, lat: 15 },
    { name: 'El Salvador', lon: -89, lat: 13 },
    { name: 'Sudafrica', lon: 25, lat: -29 }
  ];

  var STEPS = [
    {
      t: 'Ciao Amore,',
      sub: '(scusa per la disgrafia delle scritte nella lettera)'
    },
    { t: 'Quest\'anno ho pensato di farti un regalo importante.' },
    { t: 'Inizialmente avevo pensato a qualcosa per l\'università.' },
    {
      t: 'Ma poi ho guardato indietro.',
      visual: 'photos',
      slot: 'top'
    },
    {
      t: 'E ho capito che non era un regalo da scartare a farti sorridere davvero.',
      visual: 'photos',
      slot: 'bottom'
    },
    { t: 'E siccome per me la cosa più importante è vederti sorridere,' },
    { t: 'ho deciso di regalarti qualcosa che so che ti rende felice:' },
    { t: 'Un viaggio.' },
    {
      t: 'Stavolta però ho deciso di andare un po\' più lontano.',
      visual: 'dest',
      slot: 'top',
      destIntro: true
    },
    {
      t: 'Queste sono solo alcune idee a cui avevo pensato.',
      visual: 'dest',
      slot: 'bottom'
    },
    {
      t: 'Però hai davanti l\'inizio di una nuova esperienza, e voglio che questa abbia la priorità.\n\nPer questo il viaggio non ha ancora né una data né una destinazione: voglio sceglierle insieme a te, quando avrà senso farlo.\n\nQuando avrai capito tempi, esami e incastri dell\'università, costruiamo il viaggio e prenotiamo.',
      long: true
    },
    { final: true }
  ];

  var stage = document.getElementById('stage');
  var textzone = document.getElementById('textzone');
  var line = document.getElementById('line');
  var sub = document.getElementById('sub');
  var finale = document.getElementById('finale');
  var wallEl = document.getElementById('wall');
  var destStage = document.getElementById('destStage');
  var globeStack = document.getElementById('globeStack');
  var stepLabel = document.getElementById('step');
  var totalLabel = document.getElementById('total');

  totalLabel.textContent = String(STEPS.length - 1).padStart(2, '0');

  var at = -1;
  var done = false;
  var fading = false;
  var autoTimer = null;
  var touchY = null;

  function readMs(text, isLong) {
    var words = text.split(/\s+/).filter(Boolean).length;
    var base = isLong ? 5200 : 3200;
    var cap = isLong ? 20000 : 14000;
    var floor = isLong ? 9000 : 4000;
    return Math.max(floor, Math.min(cap, base + words * 320));
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function colCount() {
    return 3;
  }

  function makeTile(i) {
    var n = pad(i);
    var path = 'assets/foto/' + n + '.jpg';
    var tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML =
      '<div class="frame">' +
        '<span class="frame__ph mono">foto ' + n + '</span>' +
        '<img class="frame__img" src="' + path + '" alt="" width="600" height="750"' +
          (i <= 4 ? ' decoding="async"' : ' loading="lazy" decoding="async"') + '>' +
        '<span class="frame__alert mono">manca ' + path + '</span>' +
      '</div>';
    return tile;
  }

  function wireMissing(root) {
    root.querySelectorAll('.frame__img').forEach(function (img) {
      function flag() { img.closest('.frame').classList.add('is-missing'); }
      img.addEventListener('error', flag);
      if (img.complete && img.naturalWidth === 0) flag();
    });
  }

  function buildWall() {
    if (!wallEl) return;
    wallEl.innerHTML = '';
    var cols = colCount();
    var buckets = [];
    var c;

    for (c = 0; c < cols; c++) buckets[c] = [];
    for (c = 1; c <= PHOTO_COUNT; c++) buckets[(c - 1) % cols].push(c);

    for (c = 0; c < cols; c++) {
      var col = document.createElement('div');
      var dir = c % 2 === 0 ? 'up' : 'down';
      var speed = c === 2 ? ' col--slow' : '';
      col.className = 'col col--' + dir + speed;

      var track = document.createElement('div');
      track.className = 'col__track';
      buckets[c].forEach(function (i) { track.appendChild(makeTile(i)); });
      buckets[c].forEach(function (i) { track.appendChild(makeTile(i)); });

      col.appendChild(track);
      wallEl.appendChild(col);
    }

    wireMissing(wallEl);
  }

  buildWall();

  function makePin(lon, lat, i) {
    var pin = document.createElement('span');
    pin.className = 'pin';
    pin.style.left = ((lon + 180) / 360 * 100) + '%';
    pin.style.top = ((90 - lat) / 180 * 100) + '%';
    pin.style.setProperty('--delay', (i * 0.55) + 's');
    return pin;
  }

  function makeGlobeSlice() {
    var slice = document.createElement('div');
    slice.className = 'globe__slice';

    var img = document.createElement('img');
    img.className = 'globe__map';
    img.src = 'assets/earth.jpg';
    img.alt = '';
    img.width = 1280;
    img.height = 640;
    img.decoding = 'async';

    var pins = document.createElement('div');
    pins.className = 'globe__pins';
    pins.setAttribute('aria-hidden', 'true');
    DESTINATIONS.forEach(function (d, i) {
      pins.appendChild(makePin(d.lon, d.lat, i));
    });

    slice.appendChild(img);
    slice.appendChild(pins);
    return slice;
  }

  function buildGlobe() {
    var track = document.getElementById('globeTrack');
    if (!track) return;
    track.appendChild(makeGlobeSlice());
    track.appendChild(makeGlobeSlice());
  }

  function buildTicker() {
    var track = document.querySelector('.globe__ticker-track');
    if (!track) return;
    track.innerHTML = '';
    var addSet = function () {
      DESTINATIONS.forEach(function (d) {
        var item = document.createElement('span');
        item.className = 'globe__ticker-item';
        item.textContent = d.name;
        track.appendChild(item);
      });
    };
    addSet();
    addSet();
  }

  buildGlobe();
  buildTicker();

  var destIntroTimers = [];
  var introRoll = null;

  function stopIntroRoll(keepAnimation) {
    if (introRoll && introRoll.raf) cancelAnimationFrame(introRoll.raf);
    var track = document.getElementById('globeTrack');
    if (track && !keepAnimation) {
      track.style.transform = '';
      track.style.animation = '';
      track.style.animationDelay = '';
    }
    introRoll = null;
  }

  function clearDestIntro() {
    destIntroTimers.forEach(clearTimeout);
    destIntroTimers = [];
    stopIntroRoll(false);
    if (globeStack) {
      globeStack.classList.remove('is-intro-wait', 'is-intro-grow');
    }
  }

  function queueDestIntro(fn, ms) {
    destIntroTimers.push(setTimeout(fn, ms));
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function startIntroRoll(onComplete) {
    var track = document.getElementById('globeTrack');
    if (!track) return;

    var FAST = 1 / 0.45;
    var SLOW = 1 / 12;
    var GROW_MS = 900;
    var CRUISE_MS = 2600;
    var DECEL_MS = 2200;
    var t0 = performance.now();

    stopIntroRoll(false);
    introRoll = { pos: 0, last: 0, raf: null };

    function finishHandoff() {
      var pos = introRoll.pos % 1;
      track.style.transform = '';
      track.style.animation = 'globe-roll 12s linear infinite';
      track.style.animationDelay = '-' + (pos * 12) + 's';
      stopIntroRoll(true);
      if (onComplete) onComplete();
    }

    function frame(now) {
      var elapsed = now - t0;
      var speed;

      if (elapsed < GROW_MS) {
        speed = FAST * easeOutCubic(elapsed / GROW_MS);
      } else if (elapsed < GROW_MS + CRUISE_MS) {
        speed = FAST;
      } else if (elapsed < GROW_MS + CRUISE_MS + DECEL_MS) {
        var p = easeInOutCubic((elapsed - GROW_MS - CRUISE_MS) / DECEL_MS);
        speed = FAST + (SLOW - FAST) * p;
      } else {
        finishHandoff();
        return;
      }

      if (introRoll.last) {
        introRoll.pos += speed * ((now - introRoll.last) / 1000);
      }
      introRoll.last = now;
      track.style.transform = 'translate3d(-' + ((introRoll.pos % 1) * 50) + '%, 0, 0)';
      introRoll.raf = requestAnimationFrame(frame);
    }

    introRoll.raf = requestAnimationFrame(frame);
  }

  function startDestIntro() {
    if (!globeStack || reduce) return;

    clearDestIntro();
    globeStack.classList.add('is-intro-wait');

    queueDestIntro(function () {
      globeStack.classList.remove('is-intro-wait');
      globeStack.classList.add('is-intro-grow');
      startIntroRoll(function () {
        globeStack.classList.remove('is-intro-grow');
      });
    }, 700);
  }

  function destPlay(intro) {
    destStage.hidden = false;
    destStage.classList.add('is-on');
    destStage.classList.remove('is-paused');

    if (intro) startDestIntro();
    else clearDestIntro();
  }

  function destStop() {
    clearDestIntro();
    destStage.classList.remove('is-on');
    destStage.classList.add('is-paused');
    destStage.hidden = true;
  }

  function wallPlay() {
    wallEl.classList.add('is-on');
    wallEl.classList.remove('is-paused');
  }

  function wallStop() {
    wallEl.classList.remove('is-on');
    wallEl.classList.add('is-paused');
  }

  function clearAuto() {
    clearTimeout(autoTimer);
    autoTimer = null;
  }

  function scheduleAuto() {
    clearAuto();
    if (done || fading) return;
    var step = STEPS[at];
    if (!step || step.final) return;
    var ms = step.hideText ? 4500 : readMs(step.t, step.long);
    if (step.destIntro && !reduce) ms += 6400;
    autoTimer = setTimeout(function () { go(1); }, ms);
  }

  function setVisual(step) {
    var photos = step.visual === 'photos';
    var dest = step.visual === 'dest';
    if (photos) wallPlay(); else wallStop();
    if (dest) destPlay(!!step.destIntro); else destStop();
  }

  function setLayout(step) {
    var slot = step.slot || 'center';
    textzone.className = 'textzone textzone--' + slot;
    textzone.hidden = !!step.hideText;
    stage.classList.toggle('has-photo-fade', step.visual === 'photos' && slot === 'bottom');
    stage.classList.toggle('has-photo-fade-top', slot === 'top' && (step.visual === 'photos' || step.visual === 'dest'));
    stage.classList.toggle('is-visual-full', !!step.hideText);
  }

  function showFinale() {
    done = true;
    clearAuto();
    wallStop();
    destStop();
    textzone.hidden = true;
    stage.classList.remove('has-photo-fade');
    stage.classList.remove('has-photo-fade-top');
    stage.classList.remove('is-visual-full');
    document.querySelector('.progress').hidden = true;
    stage.classList.add('is-final');
    finale.hidden = false;
    requestAnimationFrame(function () { finale.classList.add('is-in'); });
  }

  function paint(i) {
    var step = STEPS[i];
    if (step.final) {
      showFinale();
      return;
    }

    stepLabel.textContent = String(i + 1).padStart(2, '0');
    setVisual(step);
    setLayout(step);

    line.className = 'line' + (step.long ? ' is-long' : '');
    line.classList.remove('is-out');
    sub.hidden = true;
    sub.classList.remove('is-in', 'is-out');

    if (step.hideText) {
      line.textContent = '';
      scheduleAuto();
      return;
    }

    line.textContent = step.t;

    if (step.sub) {
      sub.hidden = false;
      sub.textContent = step.sub;
      sub.classList.remove('is-out');
      requestAnimationFrame(function () {
        line.classList.add('is-in');
        sub.classList.add('is-in');
      });
    } else {
      requestAnimationFrame(function () { line.classList.add('is-in'); });
    }

    scheduleAuto();
  }

  function go(dir) {
    if (fading) return;

    if (done && dir < 0) {
      fading = true;
      done = false;
      clearAuto();
      finale.classList.remove('is-in');
      setTimeout(function () {
        finale.hidden = true;
        stage.classList.remove('is-final');
        document.querySelector('.progress').hidden = false;
        textzone.hidden = false;
        at = STEPS.length - 2;
        paint(at);
        fading = false;
      }, reduce ? 80 : 720);
      return;
    }

    if (done) return;

    var next = at + dir;
    if (next < 0) return;
    if (next >= STEPS.length) return;
    if (next === at) return;

    clearAuto();
    fading = true;
    if (!textzone.hidden) {
      line.classList.remove('is-in');
      line.classList.add('is-out');
      if (!sub.hidden) {
        sub.classList.remove('is-in');
        sub.classList.add('is-out');
      }
    }

    setTimeout(function () {
      at = next;
      paint(at);
      fading = false;
    }, reduce ? 80 : 720);
  }

  function onWheel(e) {
    if (Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  }

  window.addEventListener('wheel', onWheel, { passive: false });

  window.addEventListener('touchstart', function (e) {
    touchY = e.changedTouches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', function (e) {
    if (touchY === null) return;
    var dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) < 28) return;
    go(dy > 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      go(1);
    }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      go(-1);
    }
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var cols = colCount();
      if (wallEl && wallEl.children.length !== cols) buildWall();
    }, 200);
  });

  at = 0;
  paint(0);
})();
