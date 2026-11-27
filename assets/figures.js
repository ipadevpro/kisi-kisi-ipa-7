/* Jejak IPA 7 — helper, ikon, gambar SVG alat ukur, dan generator soal acak.
   File ini dimuat sebelum data.js dan app.js (script biasa, bukan module). */

/* ---------- helper ---------- */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const r2 = n => Math.round(n * 100) / 100;
const NUMFMT = {};
function fmt(n, d) {
  if (d == null) { const s = String(r2(n)); d = (s.split('.')[1] || '').length; }
  const key = d;
  NUMFMT[key] = NUMFMT[key] || new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
  return NUMFMT[key].format(n);
}
/* Semua cara baca yang masuk akal untuk angka yang diketik siswa.
   Koma selalu desimal. Titik bisa desimal (keyboard HP sering hanya punya titik, mis. 0.036)
   atau pemisah ribuan gaya Indonesia (2.500). Jawaban benar bila salah satu cara baca cocok. */
function parseNums(s) {
  s = String(s).trim().replace(/\s/g, '');
  const out = [], num = /^-?(\d+\.?\d*|\.\d+)$/;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) { const t = s.replace(/\./g, '').replace(',', '.'); if (num.test(t)) out.push(parseFloat(t)); }
  if (!s.includes(',') || !s.includes('.')) { const t = s.replace(',', '.'); if (num.test(t)) out.push(parseFloat(t)); }
  return out;
}
const NAMES = ['Raka', 'Nayla', 'Bima', 'Salsa', 'Fikri', 'Alya', 'Dimas', 'Keisha', 'Reza', 'Tiara', 'Galih', 'Nadin', 'Arka', 'Zahra', 'Yusuf', 'Kirana'];
const fig = (svg, cap) => `<figure class="fig">${svg}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;

/* ---------- ikon & maskot ---------- */
const ICON = {
  x: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="currentColor"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5zM13 4h5.5c.8 0 1.5.7 1.5 1.5v12c0 .8-.7 1.5-1.5 1.5H13z" fill="currentColor"/></svg>',
  list: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="4" cy="6" r="1.6" fill="currentColor"/><circle cx="4" cy="12" r="1.6" fill="currentColor"/><circle cx="4" cy="18" r="1.6" fill="currentColor"/></svg>',
  fire: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.5-5 3-6.5 0 2 1 3.5 2.5 3.5C11.5 8 10 6 12 2z" fill="currentColor"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 2L4 13.5h6.5L9.5 22 20 9.5h-6.5z" fill="currentColor"/></svg>',
  music: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 17.5V5.5l11-2.5v12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="3" fill="currentColor"/><circle cx="17.5" cy="15" r="3" fill="currentColor"/></svg>',
  musicOff: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 17.5V5.5l11-2.5v12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="3" fill="currentColor"/><circle cx="17.5" cy="15" r="3" fill="currentColor"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  user: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z" fill="currentColor"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5 4.8 4.8 0 0 1 17.5 18z" fill="currentColor"/></svg>',
  okc: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M9 16.5l5 5 9-10" fill="none" stroke="var(--on-color)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  badc: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M11 11l10 10M21 11L11 21" stroke="var(--on-color)" stroke-width="3.5" stroke-linecap="round"/></svg>'
};
function mascot(cls = 'mascot', mood = 'happy') {
  const think = mood === 'think';
  return `<svg class="${cls}" viewBox="0 0 120 132" role="img" aria-label="Labi, maskot labu Erlenmeyer">
  <path class="m-glass" d="M50 10 H70 V46 A40 40 0 1 1 50 46 Z"/>
  <path class="m-liquid" d="M22.5 90 Q41 82 60 90 T97.5 90 A38 38 0 0 1 22.5 90 Z"/>
  <rect class="m-lip" x="45" y="4" width="30" height="10" rx="5"/>
  <circle class="m-bub" cx="42" cy="104" r="3"/><circle class="m-bub" cx="80" cy="110" r="4"/><circle class="m-bub" cx="70" cy="98" r="2"/>
  <circle class="m-eye" cx="48" cy="68" r="10"/><circle class="m-eye" cx="72" cy="68" r="10"/>
  <circle class="m-pupil" cx="${think ? 46 : 50}" cy="${think ? 66 : 69}" r="4.5"/><circle class="m-pupil" cx="${think ? 70 : 74}" cy="${think ? 66 : 69}" r="4.5"/>
  ${think ? '<path class="m-smile" d="M53 104 H67"/>' : '<path class="m-smile" d="M50 100 Q60 110 70 100"/>'}
