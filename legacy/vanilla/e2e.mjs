// Tes E2E JejakDana memakai playwright-core + Microsoft Edge/Chrome yang sudah terpasang.
// Data uji = tests/fixtures/projects.fixture.json (FIKTIF), disuntikkan lewat route intercept;
// aplikasi sendiri tetap hanya memuat projects.json.
// Pemakaian: npm test   (env BROWSER_CHANNEL=chrome untuk memakai Chrome)
import { chromium } from 'playwright-core';
import { readFile, mkdir } from 'node:fs/promises';
import { startServer } from '../scripts/serve.mjs';

const PORT = 8765;
const BASE = `http://127.0.0.1:${PORT}`;
const fixture = await readFile(new URL('./fixtures/projects.fixture.json', import.meta.url), 'utf8');
const FIXTURE = JSON.parse(fixture);
await mkdir('test-results', { recursive: true });

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  ✗ ${name}\n      ${String(error.message).split('\n')[0]}`);
  }
}
function assert(cond, message) { if (!cond) throw new Error(message); }
function eq(actual, expected, message) { assert(actual === expected, `${message}: diharapkan ${JSON.stringify(expected)}, didapat ${JSON.stringify(actual)}`); }

const server = await startServer(PORT);
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true });

async function openPage(path = '/', { data = fixture, status = 200, viewport = { width: 1280, height: 900 }, real = false } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  if (!real) {
    await page.route('**/projects.json', (route) =>
      route.fulfill({ status, contentType: 'application/json', body: status === 200 ? data : 'Not found' }));
  }
  await page.goto(BASE + path);
  page.consoleErrors = consoleErrors;
  page.closeAll = () => context.close();
  return page;
}

const cardCount = (page) => page.locator('#cards > li').count();
const waitCards = (page) => page.waitForSelector('#cards > li');

console.log('JejakDana E2E');

await test('AC-01 semua entri dataset dirender sebagai kartu', async () => {
  const page = await openPage();
  await waitCards(page);
  eq(await cardCount(page), FIXTURE.length, 'jumlah kartu');
  eq((await page.textContent('#result-count')).trim(), `Menampilkan semua ${FIXTURE.length} kegiatan`, 'teks jumlah');
  for (const p of FIXTURE) assert(await page.getByRole('heading', { name: p.name, exact: true }).count() === 1, `kartu ${p.id} tidak ada`);
  eq(page.consoleErrors.length, 0, `error konsol: ${page.consoleErrors.join(' | ')}`);
  await page.closeAll();
});

await test('Landing: ringkasan cakupan dihitung dari dataset, tanpa total anggaran', async () => {
  const page = await openPage();
  await waitCards(page);
  eq((await page.textContent('[data-stat="total"] .stat__value')).trim(), String(FIXTURE.length), 'stat total');
  eq((await page.textContent('[data-stat="category"] .stat__value')).trim(), '4 Jalan · 2 Trotoar', 'stat kategori');
  eq((await page.textContent('[data-stat="budget"] .stat__value')).trim(), `0/${FIXTURE.length}`, 'stat pagu');
  const body = await page.textContent('body');
  assert(!/Rp\s?\d/.test(body), 'halaman memuat nominal rupiah');
  assert((await page.textContent('#coverage-note')).includes('10 Maret 2026 – 5 September 2026'), 'rentang tanggal sumber salah');
  await page.closeAll();
});

await test('AC-02 pencarian "juanda" (huruf kecil) menemukan Juanda saja', async () => {
  const page = await openPage();
  await waitCards(page);
  await page.fill('#q', 'juanda');
  eq(await cardCount(page), 1, 'jumlah hasil');
  assert((await page.textContent('#cards')).includes('Jalan Juanda'), 'kartu Juanda tidak tampil');
  eq((await page.textContent('#result-count')).trim(), `Menampilkan 1 dari ${FIXTURE.length} kegiatan`, 'teks jumlah');
  assert(page.url().includes('q=juanda'), 'state pencarian tidak tersimpan di URL');
  await page.closeAll();
});

await test('AC-03 filter Trotoar hanya memunculkan Trotoar', async () => {
  const page = await openPage();
  await waitCards(page);
  await page.selectOption('#kategori', 'Trotoar');
  const badges = await page.locator('#cards .badge--category').allTextContents();
  eq(badges.length, FIXTURE.filter((p) => p.category === 'Trotoar').length, 'jumlah Trotoar');
  assert(badges.every((b) => b === 'Trotoar'), `ada kategori lain: ${badges}`);
  await page.closeAll();
});

await test('Filter status "Selesai menurut sumber" + kombinasi kategori bekerja serentak', async () => {
  const page = await openPage();
  await waitCards(page);
  await page.selectOption('#status', 'selesai_menurut_sumber');
  eq(await cardCount(page), 3, 'selesai');
  await page.selectOption('#kategori', 'Jalan');
  eq(await cardCount(page), 2, 'Jalan + selesai');
  await page.fill('#q', 'trotoar');
  eq(await cardCount(page), 0, 'Jalan + selesai + "trotoar"');
  await page.closeAll();
});

await test('Empty state muncul dan tombol reset memulihkan semua entri', async () => {
  const page = await openPage();
  await waitCards(page);
  await page.fill('#q', 'zzz-tidak-ada');
  eq(await cardCount(page), 0, 'hasil');
  assert(await page.isVisible('#catalog-state'), 'empty state tidak terlihat');
  assert((await page.textContent('#catalog-state')).includes('Tidak ada kegiatan yang cocok'), 'teks empty state');
  await page.click('#catalog-state button');
  eq(await cardCount(page), FIXTURE.length, 'setelah reset');
  eq(await page.inputValue('#q'), '', 'input belum kosong');
  await page.fill('#q', 'juanda');
  await page.click('#reset-filters');
  await page.waitForFunction((n) => document.querySelectorAll('#cards > li').length === n, FIXTURE.length);
  await page.closeAll();
});

await test('Filter dari URL (?q=juanda&kategori=Jalan) diterapkan saat memuat', async () => {
  const page = await openPage('/?q=juanda&kategori=Jalan');
  await waitCards(page);
  eq(await cardCount(page), 1, 'hasil');
  eq(await page.inputValue('#kategori'), 'Jalan', 'kategori');
  await page.closeAll();
});

await test('AC-04/AC-05/AC-06 modal detail: sumber, null jujur, ESC menutup & fokus kembali', async () => {
  const page = await openPage();
  await waitCards(page);
  const opener = page.locator('[data-open="uji-01"]');
  await opener.focus();
  await page.keyboard.press('Enter');
  const modal = page.locator('#detail-modal');
  await modal.waitFor({ state: 'visible' });
  eq((await page.textContent('#modal-title')).trim(), FIXTURE[0].name, 'judul modal');

  const link = modal.locator('[data-source-link]');
  eq(await link.getAttribute('href'), FIXTURE[0].source_url, 'href sumber');
  eq(await link.getAttribute('target'), '_blank', 'target');
  eq(await link.getAttribute('rel'), 'noopener noreferrer', 'rel');
  assert((await modal.textContent()).includes(FIXTURE[0].source_url), 'URL sumber tidak tertulis');

  const expected = {
    budget_ceiling_idr: 'Belum terverifikasi', contract_value_idr: 'Belum terverifikasi',
    physical_progress_percent: 'Belum tersedia', rup_id: 'Belum terverifikasi',
  };
  for (const [key, text] of Object.entries(expected)) {
    eq((await modal.locator(`[data-field="${key}"] dd`).textContent()).trim(), text, key);
  }
  const modalText = await modal.textContent();
  assert(!/Rp\s?0|\b0\s?%/.test(modalText), 'modal menampilkan Rp0 atau 0%');
  assert(modalText.includes('Selesai menurut sumber — berdasarkan publikasi 10 Maret 2026'), 'status + tanggal sumber');
  assert(modalText.includes('bukan situs resmi'), 'disclaimer di detail');

  await page.keyboard.press('Escape');
  await modal.waitFor({ state: 'hidden' });
  assert(await opener.evaluate((n) => n === document.activeElement), 'fokus tidak kembali ke tombol pembuka');
  await page.closeAll();
});

await test('Modal tertutup lewat tombol × dan lewat klik backdrop', async () => {
  const page = await openPage();
  await waitCards(page);
  const modal = page.locator('#detail-modal');
  await page.click('[data-open="uji-02"]');
  await modal.waitFor({ state: 'visible' });
  await page.click('#modal-close');
  await modal.waitFor({ state: 'hidden' });
  await page.click('[data-open="uji-02"]');
  await modal.waitFor({ state: 'visible' });
  await page.mouse.click(5, 5);
  await modal.waitFor({ state: 'hidden' });
  await page.closeAll();
});

await test('Modal hanya punya satu area gulir (body), header & footer tetap terlihat', async () => {
  for (const viewport of [{ width: 768, height: 600 }, { width: 360, height: 640 }]) {
    const page = await openPage('/', { viewport });
    await waitCards(page);
    await page.click('[data-open="uji-01"]');
    await page.locator('#detail-modal').waitFor({ state: 'visible' });
    const m = await page.evaluate(() => {
      const d = document.getElementById('detail-modal');
      const b = document.getElementById('modal-body');
      return { dialogOverflow: d.scrollHeight - d.clientHeight, bodyScrolls: b.scrollHeight > b.clientHeight };
    });
    assert(m.dialogOverflow <= 0, `${viewport.width}px: dialog ikut menggulir (${m.dialogOverflow}px)`);
    assert(m.bodyScrolls, `${viewport.width}px: body modal seharusnya bisa digulir`);
    assert(await page.isVisible('#modal-close') && await page.isVisible('#modal-close-2'), 'tombol tutup tidak terlihat');
    await page.closeAll();
  }
});

await test('Keamanan: HTML di data tidak dieksekusi (dirender sebagai teks)', async () => {
  const page = await openPage();
  await waitCards(page);
  await page.click('[data-open="uji-02"]');
  await page.locator('#detail-modal').waitFor({ state: 'visible' });
  eq(await page.evaluate(() => window.__xss), undefined, 'skrip dari data tereksekusi');
  eq(await page.locator('#detail-modal img').count(), 0, 'tag <img> dari data ter-render');
  assert((await page.textContent('#detail-modal')).includes('<img src=x'), 'teks mentah tidak tampil');
  await page.closeAll();
});

await test('Halaman detail kegiatan.html?id=… menampilkan sumber dan judul', async () => {
  const page = await openPage('/kegiatan.html?id=uji-04');
  await page.waitForSelector('[data-source-link]');
  eq((await page.textContent('h1')).trim(), FIXTURE[3].name, 'h1');
  eq(await page.getAttribute('[data-source-link]', 'href'), FIXTURE[3].source_url, 'href');
  assert((await page.title()).startsWith(FIXTURE[3].name), 'document.title');
  eq(await page.locator('h2').count() >= 4, true, 'heading seksi');
  eq(page.consoleErrors.length, 0, `error konsol: ${page.consoleErrors.join(' | ')}`);
  await page.closeAll();
});

await test('Halaman detail: id tidak dikenal / kosong → state "tidak ditemukan"', async () => {
  for (const path of ['/kegiatan.html?id=tidak-ada', '/kegiatan.html']) {
    const page = await openPage(path);
    await page.waitForSelector('#detail-root [role="alert"]');
    eq((await page.textContent('h1')).trim(), 'Kegiatan tidak ditemukan', path);
    await page.closeAll();
  }
});

await test('Dataset tidak ada (404) → state error yang jelas, tanpa kartu', async () => {
  const page = await openPage('/', { status: 404 });
  await page.waitForSelector('#catalog-state [role="alert"]');
  assert((await page.textContent('#catalog-state')).includes('projects.json belum tersedia'), 'pesan error');
  eq(await cardCount(page), 0, 'kartu');
  assert(await page.isDisabled('#q'), 'input pencarian seharusnya nonaktif');
  await page.closeAll();
});

await test('Dataset JSON rusak → state error "bukan JSON yang valid"', async () => {
  const page = await openPage('/', { data: '{rusak' });
  await page.waitForSelector('#catalog-state [role="alert"]');
  assert((await page.textContent('#catalog-state')).includes('bukan JSON yang valid'), 'pesan error');
  await page.closeAll();
});

for (const width of [360, 768, 1280]) {
  await test(`AC-07/AC-08 lebar ${width}px: tanpa overflow horizontal, disclaimer terlihat`, async () => {
    const viewport = { width, height: 800 };
    for (const path of ['/', '/kegiatan.html?id=uji-06']) {
      const page = await openPage(path, { viewport });
      await page.waitForSelector(path === '/' ? '#cards > li' : '[data-source-link]');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow <= 0, `${path} overflow ${overflow}px`);
      assert(await page.isVisible('.independence-bar'), `${path} disclaimer tidak terlihat`);
      const wrapped = await page.$$eval('.brand span, .nav a', (nodes) =>
        nodes.filter((n) => n.getClientRects().length > 1 || n.offsetHeight > 48).map((n) => n.textContent));
      eq(wrapped.length, 0, `${path} teks header terpotong: ${wrapped}`);
      if (path === '/') {
        await page.click('[data-open="uji-06"]');
        await page.locator('#detail-modal').waitFor({ state: 'visible' });
        const box = await page.locator('#detail-modal').boundingBox();
        assert(box.x >= 0 && box.x + box.width <= width, `modal keluar layar (${box.x}, ${box.width})`);
        await page.screenshot({ path: `test-results/index-modal-${width}.png` });
        await page.keyboard.press('Escape');
        await page.screenshot({ path: `test-results/index-${width}.png`, fullPage: true });
      } else {
        await page.screenshot({ path: `test-results/detail-${width}.png`, fullPage: true });
      }
      await page.closeAll();
    }
  });
}

await test('Semua tautan internal (file & anchor) valid', async () => {
  const page = await openPage();
  await waitCards(page);
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  const internal = [...new Set(hrefs.filter((h) => !/^https?:/.test(h)))];
  for (const href of internal) {
    const url = new URL(href, `${BASE}/`);
    const res = await fetch(`${BASE}${url.pathname}`);
    eq(res.status, 200, `status ${href}`);
    if (url.hash && (url.pathname === '/' || url.pathname === '/index.html')) {
      assert(await page.locator(url.hash).count() === 1, `anchor ${url.hash} tidak ada`);
    }
  }
  await page.closeAll();
});

await test('Keyboard: skip link dapat difokus dan CTA hero menuju katalog', async () => {
  const page = await openPage();
  await waitCards(page);
  await page.keyboard.press('Tab');
  eq(await page.evaluate(() => document.activeElement.className), 'skip-link', 'fokus pertama');
  await page.click('.hero__actions a[href="#proyek"]');
  await page.waitForFunction(() => location.hash === '#proyek');
  await page.closeAll();
});

// ---------- Dataset asli (projects.json) tanpa intercept ----------
const realData = await readFile(new URL('../projects.json', import.meta.url), 'utf8').then(JSON.parse).catch(() => null);
if (!realData) {
  console.log('  – projects.json tidak ada; tes dataset asli dilewati');
} else {
  await test('Dataset asli: semua entri tampil, "Juanda" & filter Trotoar benar, tanpa error konsol', async () => {
    const page = await openPage('/', { real: true });
    await waitCards(page);
    eq(await cardCount(page), realData.length, 'jumlah kartu');
    await page.fill('#q', 'Juanda');
    const names = await page.locator('#cards h3').allTextContents();
    assert(names.some((n) => /juanda/i.test(n)), `Juanda tidak ditemukan: ${names}`);
    await page.fill('#q', '');
    await page.selectOption('#kategori', 'Trotoar');
    const badges = await page.locator('#cards .badge--category').allTextContents();
    eq(badges.length, realData.filter((p) => p.category === 'Trotoar').length, 'jumlah Trotoar');
    assert(badges.every((b) => b === 'Trotoar'), 'kategori lain ikut tampil');
    const cardBudgets = await page.locator('[data-card-budget] strong').allTextContents();
    assert(cardBudgets.every((t) => t === 'Belum terverifikasi'), `pagu di kartu: ${cardBudgets}`);
    eq(page.consoleErrors.length, 0, `error konsol: ${page.consoleErrors.join(' | ')}`);
    await page.screenshot({ path: 'test-results/real-catalog-trotoar-1280.png', fullPage: true });
    await page.closeAll();
  });

  await test('Dataset asli: setiap halaman detail memuat URL sumber persis & null tampil jujur', async () => {
    for (const p of realData) {
      const page = await openPage(`/kegiatan.html?id=${encodeURIComponent(p.id)}`, { real: true });
      await page.waitForSelector('[data-source-link]');
      eq(await page.getAttribute('[data-source-link]', 'href'), p.source_url, `href ${p.id}`);
      for (const key of ['budget_ceiling_idr', 'contract_value_idr', 'physical_progress_percent', 'rup_id']) {
        if (p[key] === null) assert(/^Belum (terverifikasi|tersedia)$/.test((await page.textContent(`[data-field="${key}"] dd`)).trim()), `${p.id} ${key}`);
      }
      eq(page.consoleErrors.length, 0, `error konsol ${p.id}`);
      await page.closeAll();
    }
  });

  await test('Dataset asli: tanpa overflow di 360px dan screenshot untuk QA', async () => {
    for (const path of ['/', `/kegiatan.html?id=${encodeURIComponent(realData[0].id)}`]) {
      const page = await openPage(path, { real: true, viewport: { width: 360, height: 800 } });
      await page.waitForSelector(path === '/' ? '#cards > li' : '[data-source-link]');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow <= 0, `${path} overflow ${overflow}px`);
      await page.screenshot({ path: `test-results/real-${path === '/' ? 'index' : 'detail'}-360.png`, fullPage: true });
      await page.closeAll();
    }
    const page = await openPage('/', { real: true });
    await waitCards(page);
    await page.screenshot({ path: 'test-results/real-index-1280.png', fullPage: true });
    await page.closeAll();
  });
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} tes lulus`);
process.exit(failed.length ? 1 : 0);
