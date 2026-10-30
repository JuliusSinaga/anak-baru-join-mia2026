import {
  loadProjects, filterProjects, formatDate, latestDate, safeHttpsUrl, statusLabel, el,
  STATUS_LABELS, STATUS_DESCRIPTIONS, UNVERIFIED_FIELDS,
} from './data.js';
import { renderCard, renderDetail, detailHref } from './render.js';
import { renderLoadError } from './states.js';

const $ = (id) => document.getElementById(id);
const els = {
  form: $('filters'), q: $('q'), category: $('kategori'), status: $('status'),
  count: $('result-count'), cards: $('cards'), state: $('catalog-state'),
  stats: $('coverage-stats'), coverageNote: $('coverage-note'),
  legend: $('status-legend'), asOf: $('method-asof'),
  modal: $('detail-modal'), modalTitle: $('modal-title'), modalBody: $('modal-body'), modalPageLink: $('modal-page-link'),
};

let projects = [];
let lastOpener = null;

renderStatusLegend();
init();

async function init() {
  setState(el('p', { class: 'state__text' }, el('span', { class: 'spinner', 'aria-hidden': 'true' }), ' Memuat data kegiatan…'));
  els.count.textContent = '';
  try {
    projects = await loadProjects();
  } catch (error) {
    projects = [];
    showLoadError(error);
    return;
  }
  populateFilters();
  readUrlState();
  renderCoverage();
  update();
}

function showLoadError(error) {
  setState(renderLoadError(error, init));
  els.cards.replaceChildren();
  els.count.textContent = 'Data kegiatan belum dapat dimuat.';
  els.coverageNote.textContent = 'Ringkasan cakupan akan muncul setelah dataset berhasil dimuat.';
  els.stats.replaceChildren();
  for (const control of [els.q, els.category, els.status]) control.disabled = true;
}

function setState(content) {
  if (!content) {
    els.state.hidden = true;
    els.state.replaceChildren();
    return;
  }
  els.state.hidden = false;
  els.state.replaceChildren(content);
}

function populateFilters() {
  for (const control of [els.q, els.category, els.status]) control.disabled = false;
  const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
  const statuses = [...new Set(projects.map((p) => p.reported_status).filter(Boolean))]
    .sort((a, b) => Object.keys(STATUS_LABELS).indexOf(a) - Object.keys(STATUS_LABELS).indexOf(b));
  els.category.replaceChildren(el('option', { value: '' }, 'Semua kategori'), ...categories.map((c) => el('option', { value: c }, c)));
  els.status.replaceChildren(el('option', { value: '' }, 'Semua status'), ...statuses.map((s) => el('option', { value: s }, statusLabel(s))));
}

function currentFilters() {
  return { query: els.q.value, category: els.category.value, status: els.status.value };
}

function update() {
  const filters = currentFilters();
  const results = filterProjects(projects, filters);
  els.cards.replaceChildren(...results.map((p) => renderCard(p, openDetail)));
  const active = Boolean(filters.query.trim() || filters.category || filters.status);
  els.count.textContent = active
    ? `Menampilkan ${results.length} dari ${projects.length} kegiatan`
    : `Menampilkan semua ${projects.length} kegiatan`;

  if (projects.length === 0) {
    setState(el('div', {}, el('p', { class: 'state__title' }, 'Dataset kosong'), el('p', {}, 'Belum ada kegiatan di projects.json.')));
  } else if (results.length === 0) {
    setState(el('div', {},
      el('p', { class: 'state__title' }, 'Tidak ada kegiatan yang cocok'),
      el('p', {}, 'Coba kata kunci lain (misalnya nama jalan), atau hapus filter kategori/status.'),
      el('button', { type: 'button', class: 'btn btn--primary', onclick: resetFilters }, 'Reset pencarian & filter'),
    ));
  } else {
    setState(null);
  }
  writeUrlState(filters);
}

