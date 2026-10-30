import {
  el, formatDate, formatValue, safeHttpsUrl, statusLabel,
  STATUS_DESCRIPTIONS, DATA_KIND_LABELS, VERIFICATION_LABELS, UNVERIFIED_FIELDS,
} from './data.js';

export function detailHref(project) {
  return `kegiatan.html?id=${encodeURIComponent(project.id)}`;
}

function statusBadge(project) {
  return el('span', { class: `badge badge--status status-${project.reported_status ?? 'unknown'}` }, statusLabel(project.reported_status));
}

function categoryBadge(project) {
  return el('span', { class: 'badge badge--category' }, project.category ?? 'Tanpa kategori');
}

function reportedStatusLine(project) {
  const date = formatDate(project.source_published_at);
  return `${statusLabel(project.reported_status)} — ${date ? `berdasarkan publikasi ${date}` : 'tanggal publikasi sumber tidak tercantum'}`;
}

export function renderCard(project, onOpen) {
  const date = formatDate(project.source_published_at);
  const title = el('h3', { class: 'card__title', id: `card-title-${project.id}` }, project.name);
  return el('li', { class: 'card' },
    el('article', { 'aria-labelledby': `card-title-${project.id}` },
      el('div', { class: 'card__badges' }, categoryBadge(project), statusBadge(project)),
      title,
      el('dl', { class: 'card__meta' },
        el('div', {}, el('dt', {}, 'Lokasi'), el('dd', {}, project.location || 'Tidak tercantum')),
        el('div', {}, el('dt', {}, 'Instansi'), el('dd', {}, project.agency || 'Tidak tercantum')),
        el('div', {}, el('dt', {}, 'Tanggal sumber'), el('dd', {}, date ?? 'Tidak tercantum')),
      ),
      project.summary ? el('p', { class: 'card__summary' }, project.summary) : null,
      el('p', { class: 'card__budget', 'data-card-budget': '' },
        el('span', {}, 'Pagu anggaran: '),
        el('strong', {}, formatValue(project.budget_ceiling_idr, 'idr') ?? 'Belum terverifikasi')),
      el('p', { class: 'card__source-note' }, VERIFICATION_LABELS[project.verification_level] ?? 'Jenis sumber tidak tercantum'),
      el('div', { class: 'card__actions' },
        el('button', {
          type: 'button', class: 'btn btn--primary', 'data-open': project.id,
          'aria-label': `Lihat detail: ${project.name}`, onclick: () => onOpen(project),
        }, 'Lihat detail'),
        el('a', { class: 'btn btn--ghost', href: detailHref(project), 'aria-label': `Buka halaman detail: ${project.name}` }, 'Halaman detail'),
      ),
    ),
  );
}

function sourceLink(project) {
  const href = safeHttpsUrl(project.source_url);
  if (!href) {
    return el('p', { class: 'notice notice--warn' }, 'Tautan sumber tidak tersedia atau tidak valid. Entri ini belum dapat ditelusuri.');
  }
  let host = '';
  try { host = new URL(href).hostname; } catch { /* sudah divalidasi */ }
  return el('div', { class: 'source' },
    el('a', {
      class: 'btn btn--primary source__link', href, target: '_blank', rel: 'noopener noreferrer', 'data-source-link': '',
    }, 'Buka sumber asli', el('span', { class: 'visually-hidden' }, ' (membuka tab baru)'), el('span', { 'aria-hidden': 'true' }, ' ↗')),
    el('p', { class: 'source__url' }, el('span', { class: 'source__host' }, host), el('br'), el('code', {}, href)),
  );
}

/** Isi detail kegiatan. headingLevel menentukan level judul seksi (h2 di halaman, h3 di modal). */
export function renderDetail(project, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const sourceDate = formatDate(project.source_published_at);
  const asOf = formatDate(project.as_of);
  const length = formatValue(project.length_km, 'km');

  const facts = [
    ['Kategori', project.category],
    ['Lokasi', project.location],
    ['Instansi (menurut sumber)', project.agency],
    ['Tahun', project.fiscal_year],
    ['Panjang (menurut sumber)', length ?? 'Tidak disebutkan sumber'],
    ['Jenis data', DATA_KIND_LABELS[project.data_kind] ?? project.data_kind],
  ];

  return el('div', { class: 'detail' },
    el('div', { class: 'detail__badges' }, categoryBadge(project), statusBadge(project)),

    el('section', { class: 'detail__section', 'aria-label': 'Status yang dilaporkan' },
      el('p', { class: 'detail__status' }, el('strong', {}, reportedStatusLine(project))),
      el('p', { class: 'muted' }, STATUS_DESCRIPTIONS[project.reported_status] ?? 'Status ini tidak memiliki penjelasan baku.'),
      el('p', { class: 'muted' }, 'Status bukan pemantauan real-time dan dapat berbeda dengan kondisi saat ini.'),
    ),

    el('section', { class: 'detail__section' },
      el(h, {}, 'Ringkasan dari sumber'),
      el('p', {}, project.summary || 'Ringkasan belum tersedia.'),
    ),

    el('section', { class: 'detail__section' },
      el(h, {}, 'Informasi kegiatan'),
      el('dl', { class: 'facts' },
        facts.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v === null || v === undefined || v === '' ? 'Tidak tercantum' : String(v)))),
      ),
    ),

    el('section', { class: 'detail__section' },
      el(h, {}, 'Data anggaran & progres'),
      el('p', { class: 'muted' }, 'Publikasi berita tidak membuktikan pagu, nilai kontrak, atau progres fisik. Kolom di bawah hanya diisi bila ada dokumen primer yang cocok.'),
      el('dl', { class: 'facts facts--unverified' },
        UNVERIFIED_FIELDS.map((f) => {
          const value = formatValue(project[f.key], f.format);
          return el('div', { 'data-field': f.key },
            el('dt', {}, f.label),
            el('dd', { class: value ? '' : 'missing' }, value ?? f.missing),
          );
        }),
      ),
    ),

    el('section', { class: 'detail__section' },
      el(h, {}, 'Sumber & asal data'),
      sourceLink(project),
      el('dl', { class: 'facts' },
        el('div', {}, el('dt', {}, 'Tanggal publikasi sumber'), el('dd', {}, sourceDate ?? 'Tidak tercantum')),
        el('div', {}, el('dt', {}, 'Data dikurasi JejakDana per'), el('dd', {}, asOf ?? 'Tidak tercantum')),
        el('div', {}, el('dt', {}, 'Tingkat verifikasi'), el('dd', {}, VERIFICATION_LABELS[project.verification_level] ?? project.verification_level ?? 'Tidak tercantum')),
      ),
      el('p', { class: 'muted' }, '“Sumber: publikasi pemerintah” berarti informasi berasal dari publikasi resmi, bukan inspeksi fisik independen oleh JejakDana.'),
    ),

    project.warning
      ? el('section', { class: 'detail__section' },
        el(h, {}, 'Keterbatasan data'),
        el('p', { class: 'notice notice--warn' }, project.warning))
      : null,

    el('p', { class: 'notice' }, 'JejakDana adalah situs independen dan bukan situs resmi Pemerintah Kota Medan.'),
  );
}
