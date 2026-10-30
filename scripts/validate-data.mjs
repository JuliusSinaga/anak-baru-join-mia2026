// Validator projects.json sesuai model data PRD §8 dan aturan integritas brief §8.
// Pemakaian: node scripts/validate-data.mjs data/projects.json [--allow-any-host]
// Exit code 1 bila ada error. Peringatan tidak menggagalkan, tetapi wajib ditinjau manusia.
import { readFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "data/projects.json";
const allowAnyHost = args.includes('--allow-any-host');

const CATEGORIES = ['Jalan', 'Trotoar'];
const STATUSES = ['pelaksanaan_dilaporkan', 'selesai_menurut_sumber', 'perbaikan_titik_dilaporkan'];
const NULL_UNTIL_PRIMARY = ['budget_ceiling_idr', 'contract_value_idr', 'physical_progress_percent', 'rup_id'];
const OFFICIAL_HOST = /(^|\.)medan\.go\.id$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const warnings = [];

let data;
try {
  data = JSON.parse(await readFile(file, 'utf8'));
} catch (e) {
  console.error(`✗ Tidak dapat membaca/parse ${file}: ${e.code === 'ENOENT' ? 'berkas tidak ada' : e.message}`);
  process.exit(1);
}

const list = Array.isArray(data) ? data : data?.projects;
if (!Array.isArray(list)) {
  console.error('✗ Root harus berupa array kegiatan (atau objek { projects: [...] }).');
  process.exit(1);
}

const ids = new Set();
const isValidDate = (v) => DATE.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v);

list.forEach((p, i) => {
  const at = `[${i}] ${p?.id ?? '(tanpa id)'}`;
  const err = (m) => errors.push(`${at}: ${m}`);
  const warn = (m) => warnings.push(`${at}: ${m}`);
  if (!p || typeof p !== 'object') return err('entri bukan objek');

  if (typeof p.id !== 'string' || !p.id.trim()) err('id wajib string');
  else if (ids.has(p.id)) err('id duplikat');
  else ids.add(p.id);

  for (const key of ['name', 'location', 'agency', 'summary', 'warning']) {
    if (typeof p[key] !== 'string' || !p[key].trim()) err(`${key} wajib string tidak kosong`);
  }
  if (!CATEGORIES.includes(p.category)) err(`category harus salah satu dari ${CATEGORIES.join('/')}`);
  if (!STATUSES.includes(p.reported_status)) err(`reported_status tidak dikenal: ${p.reported_status}`);
  if (!isValidDate(p.source_published_at)) err('source_published_at harus YYYY-MM-DD valid');
  if (!isValidDate(p.as_of)) err('as_of harus YYYY-MM-DD valid');
  if (isValidDate(p.source_published_at) && isValidDate(p.as_of) && p.as_of < p.source_published_at) {
    err('as_of lebih awal dari source_published_at');
  }
  if (!Number.isInteger(p.fiscal_year)) err('fiscal_year wajib integer');
  if (p.length_km !== null && !(typeof p.length_km === 'number' && p.length_km > 0)) err('length_km harus null atau angka > 0');
  if (p.data_kind !== 'official_news_activity') err('data_kind harus official_news_activity');
  if (p.verification_level !== 'official_publication') err('verification_level harus official_publication');

  try {
    const url = new URL(p.source_url);
    if (url.protocol !== 'https:') err('source_url harus https');
    else if (!allowAnyHost && !OFFICIAL_HOST.test(url.hostname)) err(`source_url bukan domain *.medan.go.id: ${url.hostname}`);
  } catch {
    err('source_url bukan URL valid');
  }

  for (const key of NULL_UNTIL_PRIMARY) {
    if (!(key in p)) err(`${key} wajib ada (gunakan null bila belum terverifikasi)`);
    else if (p[key] === 0 || p[key] === '0' || p[key] === '') err(`${key} bernilai 0/kosong — gunakan null untuk data yang belum tersedia`);
    else if (p[key] !== null) warn(`${key} terisi (${p[key]}). Pastikan ada dokumen primer (SiRUP/kontrak) yang tercatat.`);
  }
});

if (list.length !== 6) warnings.push(`Jumlah entri ${list.length}; scope First Draft adalah 6 entri.`);

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);
console.log(`${errors.length ? '✗' : '✓'} ${file}: ${list.length} entri, ${errors.length} error, ${warnings.length} peringatan`);
process.exit(errors.length ? 1 : 0);
