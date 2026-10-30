// Data layer JejakDana: memuat projects.json, menormalkan entri, dan menyediakan
// label/format yang jujur terhadap data kosong. Tidak ada angka yang dikarang di sini.

export const DATA_URL = 'projects.json';

export const STATUS_LABELS = {
  pelaksanaan_dilaporkan: 'Pelaksanaan dilaporkan',
  selesai_menurut_sumber: 'Selesai menurut sumber',
  perbaikan_titik_dilaporkan: 'Perbaikan titik dilaporkan',
};

export const STATUS_DESCRIPTIONS = {
  pelaksanaan_dilaporkan: 'Sumber melaporkan pekerjaan sedang dilaksanakan pada tanggal publikasi.',
  selesai_menurut_sumber: 'Sumber menyatakan pekerjaan selesai pada tanggal publikasi. Bukan hasil inspeksi lapangan JejakDana.',
  perbaikan_titik_dilaporkan: 'Sumber melaporkan perbaikan pada titik tertentu, bukan seluruh ruas.',
};

export const DATA_KIND_LABELS = {
  official_news_activity: 'Kegiatan dari publikasi resmi (bukan paket pengadaan tervalidasi)',
};

export const VERIFICATION_LABELS = {
  official_publication: 'Sumber: publikasi pemerintah',
};

// Field yang tidak boleh diisi tanpa dokumen primer. null => tampil sebagai belum tersedia.
export const UNVERIFIED_FIELDS = [
  { key: 'budget_ceiling_idr', label: 'Pagu anggaran', missing: 'Belum terverifikasi', format: 'idr' },
  { key: 'contract_value_idr', label: 'Nilai kontrak', missing: 'Belum terverifikasi', format: 'idr' },
  { key: 'physical_progress_percent', label: 'Progres fisik', missing: 'Belum tersedia', format: 'percent' },
  { key: 'rup_id', label: 'Kode RUP (SiRUP)', missing: 'Belum terverifikasi', format: 'text' },
];

export class DataLoadError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind; // 'missing' | 'network' | 'invalid'
  }
}

export async function loadProjects() {
  if (location.protocol === 'file:') {
    throw new DataLoadError('Halaman dibuka langsung dari file. Jalankan local server agar data dapat dimuat.', 'network');
  }
  let response;
  try {
    response = await fetch(DATA_URL, { cache: 'no-cache' });
  } catch {
    throw new DataLoadError('Koneksi ke berkas data gagal.', 'network');
  }
  if (response.status === 404) {
    throw new DataLoadError('Berkas projects.json belum tersedia di server.', 'missing');
  }
  if (!response.ok) {
    throw new DataLoadError(`Server mengembalikan status ${response.status}.`, 'network');
  }
  let raw;
  try {
    raw = await response.json();
  } catch {
    throw new DataLoadError('Berkas projects.json bukan JSON yang valid.', 'invalid');
  }
  const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.projects) ? raw.projects : null;
  if (!list) {
    throw new DataLoadError('Format projects.json tidak dikenali (harus array kegiatan).', 'invalid');
  }
  return list.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string').map(normalizeProject);
}

function normalizeProject(p) {
  return {
    ...p,
    _search: fold([p.name, p.location, p.category, p.agency, p.summary].filter(Boolean).join(' ')),
  };
}

/** Lowercase + hapus diakritik agar pencarian tidak case/aksen-sensitive. */
export function fold(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterProjects(projects, { query = '', category = '', status = '' }) {
  const terms = fold(query).split(' ').filter(Boolean);
  return projects.filter(
    (p) =>
      (!category || p.category === category) &&
      (!status || p.reported_status === status) &&
      terms.every((t) => p._search.includes(t)),
  );
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? `Status tidak dikenal (${status ?? 'kosong'})`;
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Format YYYY-MM-DD tanpa pergeseran zona waktu. */
export function formatDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(d.getTime()) ? null : dateFormatter.format(d);
}

export function formatValue(value, format) {
  if (value === null || value === undefined || value === '') return null;
  if (format === 'idr' && typeof value === 'number') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  }
  if (format === 'percent' && typeof value === 'number') return `${value.toLocaleString('id-ID')}%`;
  if (format === 'km' && typeof value === 'number') return `${value.toLocaleString('id-ID')} km`;
  return String(value);
}

/** Hanya URL https yang boleh menjadi tautan. */
export function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Pembuat elemen DOM; teks selalu lewat textContent sehingga data tidak pernah dieksekusi sebagai HTML. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function latestDate(projects, key) {
  return projects.map((p) => p[key]).filter((v) => formatDate(v)).sort().at(-1) ?? null;
}
