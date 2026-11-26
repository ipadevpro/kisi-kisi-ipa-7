/* Jejak IPA 7 — aplikasi utama. Membutuhkan config.js, figures.js, kisi.js, data.js. */
(function () {
  'use strict';
  const CFG = Object.assign({ sheetUrl: '', classes: [] }, window.JEJAK_CONFIG || {});
  const SYNC_ON = /^https:\/\/script\.google(usercontent)?\.com\//.test(CFG.sheetUrl || '');
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- indeks data ---------- */
  const LESSONS = {};
  UNITS.forEach(u => u.lessons.forEach(l => { l.unit = u; LESSONS[l.id] = l; }));
  const ALL = UNITS.flatMap(u => u.lessons);
  const KISI_BY_NO = {}; KISI.forEach(k => { KISI_BY_NO[k[0]] = k; });
  const LESSON_OF_KISI = {}; ALL.forEach(l => (l.kisi || []).forEach(n => { LESSON_OF_KISI[n] = l; }));
  UNITS.forEach(u => { u.kisi = u.lessons.flatMap(l => l.kisi || []).sort((a, b) => a - b); });
  function ranges(nums) {
    const out = []; let s = null, p = null;
    nums.forEach(n => { if (s === null) { s = p = n; } else if (n === p + 1) { p = n; } else { out.push(s === p ? s : `${s}–${p}`); s = p = n; } });
    if (s !== null) out.push(s === p ? s : `${s}–${p}`);
    return out.join(', ');
  }
  function cpTags(cp) {
    const tags = [];
    const akm = cp.match(/\[AKM ([^\]]+)\]/); if (akm) tags.push(['akm', 'AKM ' + akm[1].replace(' Membaca', '')]);
    const dom = cp.match(/\(([^)]+)\)/);
    if (dom) tags.push(['', dom[1].includes('&') ? 'Paham konsep + skill proses' : dom[1].includes('Keterampilan') ? 'Skill proses' : 'Paham konsep']);
    return tags;
  }

  /* ---------- penyimpanan lokal ---------- */
  const KEY = 'jejak-ipa7-v1';
  const fresh = () => ({ done: {}, xp: 0, streak: 0, last: null, mute: false, music: false, profile: null, device: null, queue: [] });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = fresh(); }
  const uuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  if (!S.device) S.device = uuid().slice(0, 8);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* penyimpanan diblokir: progres hanya bertahan di sesi ini */ } }
  const dayStr = t => { const z = new Date(t); return z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0') + '-' + String(z.getDate()).padStart(2, '0'); };
  function bumpStreak() { const t = dayStr(Date.now()), y = dayStr(Date.now() - 864e5); if (S.last === t) return; S.streak = S.last === y ? S.streak + 1 : 1; S.last = t; }
  function liveStreak() { const t = dayStr(Date.now()), y = dayStr(Date.now() - 864e5); return (S.last === t || S.last === y) ? S.streak : 0; }

  /* ---------- suara, getar, konfeti ---------- */
  /* Bunyi dibuat sekali sebagai file WAV kecil (tanpa file audio tambahan), lalu diputar lewat elemen <audio>.
     Elemen <audio> tetap berbunyi saat iPhone dalam mode senyap, berbeda dengan Web Audio. */
  function makeWav(notes, dur) {
    const sr = 22050, n = Math.ceil(sr * dur), mix = new Float32Array(n);
    notes.forEach(([f, start, len, wave, vol]) => {
      const s0 = Math.floor(start * sr), L = Math.floor(len * sr), att = Math.floor(0.006 * sr);
      for (let i = 0; i < L && s0 + i < n; i++) {
        const ph = (f * i / sr) % 1;
        const v = wave === 'square' ? (ph < .5 ? 1 : -1) * .55 : wave === 'sine' ? Math.sin(2 * Math.PI * ph) : 4 * Math.abs(ph - .5) - 1;
        const env = Math.min(1, i / att) * Math.pow(1 - i / L, 1.6);
        mix[s0 + i] += v * env * vol;
      }
    });
    const buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf), w = (o, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, mix[i])) * 32767, true);
    return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  }
  const SFX_NOTES = {
    ok: [[[659, 0, .14, 'tri', .55], [988, .1, .28, 'tri', .6]], .42],
    bad: [[[233, 0, .18, 'square', .28], [185, .14, .32, 'square', .28]], .5],
    done: [[[523, 0, .2, 'tri', .5], [659, .1, .2, 'tri', .5], [784, .2, .22, 'tri', .5], [1047, .3, .45, 'tri', .55]], .8]
  };
  const AUDIO = {};
  function audioFor(name) {
    if (!AUDIO[name]) { const [notes, dur] = SFX_NOTES[name]; const a = new Audio(makeWav(notes, dur)); a.preload = 'auto'; AUDIO[name] = a; }
    return AUDIO[name];
  }
  function ac() { try { Object.keys(SFX_NOTES).forEach(audioFor); } catch (e) { } } // siapkan bunyi saat interaksi pertama
  const SFX = new Proxy({}, { get: (_, name) => () => { const a = audioFor(name); a.currentTime = 0; const pr = a.play(); if (pr && pr.catch) pr.catch(() => { }); } });
  function sfx(name) { if (S.mute) return; try { SFX[name](); } catch (e) { } }
  /* ---------- musik latar ----------
     Lagu orisinal yang disusun di sini dan dirender di browser menjadi WAV berulang (tanpa file, tanpa lisensi pihak lain).
     116 BPM, C mayor, 8 birama: C – Am – F – G (dua kali). Volume sudah dibuat pelan di dalam WAV karena iPhone tidak
     mengizinkan mengatur volume elemen <audio> lewat kode. Mati secara bawaan. */
  function renderMusic() {
    const sr = 22050, bpm = 116, e8 = 60 / bpm / 2, bars = 8, loop = bars * 8 * e8, n = Math.round(loop * sr), tail = sr;
    const buf = new Float32Array(n + tail), mf = m => 440 * Math.pow(2, (m - 69) / 12);
    const voice = (m, t0, len, kind, vol) => {
      const f = mf(m), s0 = Math.round(t0 * sr), L = Math.round(len * sr), att = Math.round(0.006 * sr);
      for (let i = 0; i < L; i++) {
        const t = i / sr, ph = (f * t) % 1;
        let v;
        if (kind === 'bass') v = 4 * Math.abs(ph - .5) - 1;
        else if (kind === 'pluck') v = Math.sin(2 * Math.PI * ph) + 0.25 * Math.sin(4 * Math.PI * ph);
        else v = 0.7 * (4 * Math.abs(ph - .5) - 1) + 0.3 * (ph < .25 ? 1 : -1) * 0.5;
        const env = Math.min(1, i / att) * (kind === 'pluck' ? Math.exp(-t * 9) : kind === 'bass' ? Math.exp(-t * 3) : Math.max(0, 1 - t / len) * (0.65 + 0.35 * Math.exp(-t * 8)));
        buf[s0 + i] += v * env * vol;
      }
    };
    let seed = 7; const noise = () => { seed = (seed * 16807) % 2147483647; return seed / 1073741823.5 - 1; };
    const hit = (t0, len, vol, kind) => {
      const s0 = Math.round(t0 * sr), L = Math.round(len * sr); let prev = 0;
      for (let i = 0; i < L; i++) {
        const t = i / sr; let v;
        if (kind === 'kick') v = Math.sin(2 * Math.PI * (45 * t + 40 * (1 - Math.exp(-t * 30)) / 30 * 1.0 + 0)) * Math.exp(-t * 18);
        else { const w = noise(); v = (kind === 'hat' ? w - prev : w * 0.6 + prev * 0.4) * Math.exp(-t * (kind === 'hat' ? 60 : 22)); prev = w; }
        buf[s0 + i] += v * vol;
      }
    };
    const CH = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]]; // C, Am, F, G
    const MEL = [
      [76, 0, 79, 0, 76, 74, 72, 0], [72, 0, 76, 0, 74, 72, 69, 0], [69, 72, 74, 0, 77, 0, 76, 74], [74, 0, 71, 0, 74, 0, 0, 0],
      [76, 0, 79, 0, 81, 79, 76, 0], [76, 0, 81, 0, 79, 76, 74, 0], [72, 74, 76, 0, 77, 76, 74, 72], [74, 0, 79, 0, 72, 0, 0, 0]
    ];
    for (let b = 0; b < bars; b++) {
      const ch = CH[b % 4], t = b * 8 * e8;
      [0, 3, 4, 7].forEach((k, j) => voice(ch[0] - 12 + (j === 3 ? 7 : 0), t + k * e8, e8 * (j === 0 ? 2.6 : 1.2), 'bass', 0.30));
      const arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[2] + 12];
      arp.forEach((m, k) => voice(m, t + k * e8, e8 * 1.6, 'pluck', 0.10));
      MEL[b].forEach((m, k) => { if (!m) return; let len = 1; while (k + len < 8 && !MEL[b][k + len] && len < 2) len++; voice(m, t + k * e8, e8 * len * 0.95, 'lead', 0.13); });
      for (let k = 0; k < 8; k++) {
        if (k === 0 || k === 4) hit(t + k * e8, 0.25, 0.55, 'kick');
        if (k === 2 || k === 6) hit(t + k * e8, 0.16, 0.16, 'snare');
        if (k % 2 === 1) hit(t + k * e8, 0.05, 0.10, 'hat');
      }
    }
    for (let i = 0; i < tail; i++) buf[i] += buf[n + i]; // ekor nada di akhir dibungkus ke awal agar loop mulus
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
    const gain = 0.45 / (peak || 1);
    const out = new ArrayBuffer(44 + n * 2), dv = new DataView(out), w = (o, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, buf[i] * gain)) * 32767, true);
    return URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
  }
  let BGM = null, bgmArmed = false;
  function bgmEl() { if (!BGM) { BGM = new Audio(renderMusic()); BGM.loop = true; BGM.preload = 'auto'; } return BGM; }
  function bgmPlay() {
    if (!S.music || document.visibilityState === 'hidden') return;
    const pr = bgmEl().play(); if (pr && pr.catch) pr.catch(armBgm);
  }
  function bgmStop() { if (BGM) BGM.pause(); }
  function armBgm() { // browser baru mengizinkan musik setelah layar disentuh
    if (bgmArmed) return; bgmArmed = true;
    const go = () => { bgmArmed = false; window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true); bgmPlay(); };
    window.addEventListener('pointerdown', go, true); window.addEventListener('keydown', go, true);
  }
  const musicBtn = attr => `<button class="icon-btn" ${attr} data-music aria-pressed="${S.music}" aria-label="Musik latar">${S.music ? ICON.music : ICON.musicOff}</button>`;
  function setMusic(on) {
    S.music = on; save();
    document.querySelectorAll('[data-music]').forEach(b => { b.setAttribute('aria-pressed', String(on)); b.innerHTML = on ? ICON.music : ICON.musicOff; });
    if (on) bgmPlay(); else bgmStop();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bgmStop(); else bgmPlay(); });
  function buzz(p) { if (S.mute || !navigator.vibrate) return; try { navigator.vibrate(p); } catch (e) { } }
  function celebrate() {
    if (reduceMotion() || typeof window.confetti !== 'function') return;
    window.confetti({ particleCount: 110, spread: 75, startVelocity: 38, origin: { y: .65 }, colors: ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#a5ed6e'], disableForReducedMotion: true });
  }

  /* ---------- kirim nilai ke Google Sheet ---------- */
  let syncing = false;
  const syncListeners = new Set();
  function enqueue(rec) { if (!SYNC_ON) return; S.queue.push(rec); if (S.queue.length > 200) S.queue = S.queue.slice(-200); save(); flush(); }
  function payload() {
    const p = S.profile || {};
    return JSON.stringify({ records: S.queue.slice(0, 50).map(r => Object.assign({}, r, { nama: p.nama, kelas: p.kelas, perangkat: S.device })) });
  }
  function notifySync() { syncListeners.forEach(fn => { try { fn(); } catch (e) { } }); }
  async function flush() {
    if (!SYNC_ON || syncing || !S.queue.length || !S.profile) { notifySync(); return; }
    if (navigator.onLine === false) { notifySync(); return; }
    syncing = true; notifySync();
    try {
      // text/plain = "simple request": tanpa preflight OPTIONS, jadi tidak terkena CORS di Apps Script.
      const res = await fetch(CFG.sheetUrl, { method: 'POST', body: payload(), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', cache: 'no-store' });
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.saved)) {
        const saved = new Set(data.saved);
        S.queue = S.queue.filter(r => !saved.has(r.id)); save();
      }
    } catch (e) {
      /* offline atau server sibuk: data tetap di antrean dan dicoba lagi nanti */
    } finally {
      syncing = false; notifySync();
      if (S.queue.length && S.profile && navigator.onLine !== false && flush.retry !== true) { flush.retry = true; setTimeout(() => { flush.retry = false; flush(); }, 15000); }
    }
  }
  function beaconFlush() {
    // Saat tab ditutup/disembunyikan: kirim cadangan. Server mengabaikan ID yang sudah tersimpan.
    if (!SYNC_ON || !S.queue.length || !S.profile || !navigator.sendBeacon) return;
    try { navigator.sendBeacon(CFG.sheetUrl, new Blob([payload()], { type: 'text/plain;charset=UTF-8' })); } catch (e) { }
  }
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') beaconFlush(); else flush(); });
  function syncState() {
    if (!SYNC_ON) return null;
    if (!S.profile) return { cls: 'wait', text: 'Isi nama dan kelas agar nilai terkirim ke guru' };
    if (syncing) return { cls: 'wait', text: 'Mengirim nilai…' };
    if (S.queue.length) return { cls: 'wait', text: navigator.onLine === false ? `${S.queue.length} hasil menunggu internet` : `${S.queue.length} hasil belum terkirim, dicoba lagi otomatis` };
    return { cls: 'ok', text: 'Semua nilai sudah terkirim ke guru' };
  }

  /* ---------- navigasi (hash) ---------- */
  const app = document.getElementById('app'), stage = document.getElementById('stage');
  let pushed = false, L = null, lastFocusId = null, profileOpen = false;
  function openHash(h) {
    if (location.hash.slice(1) === h) return;
    if (!location.hash) { history.pushState(null, '', '#' + h); pushed = true; }
    else history.replaceState(null, '', '#' + h);
  }
  function goHome() {
    closeStage();
    if (pushed) { pushed = false; history.back(); }
    else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }
  function inProgress() { return L && (L.mode === 'lesson' || L.mode === 'test') && L.phase !== 'done' && (L.seen.size > 0 || L.pos > 0); }
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) {
      pushed = false;
      if (stage.hidden) return;
      if (inProgress()) { const id = L.id; askQuit(() => closeStage(), () => { history.pushState(null, '', '#' + (id === 'test' ? 'uji-coba' : id)); pushed = true; }); return; }
      closeStage(); return;
    }
    if (LESSONS[h]) { if (!(L && L.id === h && !stage.hidden)) startLesson(h); return; }
    if (h === 'uji-coba') { if (!(L && L.mode === 'test' && !stage.hidden)) startTest(); return; }
    if (h === 'kisi' || h.startsWith('kisi-')) { openKisi(h.slice(5) || 'all'); return; }
    if (h.startsWith('materi-')) { openNotes(h.slice(7)); return; }
  }
  window.addEventListener('hashchange', route);
  const act = {
    lesson(id) { openHash(id); startLesson(id); },
    test() { openHash('uji-coba'); startTest(); },
    kisi(f) { openHash(f && f !== 'all' ? 'kisi-' + f : 'kisi'); openKisi(f || 'all'); },
    notes(u) { openHash('materi-' + u); openNotes(u); }
  };

  /* ---------- beranda ---------- */
  const OFF = [0, 46, 72, 46, 0, -46, -72, -46];
  function countdown() {
    if (!CFG.examDate) return '';
    const ex = new Date(CFG.examDate); if (isNaN(ex)) return '';
    const days = Math.round((new Date(dayStr(ex)) - new Date(dayStr(Date.now()))) / 864e5);
    if (days < 0) return '';
    return days === 0 ? 'Hari ini' : days === 1 ? 'Besok' : `${days} hari lagi`;
  }
  function renderHome() {
    const next = ALL.find(l => S.done[l.id] == null) || null, doneN = ALL.filter(l => S.done[l.id] != null).length, st = liveStreak(), cd = countdown();
    app.innerHTML = `
  <header class="top"><div class="in">
    <div class="brand">${mascot('', 'happy')}<span>Jejak IPA 7</span></div>
    <div class="stat fire ${st ? 'on' : ''}" title="Hari beruntun">${ICON.fire}<span>${st}</span><span class="sr-only"> hari beruntun</span></div>
    <div class="stat xp" title="Total XP">${ICON.bolt}<span>${S.xp}</span><span class="lbl">&nbsp;XP</span></div>
    ${musicBtn('data-act="music"')}
    <button class="icon-btn" data-act="mute" aria-pressed="${!S.mute}" aria-label="Efek suara dan getar">${S.mute ? ICON.mute : ICON.sound}</button>
  </div></header>
  <main id="main" tabindex="-1">
    <div class="in">
      <section class="hero">
        <div>
          <div class="eyebrow">Persiapan ASAS Ganjil · Kelas VII</div>
          <h1>Belajar IPA, satu langkah kecil tiap hari.</h1>
          <p>${ALL.length} pelajaran singkat dari 5 bab, disusun mengikuti kisi-kisi. Angka di soal alat ukur berganti setiap kali dibuka.</p>
          <div class="hero-actions">
            <button class="btn btn-green" data-act="go" data-id="${(next || ALL[0]).id}">${next ? (doneN ? 'Lanjutkan' : 'Mulai belajar') : 'Ulangi dari awal'}</button>
            <button class="btn btn-ghost" data-act="test">Uji coba ASAS</button>
          </div>
          <div class="progress-line"><div class="mini-bar" role="progressbar" aria-label="Pelajaran selesai" aria-valuemin="0" aria-valuemax="${ALL.length}" aria-valuenow="${doneN}"><i style="width:${doneN / ALL.length * 100}%"></i></div>${doneN}/${ALL.length} selesai</div>
        </div>
        ${mascot('mascot', 'happy')}
      </section>
      <div class="strips">
        <div class="strip">
          <div class="ico kisi">${ICON.list}</div>
          <div class="txt"><b>Kisi-kisi ASAS · ${KISI.length} nomor soal</b><small>${CFG.examInfo || ''}${cd ? ` · <span class="countdown">${cd}</span>` : ''}</small></div>
          <button class="btn btn-ghost btn-sm" data-act="kisi">Lihat</button>
        </div>
        ${SYNC_ON ? profileStrip() : ''}
      </div>
      ${UNITS.map(u => unitHTML(u, next)).join('')}
      <section class="exam">
        <div class="badge">ASAS<br>20</div>
        <div><h2>Uji coba campuran</h2><p>20 soal acak dari semua bab. Hasil akhirnya menunjukkan pelajaran yang perlu diulang${SYNC_ON ? ' dan nilainya terkirim ke guru' : ''}.</p><button class="btn btn-blue" data-act="test">Mulai uji coba</button></div>
      </section>
    </div>
  </main>
  <footer class="foot"><div class="in"><b>Jejak IPA 7</b><p>Latihan mandiri ASAS Ganjil 2026/2027${CFG.school ? ' · ' + CFG.school : ''}</p><p>Soal latihan mengikuti kisi-kisi dengan konteks dan angka yang berbeda dari naskah ujian.</p><button class="btn btn-onc btn-sm" data-act="reset">Hapus progres di perangkat ini</button></div></footer>`;
    if (lastFocusId) {
      const b = app.querySelector(`.node[data-id="${lastFocusId}"]`) || app.querySelector(`[data-act="${lastFocusId}"]`);
      if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'center' }); }
      lastFocusId = null;
    }
  }
  function profileStrip() {
    const p = S.profile, ss = syncState();
    if (p && !profileOpen) return `<div class="strip" id="profile">
      <div class="ico me">${ICON.user}</div>
      <div class="txt"><b>${esc(p.nama)} · ${esc(p.kelas)}</b><small class="sync-line">${ICON.cloud} ${ss.text}</small></div>
      <button class="btn btn-ghost btn-sm" data-act="profile-edit">Ubah</button></div>`;
    return `<form class="strip col" id="profile" novalidate>
      <div class="head"><div class="ico me">${ICON.user}</div><div class="txt"><b>${p ? 'Ubah nama atau kelas' : 'Siapa yang belajar?'}</b><small>Isi nama dan kelas supaya nilai latihanmu terkirim ke guru.</small></div></div>
      <div class="profile-form">
        <label for="pf-nama">Nama panggilan<input id="pf-nama" name="nama" autocomplete="given-name" maxlength="40" value="${p ? esc(p.nama) : ''}" placeholder="contoh: Nayla…"></label>
        <label for="pf-kelas">Kelas<select id="pf-kelas" name="kelas"><option value="">Pilih</option>${CFG.classes.map(c => `<option ${p && p.kelas === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <div class="row-btn"><button class="btn btn-green btn-sm" type="submit">Simpan nama</button>${p ? '<button class="btn btn-text btn-sm" type="button" data-act="profile-cancel">Batal</button>' : ''}<span class="form-err" role="alert"></span></div>
      </div></form>`;
  }
  function refreshProfile() { const el = app.querySelector('#profile'); if (el) el.outerHTML = profileStrip(); }
  syncListeners.add(() => {
    const line = app.querySelector('.sync-line'), ss = syncState();
    if (line && ss) line.innerHTML = `${ICON.cloud} ${ss.text}`;
    const chip = stage.querySelector('.sync'); if (chip && ss) { chip.className = 'sync ' + ss.cls; chip.querySelector('span').textContent = ss.text; }
  });
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function unitHTML(u, next) {
    return `<section class="unit" id="${u.id}" style="--ub:${u.ub};--ub-dark:${u.ubd}">
    <div class="unit-banner">
      <div><div class="eyebrow">Bab ${u.no} · Kisi no. ${ranges(u.kisi)}</div><h2>${u.title}</h2></div>
      <button class="btn btn-onc btn-sm" data-act="notes" data-id="${u.id}">${ICON.book}Materi</button>
    </div>
    <div class="path">${u.lessons.map((l, i) => {
      const done = S.done[l.id] != null, isNext = next && next.id === l.id, cls = done ? 'done' : (isNext ? 'next' : 'todo');
      return `<div class="node-wrap" style="--off:${OFF[i % OFF.length]}px">${isNext ? '<div class="start-tip" aria-hidden="true">Mulai</div>' : ''}
        <button class="node ${cls}" data-act="go" data-id="${l.id}" aria-label="${l.title}${done ? ', selesai' : ''}">${done ? ICON.check : ICON.star}</button>
        <div class="node-label">${l.title}</div>${done ? `<div class="node-sub">Akurasi ${Math.round(S.done[l.id] * 100)}%</div>` : ''}</div>`;
    }).join('')}</div>
  </section>`;
  }
  app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
    ac(); // siapkan bunyi pada interaksi pertama
    if (a === 'go') act.lesson(b.dataset.id);
    else if (a === 'test') act.test();
    else if (a === 'notes') act.notes(b.dataset.id);
    else if (a === 'kisi') act.kisi('all');
    else if (a === 'music') setMusic(!S.music);
    else if (a === 'mute') { S.mute = !S.mute; save(); b.setAttribute('aria-pressed', String(!S.mute)); b.innerHTML = S.mute ? ICON.mute : ICON.sound; if (!S.mute) sfx('ok'); }
    else if (a === 'profile-edit') { profileOpen = true; refreshProfile(); app.querySelector('#pf-nama').focus(); }
    else if (a === 'profile-cancel') { profileOpen = false; refreshProfile(); }
    else if (a === 'reset') confirmDialog({ title: 'Hapus progres?', text: 'XP, hari beruntun, dan tanda selesai di perangkat ini akan dihapus. Nilai yang sudah terkirim ke guru tetap ada.', stay: 'Batal', leave: 'Hapus progres', onLeave() { const keep = { profile: S.profile, device: S.device, queue: S.queue, mute: S.mute }; S = Object.assign(fresh(), keep); save(); renderHome(); } });
  });
  app.addEventListener('submit', e => {
    if (e.target.id !== 'profile') return; e.preventDefault();
    const f = e.target, nama = f.nama.value.trim().replace(/\s+/g, ' '), kelas = f.kelas.value, err = f.querySelector('.form-err');
    if (nama.length < 2) { err.textContent = 'Tulis nama panggilanmu, minimal 2 huruf.'; f.nama.focus(); return; }
    if (!kelas) { err.textContent = 'Pilih kelasmu dulu.'; f.kelas.focus(); return; }
    S.profile = { nama, kelas }; profileOpen = false; save(); refreshProfile(); flush();
  });
  app.addEventListener('input', e => { const f = e.target.form; if (f && f.id === 'profile') { const err = f.querySelector('.form-err'); if (err) err.textContent = ''; } });

  /* ---------- tampilan tiap jenis soal ---------- */
  const ctxOf = it => it.ctx || '';
  function kisiMini(les) {
    const nums = les && les.kisi || []; if (!nums.length) return '';
    return `<details class="kisi-mini"><summary>Ini buat kisi-kisi no. ${ranges(nums)}</summary><ol>${nums.map(n => { const k = KISI_BY_NO[n]; return `<li><span class="no">${n}</span><b>${k[2]}.</b> ${k[3]}</li>`; }).join('')}</ol></details>`;
  }
  const VIEW = {
    tip(it) { return { html: `<div class="tip"><div class="tip-head">${mascot('', 'happy')}<h2>${it.title}</h2></div>${it.body}${kisiMini(LESSONS[it.lid])}</div>` }; },
    mc(it) {
      const ord = shuffle(it.opts.map((_, i) => i)); let sel = -1, root;
      return {
        html: `${ctxOf(it)}<h2 class="q">${it.q}</h2><div class="opts" role="radiogroup" aria-label="Pilihan jawaban">${ord.map((oi, k) => `<button class="opt" role="radio" aria-checked="false" data-k="${k}"><span class="key" aria-hidden="true">${k + 1}</span><span>${it.opts[oi]}</span></button>`).join('')}</div><div class="hint">Ketuk pilihan atau tekan angka 1–${ord.length}.</div>`,
        mount(r, ready) { root = r; r.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { if (root.dataset.locked) return; sel = +b.dataset.k; r.querySelectorAll('.opt').forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-checked', String(x === b)); }); ready(true); })); },
        key(n) { const b = root.querySelectorAll('.opt')[n - 1]; if (b) b.click(); },
        check() { root.dataset.locked = 1; const ok = ord[sel] === it.a, bs = root.querySelectorAll('.opt'); bs.forEach(b => b.classList.remove('sel')); bs[sel].classList.add(ok ? 'right' : 'wrong'); if (!ok) bs[ord.indexOf(it.a)].classList.add('right'); return { ok, answer: it.opts[it.a] }; }
      };
    },
    num(it) {
      let root; const id = 'num-' + it.uid;
      return {
        html: `${ctxOf(it)}<h2 class="q" id="${id}-q">${it.q}</h2><div class="num-row"><label for="${id}">Jawabanmu${it.unit ? ` (dalam ${it.unit})` : ''}</label><input class="num-in" id="${id}" name="jawaban" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="${id}-q"><span class="unit-tag" aria-hidden="true">${it.unit || ''}</span></div><div class="hint">Pakai koma untuk desimal, misalnya 2,36.</div>`,
        mount(r, ready) { root = r; const inp = r.querySelector('input'); inp.addEventListener('input', () => ready(inp.value.trim() !== '')); if (matchMedia('(pointer: fine)').matches) setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { } }, 50); },
        check() { const inp = root.querySelector('input'); inp.readOnly = true; const n = parseNum(inp.value), ok = !isNaN(n) && Math.abs(n - it.ans) <= (it.tol == null ? 1e-6 : it.tol); inp.classList.add(ok ? 'right' : 'wrong'); return { ok, answer: `${fmt(it.ans, it.dec)} ${it.unit || ''}` }; }
      };
    },
    match(it) {
      const n = it.left.length, ro = shuffle([...Array(n).keys()]); let sL = null, sR = null, got = 0, miss = 0, root, busy = false;
      return {
        html: `<h2 class="q">${it.q}</h2><div class="match"><div class="mcol">${it.left.map((t, i) => `<button class="tile" data-s="L" data-i="${i}">${t}</button>`).join('')}</div><div class="mcol">${ro.map(i => `<button class="tile" data-s="R" data-i="${i}">${it.right[i]}</button>`).join('')}</div></div><div class="hint">Ketuk satu kartu kiri, lalu pasangannya di kanan.</div>`,
        mount(r, ready) {
          root = r;
          r.querySelectorAll('.tile').forEach(b => b.addEventListener('click', () => {
            if (busy || b.classList.contains('done') || root.dataset.locked) return;
            if (b.dataset.s === 'L') { if (sL) sL.classList.remove('sel'); sL = sL === b ? null : b; } else { if (sR) sR.classList.remove('sel'); sR = sR === b ? null : b; }
            b.classList.toggle('sel', b === sL || b === sR);
            if (sL && sR) {
              const a = sL, c = sR; sL = sR = null; a.classList.remove('sel'); c.classList.remove('sel');
              if (a.dataset.i === c.dataset.i) { a.classList.add('done'); c.classList.add('done'); a.disabled = c.disabled = true; got++; if (got === n) ready(true); }
              else { miss++; busy = true; buzz(20); a.classList.add('badflash'); c.classList.add('badflash'); setTimeout(() => { a.classList.remove('badflash'); c.classList.remove('badflash'); busy = false; }, 450); }
            }
          }));
        },
        check() { root.dataset.locked = 1; return { ok: miss === 0, answer: it.left.map((l, i) => /<svg/.test(l) ? it.right[i] : `${l} → ${it.right[i]}`).join('; '), note: miss ? `Semua pasangan sudah ketemu, tetapi ada ${miss} percobaan yang keliru.` : '' }; }
      };
    },
    sort(it) {
      const items = shuffle(it.items.map((x, i) => ({ t: x[0], b: x[1], i }))); let sel = null, root;
      return {
        html: `<h2 class="q">${it.q}</h2><div class="pool" aria-label="Kartu yang belum dikelompokkan">${items.map(x => `<button class="chip" data-i="${x.i}">${x.t}</button>`).join('')}</div><div class="bins">${it.bins.map((b, bi) => `<div class="bin" data-bin="${bi}"><button class="bin-h" data-bin="${bi}">${b}</button><div class="bin-body"></div></div>`).join('')}</div><div class="hint">Ketuk kartu, lalu ketuk kotak tujuannya. Ketuk kartu di kotak untuk memindahkannya lagi.</div>`,
        mount(r, ready) {
          root = r; const pool = r.querySelector('.pool');
          const arm = on => r.querySelectorAll('.bin').forEach(b => b.classList.toggle('armed', on));
          r.addEventListener('click', e => {
            if (root.dataset.locked) return; const chip = e.target.closest('.chip');
            if (chip) { if (sel === chip) { chip.classList.remove('sel'); sel = null; arm(false); return; } if (sel) sel.classList.remove('sel'); sel = chip; chip.classList.add('sel'); arm(true); return; }
            const bin = e.target.closest('.bin');
            if (bin && sel) { const moved = sel; bin.querySelector('.bin-body').appendChild(moved); moved.classList.remove('sel'); sel = null; arm(false); ready(pool.children.length === 0); const nx = pool.querySelector('.chip'); if (nx && e.detail === 0) nx.focus(); else if (e.detail === 0) moved.focus(); }
            else if (e.target.closest('.pool') && sel && sel.parentElement !== pool) { pool.appendChild(sel); sel.classList.remove('sel'); sel = null; arm(false); ready(false); }
          });
        },
        check() {
          root.dataset.locked = 1; let ok = true;
          root.querySelectorAll('.bin').forEach(b => { const bi = +b.dataset.bin; b.querySelectorAll('.chip').forEach(c => { const right = it.items[+c.dataset.i][1] === bi; c.classList.add(right ? 'right' : 'wrong'); if (!right) ok = false; }); });
          return { ok, answer: it.bins.map((b, bi) => `<b>${b}</b>: ${it.items.filter(x => x[1] === bi).map(x => x[0]).join(', ')}`).join('<br>') };
        }
      };
    },
    ohaus(it) {
      const r = [0, 0, 0]; let root; const T = it.target, A = Math.min(500, Math.floor(T / 100) * 100), B = Math.floor((T - A) / 10) * 10, C = Math.round((T - A - B) * 10) / 10;
      const meta = [{ max: 500, step: 100 }, { max: 100, step: 10 }, { max: 10, step: 0.1 }];
      return {
        html: `<div class="ctx"><p>${it.story}</p></div><h2 class="q">${it.q}</h2><div class="fig oh-fig"></div>
      <div class="riders">${meta.map((m, k) => `<div class="rrow"><label for="rid-${it.uid}-${k}">Lengan ${'ABC'[k]} (0–${m.max} g)</label><output id="out-${it.uid}-${k}" for="rid-${it.uid}-${k}">0 g</output>
      <div class="rctl"><button class="step" data-k="${k}" data-d="-1" aria-label="Geser anting lengan ${'ABC'[k]} ke kiri">−</button><input type="range" id="rid-${it.uid}-${k}" data-k="${k}" min="0" max="${m.max}" step="${m.step}" value="0"><button class="step" data-k="${k}" data-d="1" aria-label="Geser anting lengan ${'ABC'[k]} ke kanan">+</button></div></div>`).join('')}</div>
      <div class="sumline" aria-live="polite">Jumlah posisi anting: <b class="oh-sum">0 g</b></div>`,
        mount(rt, ready) {
          root = rt;
          const draw = () => {
            const sum = Math.round((r[0] + r[1] + r[2]) * 10) / 10;
            rt.querySelector('.oh-fig').innerHTML = svgOhaus(r, T - sum);
            rt.querySelector('.oh-sum').textContent = fmt(sum, 1) + ' g';
            meta.forEach((m, k) => { rt.querySelector(`#out-${it.uid}-${k}`).textContent = fmt(r[k], k === 2 ? 1 : 0) + ' g'; rt.querySelector(`#rid-${it.uid}-${k}`).value = r[k]; });
            ready(sum > 0);
          };
          rt.querySelectorAll('input[type=range]').forEach(inp => inp.addEventListener('input', () => { if (root.dataset.locked) return; const k = +inp.dataset.k; r[k] = k === 2 ? Math.round(+inp.value * 10) / 10 : +inp.value; draw(); }));
          rt.querySelectorAll('.step').forEach(b => b.addEventListener('click', () => { if (root.dataset.locked) return; const k = +b.dataset.k, m = meta[k]; r[k] = Math.min(m.max, Math.max(0, Math.round((r[k] + (+b.dataset.d) * m.step) * 10) / 10)); draw(); }));
          draw();
        },
        check() {
          const sum = Math.round((r[0] + r[1] + r[2]) * 10) / 10, ok = Math.abs(sum - T) < 0.05;
          root.dataset.locked = 1; root.querySelectorAll('input,.step').forEach(x => { x.disabled = true; });
          return { ok, answer: `${A} g, ${B} g, dan ${fmt(C, 1)} g (total ${fmt(T, 1)} g)`, note: ok ? '' : `Posisi anting kamu berjumlah ${fmt(sum, 1)} g.` };
        }
      };
    }
  };

  /* ---------- mesin pelajaran ---------- */
  let UID = 0;
  const PRAISE = ['Mantap!', 'Tepat sekali!', 'Keren!', 'Benar!', 'Hebat!'];
  const KICK = { mc: 'Pilih jawaban', num: 'Baca dan hitung', match: 'Pasangkan', sort: 'Kelompokkan', ohaus: 'Setel neraca', tip: 'Materi singkat' };
  function realize(x, lid) { const it = x.t === 'gen' ? GEN[x.g]() : Object.assign({}, x); it.uid = ++UID; it.lid = lid; it.src = x; it.tries = 0; return it; }
  // Soal yang salah diulang SATU kali di akhir pelajaran. Soal alat ukur diulang dengan angka baru.
  const MAX_RETRY = 1;
  function retryOf(it) { const again = it.src && it.src.t === 'gen' ? GEN[it.src.g]() : Object.assign({}, it.src || it); return Object.assign(again, { uid: it.uid, lid: it.lid, src: it.src, tries: (it.tries || 0) + 1 }); }
  function openStage() { if (stage.hidden) { stage.hidden = false; document.body.classList.add('lock'); app.inert = true; } }
  function closeStage() { closeDialog(); stage.hidden = true; stage.innerHTML = ''; document.body.classList.remove('lock'); app.inert = false; if (L && L.id) lastFocusId = L.mode === 'test' ? 'test' : L.id; L = null; renderHome(); }
  function startLesson(id) {
    const les = LESSONS[id]; if (!les) return;
    const q = []; if (les.tip) q.push(Object.assign({ t: 'tip', uid: ++UID, lid: id }, les.tip));
    shuffle(les.items).forEach(x => q.push(realize(x, id)));
    L = { mode: 'lesson', id, title: les.title, queue: q, pos: 0, total: q.filter(x => x.t !== 'tip').length, seen: new Set(), done: new Set(), firstOk: 0, combo: 0, t0: Date.now(), wrongBy: {} };
    openStage(); renderStep();
  }
  function startTest() {
    const used = new Set(), pool = [];
    ALL.forEach(l => { const it = pick(l.items); used.add(it); pool.push(realize(it, l.id)); });
    let guard = 0;
    while (pool.length < 20 && guard++ < 300) { const l = pick(ALL), it = pick(l.items); if (used.has(it)) continue; used.add(it); pool.push(realize(it, l.id)); }
    const q = shuffle(pool).slice(0, 20);
    L = { mode: 'test', id: 'test', title: 'Uji coba ASAS', queue: q, pos: 0, total: q.length, seen: new Set(), done: new Set(), firstOk: 0, combo: 0, t0: Date.now(), wrongBy: {} };
    openStage(); renderStep();
  }
  const pct = () => L.mode === 'lesson' ? L.done.size / L.total : L.pos / L.total;
  function renderStep() {
    const it = L.queue[L.pos]; L.phase = 'answer'; const v = VIEW[it.t](it); L.view = v; L.item = it; const p = pct();
    const isTip = it.t === 'tip', les = LESSONS[it.lid];
    stage.innerHTML = `<div class="st-head"><div class="st-in head-row"><button class="icon-btn" data-st="quit" aria-label="Keluar dari latihan">${ICON.x}</button><div class="bar" role="progressbar" aria-label="Kemajuan" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}"><i style="width:${Math.max(p * 100, 3)}%"></i></div><span class="combo" aria-live="polite">${L.combo >= 3 ? L.combo + ' beruntun' : ''}</span>${musicBtn('data-st="music"')}</div></div>
  <div class="st-body" tabindex="-1"><div class="st-in"><div class="st-kicker">${KICK[it.t]}${L.mode === 'test' ? `<span class="pill">Soal ${L.pos + 1} dari ${L.total}</span><span class="pill">${les.unit.title}</span>` : ''}${!isTip && L.mode === 'lesson' && L.seen.has(it.uid) ? '<span class="pill">Coba lagi</span>' : ''}</div><div class="item">${v.html}</div></div></div>
  <div class="st-foot"><div class="st-in foot-row"><div class="fb" aria-live="polite"></div><button class="btn btn-green main" data-st="main" ${isTip ? '' : 'disabled'}>${isTip ? 'Lanjut' : 'Periksa'}</button></div></div>`;
    const root = stage.querySelector('.item');
    if (v.mount) v.mount(root, ok => { const b = stage.querySelector('.main'); if (L && L.phase === 'answer' && b) b.disabled = !ok; });
    if (it.t !== 'num' || !matchMedia('(pointer: fine)').matches) stage.querySelector('.st-body').focus({ preventScroll: true });
  }
  function onMain() {
    if (!L) return; const it = L.item;
    if (it.t === 'tip') { next(); return; }
    if (L.phase === 'answer') { const r = L.view.check(); L.phase = 'fb'; grade(it, r.ok); showFb(r, it); }
    else next();
  }
  function grade(it, ok) {
    if (!L.seen.has(it.uid)) { L.seen.add(it.uid); if (ok) L.firstOk++; else L.wrongBy[it.lid] = (L.wrongBy[it.lid] || 0) + 1; }
    if (ok) { L.done.add(it.uid); L.combo++; sfx('ok'); buzz(12); }
    else {
      L.combo = 0; sfx('bad'); buzz([30, 40, 30]);
      if (L.mode === 'lesson') { if ((it.tries || 0) < MAX_RETRY) L.queue.push(retryOf(it)); else L.done.add(it.uid); }
    }
    const p = pct(), bar = stage.querySelector('.bar i'); if (bar) bar.style.width = Math.max(p * 100, 3) + '%';
    const pb = stage.querySelector('.bar'); if (pb) pb.setAttribute('aria-valuenow', Math.round(p * 100));
    const c = stage.querySelector('.combo'); if (c) c.textContent = L.combo >= 3 ? L.combo + ' beruntun' : '';
  }
  function showFb(r, it) {
    const foot = stage.querySelector('.st-foot'), b = stage.querySelector('.main');
    foot.classList.add(r.ok ? 'ok' : 'bad');
    stage.querySelector('.fb').innerHTML = `<div class="fb-title">${r.ok ? ICON.okc : ICON.badc}${r.ok ? pick(PRAISE) : 'Belum tepat'}</div>${r.note ? `<div class="fb-ans">${r.note}</div>` : ''}${!r.ok ? `<div class="fb-ans">Jawaban benar: ${r.answer}</div>` : ''}${it.ex ? `<div class="fb-ex">${it.ex}</div>` : ''}${!r.ok && L.mode === 'lesson' ? `<div class="fb-ex">${(it.tries || 0) < MAX_RETRY ? (it.src && it.src.t === 'gen' ? 'Soal serupa dengan angka baru akan muncul lagi di akhir.' : 'Soal ini akan muncul sekali lagi di akhir.') : 'Pelajari pembahasannya, lalu lanjut. Kamu bisa mengulang pelajaran ini nanti.'}</div>` : ''}`;
    b.textContent = 'Lanjut'; b.disabled = false; b.className = 'btn main ' + (r.ok ? 'btn-green' : 'btn-red'); b.focus({ preventScroll: true });
  }
  function next() { L.pos++; if (L.pos >= L.queue.length) finish(); else renderStep(); }
  function syncChip() {
    const ss = syncState(); if (!ss) return '';
    return `<div class="sync ${ss.cls}" role="status">${ICON.cloud}<span>${ss.text}</span></div>${!S.profile ? '<button class="btn btn-ghost btn-sm" data-st="profile">Isi nama sekarang</button>' : ''}`;
  }
  const FIN_HEAD = `<div class="st-head"><div class="st-in head-row"><button class="icon-btn" data-st="quit" aria-label="Kembali ke peta pelajaran">${ICON.x}</button></div></div>`;
  function finish() {
    const secs = Math.round((Date.now() - L.t0) / 1000), time = Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    L.phase = 'done';
    if (L.mode === 'lesson') {
      const les = LESSONS[L.id], acc = L.total ? L.firstOk / L.total : 1, xp = 10 + Math.round(acc * 10);
      S.done[L.id] = Math.max(S.done[L.id] || 0, acc); S.xp += xp; bumpStreak(); save();
      enqueue({ id: uuid(), waktu: new Date().toISOString(), jenis: 'Pelajaran', pelajaran: les.title, bab: `Bab ${les.unit.no}: ${les.unit.title}`, benar: L.firstOk, total: L.total, nilai: Math.round(acc * 100), durasi: secs, catatan: '' });
      const nx = ALL.find(l => S.done[l.id] == null);
      stage.innerHTML = `${FIN_HEAD}<div class="st-body" tabindex="-1"><div class="st-in finish">${mascot('mascot', 'happy')}<h1>Pelajaran selesai!</h1><p>${L.title} · ${acc >= 0.8 ? 'Pemahamanmu sudah kuat.' : 'Ulangi sekali lagi supaya makin mantap.'}</p>
      <div class="tiles"><div class="ftile" style="--tc:var(--gold-dark)"><div class="t">XP</div><div class="v">+${xp}</div></div><div class="ftile" style="--tc:var(--green)"><div class="t">Akurasi</div><div class="v">${Math.round(acc * 100)}%</div></div><div class="ftile" style="--tc:var(--blue)"><div class="t">Waktu</div><div class="v">${time}</div></div></div>${syncChip()}</div></div>
      <div class="st-foot"><div class="st-in foot-row"><button class="btn btn-ghost" data-st="again">Ulangi</button>${nx ? `<button class="btn btn-green main" data-st="lesson:${nx.id}">Lanjut: ${nx.title}</button>` : `<button class="btn btn-green main" data-st="quit">Selesai</button>`}</div></div>`;
      sfx('done'); if (acc >= 0.8) celebrate();
    } else {
      const sc = L.firstOk, nilai = Math.round(sc / L.total * 100); S.xp += sc; bumpStreak(); save();
      const weak = Object.entries(L.wrongBy).sort((a, b) => b[1] - a[1]);
      enqueue({ id: uuid(), waktu: new Date().toISOString(), jenis: 'Uji coba', pelajaran: 'Uji coba 20 soal', bab: 'Semua bab', benar: sc, total: L.total, nilai, durasi: secs, catatan: weak.length ? 'Perlu diulang: ' + weak.map(([id, n]) => `${LESSONS[id].title} (${n})`).join(', ') : '' });
      stage.innerHTML = `${FIN_HEAD}<div class="st-body" tabindex="-1"><div class="st-in finish">${mascot('mascot', nilai >= 75 ? 'happy' : 'think')}<h1>Nilai ${nilai}</h1><p>${sc} dari ${L.total} benar dalam ${time}. ${nilai >= 75 ? 'Siap menghadapi ASAS!' : 'Ulangi pelajaran di bawah, lalu coba lagi.'}</p>
      <div class="tiles"><div class="ftile" style="--tc:var(--green)"><div class="t">Benar</div><div class="v">${sc}</div></div><div class="ftile" style="--tc:var(--red)"><div class="t">Salah</div><div class="v">${L.total - sc}</div></div><div class="ftile" style="--tc:var(--gold-dark)"><div class="t">XP</div><div class="v">+${sc}</div></div></div>${syncChip()}
      ${weak.length ? `<div class="weak"><div class="eyebrow">Perlu diulang</div>${weak.map(([id, n]) => `<button class="btn btn-ghost" data-st="lesson:${id}"><span>${LESSONS[id].unit.title}: ${LESSONS[id].title}</span><span>${n} salah</span></button>`).join('')}</div>` : ''}</div></div>
      <div class="st-foot"><div class="st-in foot-row"><button class="btn btn-ghost" data-st="again">Uji coba lagi</button><button class="btn btn-green main" data-st="quit">Kembali ke peta</button></div></div>`;
      sfx('done'); if (nilai >= 75) celebrate();
    }
    stage.querySelector('.main').focus({ preventScroll: true });
  }

  /* ---------- lembar materi & kisi-kisi ---------- */
  function sheet(title, eyebrow, body, footBtn) {
    stage.innerHTML = `<div class="st-head"><div class="st-in head-row"><button class="icon-btn" data-st="quit" aria-label="Tutup">${ICON.x}</button><div class="eyebrow">${eyebrow}</div></div></div>
  <div class="st-body" tabindex="-1"><article class="st-in notes"><h1>${title}</h1>${body}</article></div>
  <div class="st-foot"><div class="st-in foot-row">${footBtn}</div></div>`;
  }
  function openNotes(uid) {
    const u = UNITS.find(x => x.id === uid); if (!u) return;
    const nx = u.lessons.find(l => S.done[l.id] == null) || u.lessons[0];
    L = { mode: 'sheet', id: nx.id, phase: 'done' };
    sheet(u.title, `Bab ${u.no} · Materi ringkas`, u.notes + `<section><button class="btn btn-ghost btn-sm" data-st="kisi:${u.id}">Lihat kisi-kisi bab ini</button></section>`, `<button class="btn btn-green main" data-st="lesson:${nx.id}">Latihan: ${nx.title}</button>`);
    openStage(); stage.querySelector('.st-body').focus({ preventScroll: true });
  }
  function openKisi(filter) {
    const unit = UNITS.find(u => u.id === filter); const cd = countdown();
    L = { mode: 'sheet', id: 'kisi', phase: 'done' };
    const nx = ALL.find(l => S.done[l.id] == null) || ALL[0];
    const rows = KISI.filter(k => !unit || unit.kisi.includes(k[0]));
    const body = `<div class="kisi-meta">${CFG.examLabel ? `<span class="pill">${CFG.examLabel}</span>` : ''}${CFG.examInfo ? `<span class="pill">${CFG.examInfo}</span>` : ''}${cd ? `<span class="pill countdown">${cd}</span>` : ''}</div>
    <div class="kisi-filter" role="group" aria-label="Saring per bab"><button data-st="kisi:all" aria-pressed="${!unit}">Semua</button>${UNITS.map(u => `<button data-st="kisi:${u.id}" aria-pressed="${unit === u}">Bab ${u.no}</button>`).join('')}</div>
    <p>Ini peta materi yang bakal keluar di ASAS. Satu nomor = satu soal. Tiap nomor ada latihannya, tinggal ketuk.</p>
    ${unit ? `<p><b>Bab ${unit.no}: ${unit.title}</b> · ${rows.length} nomor soal</p>` : ''}
    <ol class="kisi-list">${rows.map(k => { const les = LESSON_OF_KISI[k[0]], cp = KISI_CP[k[1]]; return `<li class="kisi-item"><span class="no" aria-label="Nomor ${k[0]}">${k[0]}</span>
      <h4>${k[2]}</h4><p>${k[3]}</p>
      <div class="tags">${cpTags(cp).map(([c, t]) => `<span class="tag ${c}">${t}</span>`).join('')}${les ? `<button class="go" data-st="lesson:${les.id}">Latihan: ${les.title}</button>` : ''}</div></li>`; }).join('')}</ol>`;
    sheet('Kisi-kisi ASAS IPA', 'Asesmen Sumatif Akhir Semester Ganjil', body, `<button class="btn btn-green main" data-st="lesson:${nx.id}">${S.done[nx.id] == null && Object.keys(S.done).length ? 'Lanjutkan latihan' : 'Mulai latihan'}</button>`);
    openStage(); stage.querySelector('.st-body').focus({ preventScroll: true });
  }

  /* ---------- dialog konfirmasi ---------- */
  let dlg = null;
  function confirmDialog({ title, text, stay, leave, onLeave, onStay }) {
    closeDialog();
    const prev = document.activeElement;
    dlg = document.createElement('div'); dlg.className = 'dialog-wrap';
    dlg.innerHTML = `<div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-d">${mascot('', 'think').replace('<svg ', '<svg width="72" height="80" style="justify-self:center" ')}<h2 id="dlg-t">${title}</h2><p id="dlg-d">${text}</p><button class="btn btn-green" data-d="stay">${stay}</button><button class="btn btn-text" data-d="leave">${leave}</button></div>`;
    document.body.appendChild(dlg);
    const done = fn => { closeDialog(); if (prev && prev.focus) try { prev.focus({ preventScroll: true }); } catch (e) { } if (fn) fn(); };
    dlg.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) done(b.dataset.d === 'leave' ? onLeave : onStay); else if (e.target === dlg) done(onStay); });
    dlg.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); done(onStay); }
      if (e.key === 'Tab') { const f = [...dlg.querySelectorAll('button')]; const i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
    });
    dlg.querySelector('[data-d="stay"]').focus();
  }
  function closeDialog() { if (dlg) { dlg.remove(); dlg = null; } }
  function askQuit(onLeave, onStay) {
    confirmDialog({ title: L && L.mode === 'test' ? 'Hentikan uji coba?' : 'Keluar dari pelajaran?', text: L && L.mode === 'test' ? 'Jawabanmu di uji coba ini tidak akan dinilai.' : 'Progres pelajaran ini akan hilang dan harus diulang dari awal.', stay: 'Lanjut belajar', leave: 'Keluar', onLeave, onStay });
  }
  function requestQuit() { if (inProgress()) askQuit(goHome); else goHome(); }

  stage.addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return; const a = b.dataset.st;
    if (a === 'music') setMusic(!S.music);
    else if (a === 'quit') requestQuit();
    else if (a === 'main') onMain();
    else if (a === 'again') { if (L && L.mode === 'test') startTest(); else startLesson(L.id); }
    else if (a === 'profile') { profileOpen = true; goHome(); setTimeout(() => { const i = document.getElementById('pf-nama'); if (i) { i.scrollIntoView({ block: 'center' }); i.focus(); } }, 60); }
    else if (a.startsWith('lesson:')) { const id = a.slice(7); openHash(id); startLesson(id); }
    else if (a.startsWith('kisi:')) { const f = a.slice(5); openHash(f === 'all' ? 'kisi' : 'kisi-' + f); openKisi(f); }
  });
  document.addEventListener('keydown', e => {
    if (stage.hidden || dlg) return;
    if (e.key === 'Escape') { requestQuit(); return; }
    if (e.key === 'Enter') { const btn = e.target.closest && e.target.closest('button,summary,a'); if (btn && !btn.classList.contains('main')) return; const m = stage.querySelector('.main'); if (m && !m.disabled && L && L.mode !== 'sheet') { e.preventDefault(); m.click(); } return; }
    if (/^[1-9]$/.test(e.key) && L && L.phase === 'answer' && L.view && L.view.key && e.target.tagName !== 'INPUT') L.view.key(+e.key);
  });

  /* ---------- toast & service worker (bisa dipakai tanpa internet) ---------- */
  function toast(text, ms) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms || 4000);
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      const first = !navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'activated' && first) toast('Siap dipakai tanpa internet.'); }); });
      }).catch(() => { });
    });
  }

  renderHome();
  if (S.music) armBgm();
  route();
  flush();
})();
