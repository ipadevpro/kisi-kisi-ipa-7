/* Pengaturan Jejak IPA 7. Ubah file ini saja, tidak perlu menyentuh kode lain.

   sheetUrl : URL Web App dari Google Apps Script (berakhiran /exec).
              Biarkan kosong ('') jika belum ingin mengirim nilai ke Google Sheet;
              aplikasi tetap berjalan dan progres hanya tersimpan di perangkat siswa.
              Lihat README.md bagian "Menghubungkan Google Sheet". */
window.JEJAK_CONFIG = {
  sheetUrl: 'https://script.google.com/macros/s/AKfycbxI900u1EKRZTrc6-Hxq87_IPAx2nAupYzVyeuRsaVEGW7rUoEJoshRn2l7A16NfmIY/exec',
  examDate: '2026-12-01T09:30:00+07:00',
  examLabel: 'Selasa, 1 Desember 2026, 09.30–11.00 WIB',
  examInfo: '35 soal pilihan ganda · 90 menit',
  school: 'SMP PGII 1 Bandung',
  classes: ['VII A', 'VII B', 'VII C', 'VII D', 'VII E', 'VII F', 'VII G', 'VII H', 'VII I', 'VII J']
};
