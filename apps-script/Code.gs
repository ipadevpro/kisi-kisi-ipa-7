/**
 * Jejak IPA 7 — penerima nilai untuk Google Sheet.
 *
 * Cara pasang (lihat juga README.md):
 * 1. Buat Google Sheet baru, lalu Ekstensi → Apps Script.
 * 2. Hapus isi Code.gs bawaan, tempel seluruh file ini, simpan.
 * 3. Terapkan → Deployment baru → jenis "Aplikasi web".
 *    Jalankan sebagai: Saya. Yang memiliki akses: Siapa saja.
 * 4. Salin URL Aplikasi web (berakhiran /exec) ke config.js → sheetUrl.
 *
 * Kenapa tidak kena CORS: aplikasi mengirim POST dengan Content-Type
 * "text/plain", yaitu "simple request" yang tidak memicu preflight OPTIONS
 * (Apps Script memang tidak bisa menjawab OPTIONS). Balasan Apps Script
 * dialihkan ke script.googleusercontent.com yang menyertakan header
 * Access-Control-Allow-Origin: *, sehingga browser boleh membaca balasannya.
 */

const SHEET_HASIL = 'Hasil';
const SHEET_REKAP = 'Rekap Uji Coba';
const HEADERS = ['Waktu', 'ID', 'Nama', 'Kelas', 'Jenis', 'Pelajaran', 'Bab', 'Benar', 'Jumlah Soal', 'Nilai', 'Durasi (detik)', 'Perangkat', 'Catatan'];
const MAX_RECORDS = 50;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const records = (Array.isArray(body.records) ? body.records : [body]).slice(0, MAX_RECORDS);
    const sheet = getHasilSheet_();
    const last = sheet.getLastRow();
    const existing = new Set(last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues().map(r => String(r[0])) : []);
    const rows = [];
    const saved = [];
    records.forEach(r => {
      const id = clean_(r.id, 64);
      if (!id) return;
      saved.push(id);                // tetap dianggap tersimpan agar klien berhenti mengirim ulang
      if (existing.has(id)) return;  // kiriman ganda diabaikan
      existing.add(id);
      rows.push([
        r.waktu ? new Date(r.waktu) : new Date(),
        id,
        clean_(r.nama, 60),
        clean_(r.kelas, 12),
        clean_(r.jenis, 20),
        clean_(r.pelajaran, 80),
        clean_(r.bab, 80),
        num_(r.benar),
        num_(r.total),
        num_(r.nilai),
        num_(r.durasi),
        clean_(r.perangkat, 40),
        clean_(r.catatan, 300)
      ]);
    });
    if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    ensureRekap_();
    return json_({ ok: true, saved: saved, added: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function doGet() {
  return json_({ ok: true, app: 'Jejak IPA 7', time: new Date().toISOString() });
}

function getHasilSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_HASIL);
  if (!sh) sh = ss.insertSheet(SHEET_HASIL, 0);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#d7ffb8');
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  }
  return sh;
}

function ensureRekap_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(SHEET_REKAP)) return;
  const sh = ss.insertSheet(SHEET_REKAP);
  sh.getRange('A1').setFormula(
    "=QUERY(" + SHEET_HASIL + "!A:M, \"select D, C, count(J), max(J), avg(J) where E = 'Uji coba' group by D, C order by D, C label count(J) 'Jumlah uji coba', max(J) 'Nilai terbaik', avg(J) 'Rata-rata'\", 1)"
  );
  sh.setFrozenRows(1);
}

/** Teks dari siswa dibersihkan agar tidak dibaca sebagai rumus oleh Sheets. */
function clean_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : '';
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
