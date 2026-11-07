// Mengubah data/projects.csv (mis. hasil ekspor spreadsheet) menjadi data/projects.json.
// Hasil divalidasi dengan scripts/validate-data.mjs sebelum menimpa berkas tujuan; bila gagal, berkas lama tidak disentuh.
// Pemakaian: node scripts/import-projects.mjs [input.csv] [output.json]
import { spawnSync } from 'node:child_process';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';

const input = process.argv[2] ?? 'data/projects.csv';
const output = process.argv[3] ?? 'data/projects.json';

const NUMBER_FIELDS = ['fiscal_year', 'length_km', 'budget_ceiling_idr', 'contract_value_idr', 'physical_progress_percent'];
const NULLABLE_FIELDS = ['length_km', 'budget_ceiling_idr', 'contract_value_idr', 'physical_progress_percent', 'rup_id'];

/** Parser CSV RFC 4180 minimal: tanda kutip ganda, koma dan baris baru di dalam kutip. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

let text;
try {
  text = (await readFile(input, 'utf8')).replace(/^﻿/, '');
} catch (e) {
  console.error(`✗ Tidak dapat membaca ${input}: ${e.code === 'ENOENT' ? 'berkas tidak ada' : e.message}`);
  process.exit(1);
}

const [header, ...body] = parseCsv(text);
const projects = [];
const problems = [];
body.forEach((cells, i) => {
  const at = `baris ${i + 2}`;
  if (cells.length !== header.length) return problems.push(`${at}: ${cells.length} kolom, seharusnya ${header.length}`);
  const project = {};
  header.forEach((key, j) => {
    const raw = cells[j].trim();
    if (NUMBER_FIELDS.includes(key) && raw !== '') {
      const n = Number(raw);
      if (!Number.isFinite(n)) return problems.push(`${at}: ${key} bukan angka ("${raw}")`);
      project[key] = n;
    } else if (NULLABLE_FIELDS.includes(key) && raw === '') project[key] = null;
    else project[key] = raw;
  });
  projects.push(project);
});
if (problems.length) {
  console.error(`✗ CSV tidak dapat dibaca:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

const temp = `${output}.tmp`;
await writeFile(temp, `${JSON.stringify(projects, null, 2)}\n`, 'utf8');
const check = spawnSync(process.execPath, ['scripts/validate-data.mjs', temp], { stdio: 'inherit' });
if (check.status !== 0) {
  await unlink(temp);
  console.error(`✗ Validasi gagal; ${output} tidak diubah.`);
  process.exit(1);
}
await rename(temp, output);
console.log(`✓ ${projects.length} kegiatan ditulis ke ${output}`);
