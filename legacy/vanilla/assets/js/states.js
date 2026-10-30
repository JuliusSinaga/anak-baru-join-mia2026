import { el } from './data.js';

/** State error saat dataset gagal dimuat, dengan petunjuk yang bisa ditindaklanjuti. */
export function renderLoadError(error, onRetry) {
  const hints = {
    missing: 'Tempatkan berkas projects.json (6 entri kegiatan yang sudah diverifikasi) di root project, lalu muat ulang.',
    network: 'Jalankan local server dari root project, misalnya: python -m http.server 8000, lalu buka http://localhost:8000.',
    invalid: 'Periksa format projects.json dengan perintah: npm run validate',
  };
  return el('div', { class: 'state--error', role: 'alert' },
    el('p', { class: 'state__title' }, 'Data kegiatan belum dapat dimuat'),
    el('p', {}, error?.message ?? 'Terjadi kesalahan yang tidak diketahui.'),
    el('p', { class: 'muted' }, hints[error?.kind] ?? hints.network),
    onRetry ? el('button', { type: 'button', class: 'btn btn--primary', onclick: onRetry }, 'Coba muat ulang') : null,
  );
}