function resetFilters() {
  els.form.reset();
  update();
  els.q.focus();
}

// Event input juga dipicu oleh <select>, jadi listener change tidak diperlukan.
els.form.addEventListener('input', update);
els.form.addEventListener('submit', (e) => e.preventDefault());
// Event reset terjadi sebelum nilai field dikosongkan, jadi update ditunda satu tick.
els.form.addEventListener('reset', () => setTimeout(update, 0));

function readUrlState() {
  const params = new URLSearchParams(location.search);
  els.q.value = params.get('q') ?? '';
  const setIfValid = (select, value) => {
    if (value && [...select.options].some((o) => o.value === value)) select.value = value;
  };
  setIfValid(els.category, params.get('kategori'));
  setIfValid(els.status, params.get('status'));
}

function writeUrlState({ query, category, status }) {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (category) params.set('kategori', category);
  if (status) params.set('status', status);
  const search = params.toString();
  const url = `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
  if (url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(null, '', url);
}

function renderCoverage() {
  const total = projects.length;
  const byCategory = countBy(projects, 'category');
  const dates = projects.map((p) => p.source_published_at).filter((d) => formatDate(d)).sort();
  const withSource = projects.filter((p) => safeHttpsUrl(p.source_url)).length;
  const budgetKey = UNVERIFIED_FIELDS[0].key;
  const withBudget = projects.filter((p) => p[budgetKey] !== null && p[budgetKey] !== undefined).length;

  const stat = (value, label, id) => el('li', { class: 'stat', 'data-stat': id }, el('span', { class: 'stat__value' }, value), el('span', { class: 'stat__label' }, label));
  els.stats.replaceChildren(
    stat(String(total), 'kegiatan tercatat', 'total'),
    stat(Object.entries(byCategory).map(([k, v]) => `${v} ${k}`).join(' · ') || '—', 'menurut kategori', 'category'),
    stat(`${withSource}/${total}`, 'entri memiliki tautan sumber resmi', 'sources'),
    stat(`${withBudget}/${total}`, 'entri dengan pagu anggaran terverifikasi', 'budget'),
  );

  const range = dates.length ? `${formatDate(dates[0])} – ${formatDate(dates.at(-1))}` : 'tidak tercantum';
  const asOf = formatDate(latestDate(projects, 'as_of'));
  els.coverageNote.textContent = `Dihitung otomatis dari dataset. Rentang tanggal publikasi sumber: ${range}.${asOf ? ` Data dikurasi per ${asOf}.` : ''}`;
  els.asOf.textContent = asOf ? `Tanggal kurasi terbaru pada dataset: ${asOf}.` : '';
}

function countBy(list, key) {
  return list.reduce((acc, item) => {
    const k = item[key] ?? 'Tanpa kategori';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function renderStatusLegend() {
  els.legend.replaceChildren(...Object.entries(STATUS_LABELS).map(([key, label]) =>
    el('li', {}, el('strong', {}, `${label}: `), STATUS_DESCRIPTIONS[key])));
}

/* ---------- Modal detail ---------- */

function openDetail(project) {
  lastOpener = document.activeElement;
  els.modalTitle.textContent = project.name;
  els.modalBody.replaceChildren(renderDetail(project, { headingLevel: 3 }));
  els.modalPageLink.href = detailHref(project);
  els.modal.showModal();
  document.body.classList.add('modal-open');
  els.modalBody.scrollTop = 0;
  $('modal-close').focus();
}

function closeDetail() {
  if (els.modal.open) els.modal.close();
}

els.modal.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  if (lastOpener && document.contains(lastOpener)) lastOpener.focus();
  lastOpener = null;
});
$('modal-close').addEventListener('click', closeDetail);
$('modal-close-2').addEventListener('click', closeDetail);
// Klik pada backdrop (di luar kotak dialog) menutup modal.
els.modal.addEventListener('click', (event) => {
  if (event.target === els.modal) closeDetail();
});
