import { loadProjects, el } from './data.js';
import { renderDetail } from './render.js';
import { renderLoadError } from './states.js';

const root = document.getElementById('detail-root');
const title = document.getElementById('page-title');
const crumb = document.getElementById('crumb-current');

async function init() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    showNotFound('Halaman ini membutuhkan kode kegiatan. Pilih kegiatan dari katalog.');
    return;
  }
  let projects;
  try {
    projects = await loadProjects();
  } catch (error) {
    root.replaceChildren(renderLoadError(error, init));
    return;
  }
  const project = projects.find((p) => p.id === id);
  if (!project) {
    showNotFound('Kegiatan dengan kode tersebut tidak ditemukan di dataset.');
    return;
  }
  title.textContent = project.name;
  crumb.textContent = project.name;
  document.title = `${project.name} — JejakDana`;
  root.replaceChildren(renderDetail(project, { headingLevel: 2 }));
}

function showNotFound(message) {
  title.textContent = 'Kegiatan tidak ditemukan';
  crumb.textContent = 'Tidak ditemukan';
  document.title = 'Kegiatan tidak ditemukan — JejakDana';
  root.replaceChildren(el('div', { class: 'state', role: 'alert' },
    el('p', { class: 'state__title' }, 'Kegiatan tidak ditemukan'),
    el('p', {}, message),
    el('a', { class: 'btn btn--primary', href: 'index.html#proyek' }, 'Buka katalog'),
  ));
}

init();