</svg>`;
}

/* ---------- gambar alat ukur ---------- */
function svgSorong(R) { // R dalam mm, 1 desimal
  const s = 18, w0 = Math.max(0, Math.floor(R) - 4), span = 22, x0 = 22, X = m => x0 + (m - w0) * s, W = x0 * 2 + span * s;
  let g = `<rect x="2" y="18" width="${W - 4}" height="64" rx="4" class="sv-body"/>`;
  for (let m = w0; m <= w0 + span; m++) {
    const len = m % 10 === 0 ? 26 : (m % 5 === 0 ? 18 : 11);
    g += `<line x1="${X(m)}" y1="82" x2="${X(m)}" y2="${82 - len}" class="sv-tick"/>`;
    if (m % 10 === 0) g += `<text x="${X(m)}" y="44" text-anchor="middle" class="sv-lbl">${m / 10}</text>`;
  }
  g += `<text x="${W - 10}" y="36" text-anchor="end" class="sv-lbl sv-sm sv-mut">cm</text>`;
  g += `<rect x="${X(R) - 16}" y="84" width="${9 * s + 32}" height="56" rx="4" class="sv-vern"/>`;
  for (let k = 0; k <= 10; k++) {
    const x = X(R + k * 0.9).toFixed(2), len = k % 5 === 0 ? 20 : 12;
    g += `<line x1="${x}" y1="84" x2="${x}" y2="${84 + len}" class="sv-tick"/>`;
    if (k % 5 === 0) g += `<text x="${x}" y="${84 + 36}" text-anchor="middle" class="sv-lbl sv-sm">${k}</text>`;
  }
  g += `<text x="${X(R) + 9 * s + 12}" y="134" text-anchor="end" class="sv-lbl sv-sm sv-mut">nonius</text>`;
  return `<svg viewBox="0 0 ${W} 146" role="img" aria-label="Perbesaran skala jangka sorong">${g}</svg>`;
}
function svgMikro(R) { // R dalam mm, 2 desimal
  const s = 34, main = Math.floor(R * 2 + 1e-9) / 2, t = Math.round((R - main) * 100), w0 = Math.max(0, Math.floor(R) - 3), x0 = 26, X = m => x0 + (m - w0) * s, xe = X(R), W = Math.ceil(xe + 150);
  let g = `<rect x="0" y="66" width="${xe}" height="48" class="sv-body"/><line x1="0" y1="90" x2="${xe}" y2="90" class="sv-tick"/>`;
  for (let m = w0; m <= main + 1e-9; m += 0.5) {
    const x = X(m).toFixed(1);
    if (Math.abs(m - Math.round(m)) < 1e-9) g += `<line x1="${x}" y1="90" x2="${x}" y2="72" class="sv-tick"/><text x="${x}" y="60" text-anchor="middle" class="sv-lbl sv-sm">${Math.round(m)}</text>`;
    else g += `<line x1="${x}" y1="90" x2="${x}" y2="108" class="sv-tick"/>`;
  }
  g += `<path d="M${xe} 34 H${xe + 120} Q${xe + 132} 34 ${xe + 132} 46 V134 Q${xe + 132} 146 ${xe + 120} 146 H${xe} Z" class="sv-vern"/>`;
  for (let d = -6; d <= 6; d++) {
    const v = ((t + d) % 50 + 50) % 50, y = 90 - d * 8, big = v % 5 === 0;
    g += `<line x1="${xe}" y1="${y}" x2="${xe + (big ? 20 : 12)}" y2="${y}" class="sv-tick"/>`;
    if (big) g += `<text x="${xe + 26}" y="${y + 4}" class="sv-lbl sv-sm">${v}</text>`;
  }
  g += `<text x="${xe + 124}" y="140" text-anchor="end" class="sv-lbl sv-sm sv-mut">skala putar</text><text x="4" y="128" class="sv-lbl sv-sm sv-mut">skala utama (mm)</text>`;
  return `<svg viewBox="0 0 ${W} 152" role="img" aria-label="Perbesaran skala mikrometer sekrup">${g}</svg>`;
}
const BEAMS = [{ max: 500, step: 100, lab: 100, y: 54 }, { max: 100, step: 10, lab: 10, y: 116 }, { max: 10, step: 0.1, lab: 1, y: 178 }];
function svgOhaus(r, diff) {
  const L = 34, Wd = 380, X = (v, max) => L + v / max * Wd; let g = '';
  BEAMS.forEach((b, k) => {
    g += `<rect x="${L - 12}" y="${b.y - 7}" width="${Wd + 24}" height="14" rx="4" class="sv-body"/>`;
    const n = Math.round(b.max / b.step);
    for (let i = 0; i <= n; i++) {
      const v = i * b.step, x = X(v, b.max).toFixed(1), major = Math.abs(v / b.lab - Math.round(v / b.lab)) < 1e-6, half = k === 2 && i % 5 === 0, len = major ? 12 : (half ? 9 : 5);
      g += `<line x1="${x}" y1="${b.y + 7}" x2="${x}" y2="${b.y + 7 - len}" class="sv-tick"/>`;
      if (major) g += `<text x="${x}" y="${b.y - 15}" text-anchor="middle" class="sv-lbl sv-sm">${Math.round(v)}</text>`;
    }
    g += `<text x="${L - 16}" y="${b.y + 5}" text-anchor="end" class="sv-lbl sv-sm sv-mut">${'ABC'[k]}</text>`;
    const x = X(r[k], b.max);
    g += `<path d="M${x - 9} ${b.y - 13} H${x + 9} L${x + 5} ${b.y + 13} H${x - 5} Z" class="sv-rider"/><line x1="${x}" y1="${b.y - 13}" x2="${x}" y2="${b.y + 13}" class="sv-rider-line"/>`;
  });
  let off = 0;
  if (diff != null && Math.abs(diff) > 0.05) off = Math.sign(diff) * Math.min(30, 5 + Math.sqrt(Math.abs(diff)) * 4);
  const py = 116 - off;
  g += `<rect x="448" y="80" width="26" height="72" rx="4" class="sv-body"/><line x1="448" y1="116" x2="474" y2="116" class="sv-tick"/><text x="461" y="168" text-anchor="middle" class="sv-lbl sv-sm sv-mut">0</text>`;
  g += `<line x1="${L + Wd + 12}" y1="116" x2="458" y2="${py}" class="sv-rider-line" stroke-width="3"/><path d="M466 ${py} L456 ${py - 6} L456 ${py + 6} Z" class="sv-pointer"/>`;
  return `<svg viewBox="0 0 484 200" role="img" aria-label="Lengan neraca Ohaus dengan tiga anting">${g}</svg>`;
}
function svgGelas(v1, v2) {
  const top = 24, base = 224, k = 2, Y = v => base - v * k;
  function cyl(cx, v, rock, lab) {
    const x = cx - 34, w = 68;
    let g = `<rect x="${x + 2}" y="${Y(v)}" width="${w - 4}" height="${v * k}" class="sv-water"/>`;
    if (rock) g += `<path d="M${cx - 20} ${base - 2} L${cx - 25} ${base - 16} L${cx - 10} ${base - 30} L${cx + 8} ${base - 28} L${cx + 22} ${base - 15} L${cx + 18} ${base - 2} Z" class="sv-rock"/>`;
    g += `<line x1="${x + 2}" y1="${Y(v)}" x2="${x + w - 2}" y2="${Y(v)}" class="sv-water-top"/>`;
    for (let m = 0; m <= 100; m += 2) {
      const y = Y(m), big = m % 10 === 0;
      g += `<line x1="${x}" y1="${y}" x2="${x + (big ? 16 : 8)}" y2="${y}" class="sv-tick"/>`;
      if (big && m > 0) g += `<text x="${x - 6}" y="${y + 4}" text-anchor="end" class="sv-lbl sv-sm">${m}</text>`;
    }
    g += `<path d="M${x} ${top} V${base} H${x + w} V${top}" class="sv-glass"/><path d="M${x - 8} ${base + 4} H${x + w + 8}" class="sv-glass"/><text x="${cx}" y="${base + 28}" text-anchor="middle" class="sv-lbl">${lab}</text>`;
    return g;
  }
  return `<svg viewBox="0 0 360 262" role="img" aria-label="Dua gelas ukur sebelum dan sesudah batu dimasukkan">${cyl(110, v1, false, 'Gelas I')}${cyl(262, v2, true, 'Gelas II')}<text x="340" y="22" text-anchor="end" class="sv-lbl sv-sm sv-mut">skala mL</text></svg>`;
}
function svgTermo(T) {
  const Y = t => 300 - (t + 10) * 2.3;
  let g = `<rect x="62" y="14" width="22" height="306" rx="11" class="sv-glass-fill"/><rect x="69" y="${Y(T)}" width="8" height="${320 - Y(T)}" class="sv-red"/><circle cx="73" cy="328" r="18" class="sv-red sv-bulb"/>`;
  for (let t = -10; t <= 110; t += 2) {
    const y = Y(t), big = t % 10 === 0;
    g += `<line x1="88" y1="${y}" x2="${88 + (big ? 16 : 8)}" y2="${y}" class="sv-tick"/>`;
    if (big) g += `<text x="110" y="${y + 4}" class="sv-lbl sv-sm">${t}</text>`;
  }
  g += `<text x="40" y="30" text-anchor="middle" class="sv-lbl sv-mut">°C</text>`;
  return `<svg viewBox="0 0 160 352" style="max-width:190px" role="img" aria-label="Termometer skala Celsius">${g}</svg>`;
}
function svgMistar(a, b, order) { // order: posisi [kiri, tengah, kanan] diberi label nomor 1-3
  const s = 32, x0 = 24, X = c => x0 + c * s;
  let g = `<rect x="${X(0) - 12}" y="118" width="${12 * s + 24}" height="56" rx="4" class="sv-body"/>`;
  for (let m = 0; m <= 120; m++) {
    const x = X(m / 10).toFixed(1), len = m % 10 === 0 ? 20 : (m % 5 === 0 ? 13 : 7);
    g += `<line x1="${x}" y1="118" x2="${x}" y2="${118 + len}" class="sv-tick"/>`;
    if (m % 10 === 0) g += `<text x="${x}" y="160" text-anchor="middle" class="sv-lbl sv-sm">${m / 10}</text>`;
  }
  g += `<text x="${X(12)}" y="112" text-anchor="end" class="sv-lbl sv-sm sv-mut">cm</text>`;
  g += `<rect x="${X(a)}" y="92" width="${X(b) - X(a)}" height="22" rx="6" class="sv-pencil"/>`;
  [X(b) - 84, X(b), X(b) + 84].forEach((ex, i) => {
    g += `<line x1="${ex}" y1="38" x2="${X(b)}" y2="103" class="sv-dash"/><ellipse cx="${ex}" cy="28" rx="14" ry="8" class="sv-eye"/><circle cx="${ex}" cy="29" r="4" class="sv-pupil"/><text x="${ex}" y="12" text-anchor="middle" class="sv-lbl">${order[i]}</text>`;
  });
  return `<svg viewBox="0 0 432 182" role="img" aria-label="Pengukuran panjang benda dengan mistar dan tiga posisi mata bernomor">${g}</svg>`;
}
function svgPartikel() {
  let g = ''; const bx = [12, 136, 260], Y0 = 16;
  bx.forEach((x, i) => { g += `<rect x="${x}" y="${Y0}" width="108" height="100" rx="8" class="sv-box"/><text x="${x + 54}" y="${Y0 + 124}" text-anchor="middle" class="sv-lbl">${'PQR'[i]}</text>`; });
  for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) g += `<circle cx="${bx[0] + 18 + i * 18}" cy="${Y0 + 34 + j * 18}" r="8" class="sv-part"/>`;
  [[16, 88], [34, 86], [52, 89], [70, 86], [88, 88], [25, 70], [43, 72], [61, 70], [79, 72], [34, 55], [54, 57], [72, 54]].forEach(([x, y]) => g += `<circle cx="${bx[1] + x}" cy="${Y0 + y}" r="8" class="sv-part"/>`);
  [[22, 24, 1, 1], [82, 30, -1, 1], [52, 58, 1, -1], [24, 82, 1, -1], [86, 80, -1, -1]].forEach(([x, y, dx, dy]) => { g += `<circle cx="${bx[2] + x}" cy="${Y0 + y}" r="8" class="sv-part"/><path d="M${bx[2] + x + dx * 11} ${Y0 + y + dy * 11} l${dx * 9} ${dy * 9}" class="sv-move"/>`; });
  return `<svg viewBox="0 0 380 148" role="img" aria-label="Model partikel pada tiga ruang P, Q, dan R">${g}</svg>`;
}
const GHS = {
  flame: '<path class="ghs-g" d="M0 -16 C8 -7 11 -1 8 6 C5 11 -5 11 -8 6 C-10 1 -6 -4 -2 -7 C-1 -2 1 0 2 -3 C3 -7 1 -12 0 -16Z"/><rect class="ghs-g" x="-11" y="11" width="22" height="3"/>',
  skull: '<path class="ghs-s" d="M-12 8 L12 16 M12 8 L-12 16"/><circle class="ghs-g" cx="0" cy="-5" r="9"/><rect class="ghs-g" x="-5" y="1" width="10" height="7" rx="1"/><circle class="ghs-bg" cx="-3.5" cy="-5" r="2.6"/><circle class="ghs-bg" cx="3.5" cy="-5" r="2.6"/>',
  corrosive: '<rect class="ghs-g" x="-13" y="-17" width="5" height="11" rx="1" transform="rotate(-30 -10 -11)"/><rect class="ghs-g" x="8" y="-17" width="5" height="11" rx="1" transform="rotate(30 10 -11)"/><path class="ghs-g" d="M-7 -4 q3 5 0 7 q-3 -2 0 -7z M7 -4 q3 5 0 7 q-3 -2 0 -7z"/><path class="ghs-g" d="M-17 8 H-3 V13 H-9 L-11 11 L-13 13 H-17Z M3 8 H17 V13 H3Z"/>',
  explode: '<path class="ghs-g" d="M0 -15 L3 -5 L12 -9 L6 0 L14 6 L4 5 L2 15 L-2 5 L-12 9 L-6 0 L-14 -6 L-4 -5Z"/>',
  enviro: '<path class="ghs-g" d="M-9 -14 L-2 1 H-16 Z"/><rect class="ghs-g" x="-10" y="1" width="2" height="8"/><ellipse class="ghs-g" cx="4" cy="9" rx="7" ry="3.5"/><path class="ghs-g" d="M10 9 L15 5 V13Z"/><path class="ghs-s" d="M-16 15 H16" stroke-width="2"/>'
};
const ghs = (k, label) => `<svg viewBox="-32 -32 64 64" role="img" aria-label="${label}"><rect x="-21" y="-21" width="42" height="42" rx="3" transform="rotate(45)" class="ghs-d"/>${GHS[k]}</svg>`;

/* ---------- generator soal (angka baru setiap kali dibuka) ---------- */
const GEN = {
  sorong() {
    const n = rnd(12, 58), d = rnd(1, 9), R = n + d / 10, obj = pick(['diameter kelereng', 'lebar penghapus', 'diameter tutup botol', 'diameter luar pipa kecil', 'tebal balok kayu mainan']);
    return { t: 'num', q: `${pick(NAMES)} mengukur ${obj} dengan jangka sorong. Berapa hasil pengukurannya?`, ctx: fig(svgSorong(R), 'Perbesaran skala utama dan skala nonius'), ans: Math.round(R * 10) / 100, dec: 2, unit: 'cm', tol: 0.0005,
      ex: `Garis 0 nonius berada sesudah ${fmt(n / 10, 1)} cm. Garis nonius ke-${d} berimpit lurus dengan garis skala utama, jadi ${d} × 0,01 cm = ${fmt(d / 100, 2)} cm. Hasil: ${fmt(n / 10, 1)} + ${fmt(d / 100, 2)} = <b>${fmt(R / 10, 2)} cm</b>.` };
  },
  mikro() {
    const n = rnd(2, 9), half = pick([0, 0.5]), t = rnd(1, 49), R = r2(n + half + t / 100), obj = pick(['tebal koin logam', 'diameter kawat tembaga', 'tebal plat seng', 'tebal kaca preparat', 'tebal tutup kaleng']);
    return { t: 'num', q: `${pick(NAMES)} mengukur ${obj} dengan mikrometer sekrup (ketelitian 0,01 mm). Berapa hasilnya?`, ctx: fig(svgMikro(R), 'Perbesaran skala mikrometer sekrup'), ans: R, dec: 2, unit: 'mm', tol: 0.0005,
      ex: `Skala utama: ${n} mm${half ? ', dan garis setengah milimeter di bawah garis tengah sudah terlihat, jadi ' + fmt(n + 0.5, 1) + ' mm' : ' (garis setengah milimeter belum terlihat)'}. Skala putar: garis ke-${t} sejajar garis tengah, jadi ${t} × 0,01 = ${fmt(t / 100, 2)} mm. Hasil: ${fmt(n + half, 1)} + ${fmt(t / 100, 2)} = <b>${fmt(R, 2)} mm</b>.` };
  },
  ohausRead() {
    const a = pick([100, 200, 300, 400]), b = rnd(0, 9) * 10, c = rnd(0, 19) / 2, m = a + b + c, obj = pick(['batu kali', 'buah apel', 'gembok besi', 'sebungkus gula merah']);
    return { t: 'num', q: `${pick(NAMES)} menimbang ${obj} hingga neraca tiga lengan seimbang (jarum di angka 0). Berapa massanya?`, ctx: fig(svgOhaus([a, b, c], 0), 'Lengan A: 0–500 g, lengan B: 0–100 g, lengan C: 0–10 g'), ans: m, dec: 1, unit: 'g', tol: 0.05,
      ex: `Jumlahkan posisi anting ketiga lengan: ${a} g + ${b} g + ${fmt(c, 1)} g = <b>${fmt(m, 1)} g</b>.` };
  },
  ohausSet() {
    const base = rnd(150, 380) + rnd(0, 9) / 10, add = rnd(12, 60) + rnd(1, 9) / 10, mode = Math.random() < .5, target = Math.round((mode ? base + add : base) * 10) / 10;
    const story = mode ? `${pick(NAMES)} menimbang batu bermassa ${fmt(base, 1)} g. Tanpa menurunkan batu, ia menambahkan kerikil ${fmt(add, 1)} g ke piring yang sama.` : `${pick(NAMES)} akan menimbang sekantong beras bermassa ${fmt(target, 1)} g.`;
    return { t: 'ohaus', target, story, q: 'Geser ketiga anting sampai jarum menunjuk 0 (seimbang).', ex: mode ? `Massa total = ${fmt(base, 1)} + ${fmt(add, 1)} = ${fmt(target, 1)} g. Pecah jadi ratusan, puluhan, dan sisanya.` : `Pecah ${fmt(target, 1)} g jadi ratusan, puluhan, dan sisanya.` };
  },
  ohausMC() {
    let A, B, C, base, take, T, nB, nC;
    do { A = pick([200, 300, 400]); B = rnd(4, 9) * 10; C = rnd(1, 9) + pick([0, 0.5]); base = A + B + C; take = rnd(12, B - 12) + rnd(1, 9) / 10; T = Math.round((base - take) * 10) / 10; nB = Math.floor((T - A) / 10) * 10; nC = Math.round((T - A - nB) * 10) / 10; } while (T < A + 1);
    const who = pick(NAMES), wB = nB + 10 <= 90 ? nB + 10 : nB - 10, wC = Math.round((10 - nC) * 10) / 10 === nC ? Math.round((nC + 1) * 10) / 10 : Math.round((10 - nC) * 10) / 10;
    const o = (b, c) => `Lengan 0–100 g ke ${b} g dan lengan 0–10 g ke ${fmt(c, 1)} g`;
    return { t: 'mc', q: `${who} menimbang toples gula. Neraca seimbang dengan anting di ${A} g, ${B} g, dan ${fmt(C, 1)} g. Lalu ${who} mengambil ${fmt(take, 1)} g gula, toples tetap di piring, dan anting 0–500 g tidak digeser. Agar seimbang lagi, anting lain digeser ke posisi …`,
      opts: [o(nB, nC), o(wB, nC), o(nB, wC), `Lengan 0–500 g ke ${A - 100} g, lengan lain tetap`], a: 0,
      ex: `Massa sisa = ${fmt(base, 1)} − ${fmt(take, 1)} = ${fmt(T, 1)} g. Karena lengan 0–500 g tetap di ${A} g, sisanya ${fmt(T - A, 1)} g dibagi ke lengan 0–100 g (${nB} g) dan lengan 0–10 g (${fmt(nC, 1)} g).` };
  },
  gelasV() {
    const v1 = rnd(15, 30) * 2, dv = rnd(5, 15) * 2, v2 = v1 + dv;
    return { t: 'num', q: `${pick(NAMES)} mencelupkan batu ke gelas ukur seperti gambar. Berapa volume batu?`, ctx: fig(svgGelas(v1, v2), 'Gelas I: sebelum, Gelas II: sesudah batu dicelupkan'), ans: dv, dec: 0, unit: 'cm³', tol: 0.01,
      ex: `V batu = V akhir − V awal = ${v2} mL − ${v1} mL = ${dv} mL = <b>${dv} cm³</b> (1 mL = 1 cm³).` };
  },
  gelasRho() {
    const v1 = rnd(15, 30) * 2, dv = rnd(5, 15) * 2, v2 = v1 + dv, rho = pick([1.5, 2, 2.5, 3, 3.5]), m = dv * rho;
    return { t: 'num', q: `Batu pada gambar ditimbang dan massanya ${fmt(m)} g. Berapa massa jenis batu?`, ctx: fig(svgGelas(v1, v2), 'Gelas I: sebelum, Gelas II: sesudah batu dicelupkan'), ans: rho, dec: 1, unit: 'g/cm³', tol: 0.01,
      ex: `Volume batu = ${v2} − ${v1} = ${dv} cm³. ρ = m ÷ V = ${fmt(m)} ÷ ${dv} = <b>${fmt(rho, 1)} g/cm³</b>. Hati-hati, jangan membagi dengan ${v2} atau ${v1}.` };
  },
  termo() {
    const T = rnd(11, 48) * 2;
    return { t: 'num', q: `${pick(NAMES)} mengukur suhu air hangat dengan termometer seperti gambar. Tuliskan hasilnya dalam satuan SI (kelvin).`, ctx: fig(svgTermo(T), 'Skala Celsius'), ans: T + 273, dec: 0, unit: 'K', tol: 0.01,
      ex: `Raksa berhenti di ${T} °C. T(K) = T(°C) + 273 = ${T} + 273 = <b>${T + 273} K</b>.` };
  },
  mistar() {
    const a = pick([0.5, 1, 1.5, 2.5, 3]), L = rnd(30, 62) / 10, bb = Math.min(Math.round((a + L) * 10) / 10, 9.6), len = Math.round((bb - a) * 10) / 10;
    const order = shuffle(['1', '2', '3']), eye = order[1], obj = pick(['baterai', 'stik es krim', 'penghapus panjang', 'tutup spidol', 'potongan sedotan']);
    if (Math.random() < .5) {
      return { t: 'num', q: `${pick(NAMES)} mengukur ${obj} dengan mistar seperti gambar. Berapa panjang ${obj} itu?`, ctx: fig(svgMistar(a, bb, order), 'Ujung kiri benda tidak berada di angka 0'), ans: len, dec: 1, unit: 'cm', tol: 0.051,
        ex: `Ujung kiri di ${fmt(a, 1)} cm dan ujung kanan di ${fmt(bb, 1)} cm. Panjang = ${fmt(bb, 1)} − ${fmt(a, 1)} = <b>${fmt(len, 1)} cm</b>. Jangan langsung menulis ${fmt(bb, 1)} cm.` };
    }
    return { t: 'mc', q: `${pick(NAMES)} membaca ujung kanan ${obj} pada mistar. Dari nomor berapa mata harus melihat agar tidak terjadi kesalahan paralaks, dan apa alasannya?`, ctx: fig(svgMistar(a, bb, order), 'Tiga kemungkinan posisi mata'),
      opts: [`Nomor ${eye}, karena mata tegak lurus di atas skala yang dibaca`, `Nomor ${order[0]}, karena melihat dari kiri membuat angka lebih jelas`, `Nomor ${order[2]}, karena mata harus searah datangnya cahaya`, 'Ketiganya sama saja asalkan mistarnya lurus'], a: 0,
      ex: `Mata harus tegak lurus di atas titik yang dibaca (nomor ${eye}). Melihat dari samping membuat angka yang terbaca bergeser; itulah kesalahan paralaks.` };
  },
  kelajuan() {
    const v = rnd(2, 8), t = rnd(3, 12) * 5, s = v * t;
    return { t: 'num', q: `${pick(NAMES)} bersepeda lurus sejauh ${s} m dalam ${t} sekon dengan kelajuan tetap. Berapa kelajuannya?`, ans: v, dec: 0, unit: 'm/s', tol: 0.01, ex: `v = s ÷ t = ${s} m ÷ ${t} s = <b>${v} m/s</b>. Kelajuan adalah besaran turunan (panjang dibagi waktu).` };
  },
  newton2() {
    const m = rnd(2, 8), a = rnd(2, 6), F = m * a;
    return { t: 'num', q: `Troli bermassa ${m} kg didorong dengan resultan gaya ${F} N. Berapa percepatannya?`, ans: a, dec: 0, unit: 'm/s²', tol: 0.01, ex: `Hukum II Newton: a = ΣF ÷ m = ${F} ÷ ${m} = <b>${a} m/s²</b>. Massa makin besar, percepatan makin kecil.` };
  }
};
