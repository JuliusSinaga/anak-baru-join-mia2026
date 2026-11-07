// Tes E2E JejakDana terhadap build production (`next start`) memakai playwright-core +
// Microsoft Edge/Chrome yang sudah terpasang. Jalankan `npm run build` terlebih dahulu.
// Pemakaian: npm run test:e2e   (BROWSER_CHANNEL=chrome untuk Chrome)
import { spawn } from "node:child_process"
import { mkdir, readFile } from "node:fs/promises"
import { chromium } from "playwright-core"

const PORT = 3100
const BASE = `http://127.0.0.1:${PORT}`
const DATA = JSON.parse(await readFile(new URL("../../data/projects.json", import.meta.url), "utf8"))
await mkdir("test-results", { recursive: true })

const results = []
async function test(name, fn) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  ✓ ${name}`)
  } catch (error) {
    results.push({ name, ok: false })
    console.log(`  ✗ ${name}\n      ${String(error.message).split("\n")[0]}`)
  }
}
function assert(cond, message) {
  if (!cond) throw new Error(message)
}
function eq(actual, expected, message) {
  assert(actual === expected, `${message}: diharapkan ${JSON.stringify(expected)}, didapat ${JSON.stringify(actual)}`)
}

// ---------- Server ----------
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT), "-H", "127.0.0.1"], {
  stdio: ["ignore", "pipe", "pipe"],
})
let serverLog = ""
server.stdout.on("data", (d) => (serverLog += d))
server.stderr.on("data", (d) => (serverLog += d))
const stopServer = () => server.kill()
process.on("exit", stopServer)

for (let i = 0; ; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {
    /* belum siap */
  }
  if (i > 120) {
    console.error(`Server tidak siap. Sudahkah menjalankan npm run build?\n${serverLog}`)
    process.exit(1)
  }
  await new Promise((r) => setTimeout(r, 500))
}

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true })

async function openPage(path, { viewport = { width: 1280, height: 900 } } = {}) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const errors = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text())
  })
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`))
  const response = await page.goto(BASE + path)
  page.response = response
  page.consoleErrors = errors
  page.closeAll = () => context.close()
  return page
}

const cards = (page) => page.locator('[data-testid="project-card"]')
async function waitCatalog(page) {
  await page.waitForSelector('[data-testid="project-card"], [data-testid="empty-state"]')
}
async function chooseSelect(page, triggerId, optionName) {
  await page.click(`#${triggerId}`)
  await page.getByRole("option", { name: optionName, exact: true }).click()
  await page.locator('[role="listbox"]').waitFor({ state: "detached" })
}
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

console.log("JejakDana E2E (Next.js production build)")

await test("Landing: hero, CTA ke /proyek, ringkasan cakupan dari dataset, disclaimer", async () => {
  const page = await openPage("/")
  eq(page.response.status(), 200, "status")
  eq(await page.getAttribute("html", "lang"), "id", "lang")
  eq((await page.textContent("h1")).trim(), "Dari Anggaran ke Dampak Nyata", "h1")
  eq((await page.textContent('[data-stat="total"] span')).trim(), String(DATA.length), "stat total")
  eq((await page.textContent('[data-stat="category"] span')).trim(), "4 Jalan · 2 Trotoar", "stat kategori")
  eq((await page.textContent('[data-stat="budget"] span')).trim(), `0/${DATA.length}`, "stat pagu")
  assert((await page.textContent('[data-testid="coverage-note"]')).includes("29 April 2026 – 12 Oktober 2026"), "rentang tanggal")
  assert(!/Rp\s?\d/.test(await page.textContent("body")), "ada nominal rupiah")
  assert(await page.isVisible('[data-testid="disclaimer-bar"]'), "disclaimer")
  assert(await page.locator("#metodologi").count() === 1, "seksi metodologi")
  await page.getByRole("link", { name: "Jelajahi kegiatan" }).click()
  await page.waitForURL(`${BASE}/proyek`)
  await waitCatalog(page)
  eq(page.consoleErrors.length, 0, `error konsol: ${page.consoleErrors.join(" | ")}`)
  await page.closeAll()
})

await test("AC-01 katalog /proyek merender semua kegiatan dari dataset", async () => {
  const page = await openPage("/proyek")
  await waitCatalog(page)
  eq(await cards(page).count(), DATA.length, "jumlah kartu")
  eq((await page.textContent('[data-testid="result-count"]')).trim(), `Menampilkan semua ${DATA.length} kegiatan`, "teks jumlah")
  for (const p of DATA) assert((await page.getByRole("heading", { name: p.name, exact: true }).count()) === 1, `kartu ${p.id}`)
  const budgets = await page.locator("[data-card-budget] strong").allTextContents()
  assert(budgets.every((t) => t === "Belum terverifikasi"), `pagu di kartu: ${budgets}`)
  eq(page.consoleErrors.length, 0, `error konsol: ${page.consoleErrors.join(" | ")}`)
  await page.closeAll()
})

await test('AC-02 pencarian "juanda" menemukan Juanda saja dan tersimpan di URL', async () => {
  const page = await openPage("/proyek")
  await waitCatalog(page)
  await page.fill("#q", "juanda")
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="project-card"]').length === 1)
  eq(await cards(page).getAttribute("data-id"), "juanda", "hasil")
  eq((await page.textContent('[data-testid="result-count"]')).trim(), `Menampilkan 1 dari ${DATA.length} kegiatan`, "jumlah")
  await page.waitForFunction(() => location.search.includes("q=juanda"))
  await page.closeAll()
})

await test("AC-03 filter Trotoar hanya memunculkan Trotoar", async () => {
  const page = await openPage("/proyek")
  await waitCatalog(page)
  await chooseSelect(page, "filter-kategori", "Trotoar")
  const cats = await page.locator('[data-testid="project-card"] [data-category]').allTextContents()
  eq(cats.length, DATA.filter((p) => p.category === "Trotoar").length, "jumlah")
  assert(cats.every((c) => c === "Trotoar"), `kategori: ${cats}`)
  await page.closeAll()
})

await test("Filter status + kombinasi → empty state → reset memulihkan semua", async () => {
  const page = await openPage("/proyek")
  await waitCatalog(page)
  await chooseSelect(page, "filter-status", "Selesai menurut sumber")
  eq(await cards(page).count(), DATA.filter((p) => p.reported_status === "selesai_menurut_sumber").length, "selesai")
  await chooseSelect(page, "filter-kategori", "Trotoar")
  await page.waitForSelector('[data-testid="empty-state"]')
  eq(await cards(page).count(), 0, "kombinasi")
  await page.getByRole("button", { name: "Reset pencarian & filter" }).click()
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="project-card"]').length === n, DATA.length)
  eq(await page.evaluate(() => document.activeElement?.id), "q", "fokus kembali ke pencarian")
  await page.fill("#q", "zzz-tidak-ada")
  await page.waitForSelector('[data-testid="empty-state"]')
  await page.click('[data-testid="reset-filters"]')
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="project-card"]').length === n, DATA.length)
  eq(await page.inputValue("#q"), "", "input pencarian")
  await page.closeAll()
})

await test("Filter dari URL (?q=juanda&kategori=Trotoar) diterapkan saat memuat; nilai asing diabaikan", async () => {
  let page = await openPage("/proyek?q=juanda&kategori=Trotoar")
  await waitCatalog(page)
  eq(await cards(page).count(), 1, "hasil")
  eq((await page.textContent("#filter-kategori")).trim(), "Trotoar", "kategori terpilih")
  await page.closeAll()
  page = await openPage("/proyek?kategori=Bukan&status=palsu")
  await waitCatalog(page)
  eq(await cards(page).count(), DATA.length, "nilai asing diabaikan")
  await page.closeAll()
})

await test("Filter tahun & data anggaran: terhubung ke URL, dipulihkan dari URL, dan layak disentuh di 360px", async () => {
  const mobile = { viewport: { width: 360, height: 740 } }
  let page = await openPage("/proyek", mobile)
  await waitCatalog(page)
  for (const id of ["filter-tahun", "filter-pagu"]) {
    const box = await page.locator(`#${id}`).boundingBox()
    assert(box.height >= 44 && box.width >= 200, `#${id} terlalu kecil di mobile (${box.width}x${box.height})`)
    assert((await page.locator(`#${id}`).evaluate((n) => n.scrollWidth - n.clientWidth)) <= 0, `#${id} teks terpotong`)
  }
  await chooseSelect(page, "filter-pagu", "Pagu terverifikasi tersedia")
  await page.waitForSelector('[data-testid="empty-state"]')
  await page.waitForFunction(() => location.search.includes("pagu=ada"))
  await chooseSelect(page, "filter-pagu", "Pagu belum terverifikasi")
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="project-card"]').length === n, DATA.length)
  const year = String(DATA[0].fiscal_year)
  await chooseSelect(page, "filter-tahun", year)
  await page.waitForFunction((y) => location.search.includes(`tahun=${y}`) && location.search.includes("pagu=belum"), year)
  eq(await overflowX(page), 0, "overflow horizontal")
  await page.closeAll()
  page = await openPage(`/proyek?tahun=${year}&pagu=ada`, mobile)
  await waitCatalog(page)
  eq((await page.textContent("#filter-tahun")).trim(), year, "tahun dipulihkan dari URL")
  eq((await page.textContent("#filter-pagu")).trim(), "Pagu terverifikasi tersedia", "pagu dipulihkan dari URL")
  eq(await cards(page).count(), 0, "kombinasi tanpa hasil")
  await page.closeAll()
  page = await openPage("/proyek?tahun=1999&pagu=asing")
  await waitCatalog(page)
  eq(await cards(page).count(), DATA.length, "nilai asing diabaikan")
  await page.closeAll()
})

await test("AC-04/AC-05 setiap /proyek/[slug]: URL sumber persis, aman, dan null tampil jujur", async () => {
  for (const p of DATA) {
    const page = await openPage(`/proyek/${p.id}`)
    eq(page.response.status(), 200, `${p.id} status`)
    eq((await page.textContent("h1")).trim(), p.name, `${p.id} h1`)
    assert((await page.title()).startsWith(p.name), `${p.id} title`)
    const link = page.locator("[data-source-link]")
    eq(await link.getAttribute("href"), p.source_url, `${p.id} href`)
    eq(await link.getAttribute("target"), "_blank", `${p.id} target`)
    eq(await link.getAttribute("rel"), "noopener noreferrer", `${p.id} rel`)
    assert((await page.textContent("main")).includes(p.source_url), `${p.id} URL tertulis`)
    const expected = {
      budget_ceiling_idr: "Belum terverifikasi",
      contract_value_idr: "Belum terverifikasi",
      physical_progress_percent: "Belum tersedia",
      rup_id: "Belum terverifikasi",
    }
    for (const [key, text] of Object.entries(expected)) {
      if (p[key] === null) eq((await page.textContent(`[data-field="${key}"] dd`)).trim(), text, `${p.id} ${key}`)
    }
    const main = await page.textContent("main")
    assert(!/Rp\s?0|\b0\s?%/.test(main), `${p.id} menampilkan Rp0/0%`)
    assert(main.includes(p.warning), `${p.id} warning`)
    assert(main.includes("bukan situs resmi"), `${p.id} disclaimer`)
    const desc = await page.getAttribute('meta[name="description"]', "content")
    assert(desc && desc.includes(p.location), `${p.id} meta description`)
    eq(await page.getAttribute('link[rel="canonical"]', "href"), `http://localhost:3000/proyek/${p.id}`, `${p.id} canonical`)
    eq(page.consoleErrors.length, 0, `${p.id} error konsol: ${page.consoleErrors.join(" | ")}`)
    await page.closeAll()
  }
})

await test("Status menyertakan tanggal publikasi sumber", async () => {
  const page = await openPage("/proyek/pimpinan-gurilla")
  eq((await page.textContent('[data-testid="status-line"]')).trim(), "Selesai menurut sumber — berdasarkan publikasi 29 Juli 2026", "status")
  await page.closeAll()
})

await test("Laporan warga nonaktif tanpa Supabase: bagian tidak tampil dan API menjawab 503", async () => {
  const page = await openPage("/proyek/juanda")
  eq(await page.locator('[data-testid="reports"]').count(), 0, "bagian laporan")
  eq(await page.locator('[data-testid="report-form"]').count(), 0, "form laporan")
  await page.closeAll()
  const res = await fetch(`${BASE}/api/laporan`, { method: "POST", body: "{}" })
  eq(res.status, 503, "status API")
})

await test("Slug tidak dikenal → 404 dengan halaman 'tidak ditemukan'", async () => {
  const page = await openPage("/proyek/tidak-ada")
  eq(page.response.status(), 404, "status")
  eq((await page.textContent("h1")).trim(), "Halaman tidak ditemukan", "h1")
  await page.closeAll()
})

await test("AC-06 menu navigasi mobile terbuka, ditutup dengan ESC, fokus kembali", async () => {
  const page = await openPage("/proyek", { viewport: { width: 360, height: 740 } })
  await waitCatalog(page)
  const trigger = page.getByRole("button", { name: "Buka menu navigasi" })
  await trigger.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", { name: "Menu" })
  await dialog.waitFor({ state: "visible" })
  assert((await dialog.getByRole("link", { name: "Katalog" }).getAttribute("aria-current")) === "page", "aria-current")
  await page.keyboard.press("Escape")
  await dialog.waitFor({ state: "detached" })
  assert(await trigger.evaluate((n) => n === document.activeElement), "fokus tidak kembali ke tombol menu")
  // Navigasi lewat menu mobile berfungsi
  await trigger.click()
  await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Beranda" }).click()
  await page.waitForURL(`${BASE}/`)
  await page.closeAll()
})

await test("Select filter dapat dipakai dengan keyboard", async () => {
  const page = await openPage("/proyek")
  await waitCatalog(page)
  await page.focus("#filter-kategori")
  await page.keyboard.press("Enter")
  // Radix memindahkan fokus ke opsi terpilih setelah listbox ter-mount; tunggu itu sebelum menekan panah.
  const focusedOption = (text) =>
    page.waitForFunction((t) => {
      const a = document.activeElement
      return a?.getAttribute("role") === "option" && a.textContent?.trim() === t
    }, text)
  await focusedOption("Semua kategori")
  for (const next of ["Jalan", "Trotoar"]) {
    await page.keyboard.press("ArrowDown")
    await focusedOption(next)
  }
  await page.keyboard.press("Enter")
  await page.locator('[role="listbox"]').waitFor({ state: "detached" })
  const picked = (await page.textContent("#filter-kategori")).trim()
  assert(picked !== "Semua kategori", "pilihan keyboard tidak diterapkan")
  const cats = await page.locator('[data-testid="project-card"] [data-category]').allTextContents()
  assert(cats.length > 0 && cats.every((c) => c === picked), `hasil tidak sesuai ${picked}`)
  await page.closeAll()
})

for (const width of [360, 768, 1280]) {
  await test(`AC-07/AC-08 lebar ${width}px: tanpa overflow horizontal, disclaimer terlihat, header utuh`, async () => {
    for (const path of ["/", "/proyek", "/proyek/juanda", "/proyek/tidak-ada"]) {
      const page = await openPage(path, { viewport: { width, height: 800 } })
      if (path === "/proyek") await waitCatalog(page)
      const overflow = await overflowX(page)
      assert(overflow <= 0, `${path} overflow ${overflow}px`)
      assert(await page.isVisible('[data-testid="disclaimer-bar"]'), `${path} disclaimer`)
      const headerHeight = await page.evaluate(() => document.querySelector("header").getBoundingClientRect().height)
      assert(headerHeight <= 72, `${path} header terlalu tinggi (${headerHeight}px), kemungkinan teks terpotong`)
      const name = path === "/" ? "landing" : path === "/proyek" ? "katalog" : path.endsWith("tidak-ada") ? "404" : "detail"
      if (name !== "404") await page.screenshot({ path: `test-results/${name}-${width}.png`, fullPage: true })
      await page.closeAll()
    }
  })
}

await test("Semua tautan internal valid (200) dan anchor ada", async () => {
  const hrefs = new Set()
  for (const path of ["/", "/proyek", "/proyek/juanda"]) {
    const page = await openPage(path)
    for (const h of await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) hrefs.add(h)
    await page.closeAll()
  }
  for (const href of [...hrefs].filter((h) => !/^https?:/.test(h))) {
    const url = new URL(href, `${BASE}/`)
    eq((await fetch(`${BASE}${url.pathname}`)).status, 200, `status ${href}`)
    if (url.hash && url.hash !== "#konten") {
      const page = await openPage(url.pathname)
      assert((await page.locator(url.hash).count()) === 1, `anchor ${href}`)
      await page.closeAll()
    }
  }
})

await test("SEO dasar: title, description, Open Graph, sitemap.xml, robots.txt, ikon", async () => {
  const page = await openPage("/proyek")
  eq(await page.title(), "Katalog kegiatan — JejakDana", "title")
  assert((await page.getAttribute('meta[name="description"]', "content"))?.length > 50, "description")
  eq(await page.getAttribute('meta[property="og:locale"]', "content"), "id_ID", "og:locale")
  await page.closeAll()
  const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text()
  for (const p of DATA) assert(sitemap.includes(`/proyek/${p.id}</loc>`), `sitemap ${p.id}`)
  assert((await (await fetch(`${BASE}/robots.txt`)).text()).includes("Sitemap:"), "robots")
  eq((await fetch(`${BASE}/icon.svg`)).status, 200, "icon")
})

await test("Header keamanan dasar terpasang", async () => {
  const res = await fetch(`${BASE}/`)
  eq(res.headers.get("x-content-type-options"), "nosniff", "nosniff")
  eq(res.headers.get("x-frame-options"), "DENY", "frame")
  eq(res.headers.get("x-powered-by"), null, "x-powered-by")
})

await test("Keyboard: skip link adalah fokus pertama dan menuju konten utama", async () => {
  const page = await openPage("/")
  await page.keyboard.press("Tab")
  eq(await page.evaluate(() => document.activeElement?.getAttribute("href")), "#konten", "fokus pertama")
  await page.keyboard.press("Enter")
  await page.waitForFunction(() => location.hash === "#konten")
  await page.closeAll()
})

await browser.close()
stopServer()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} tes E2E lulus`)
process.exit(failed.length ? 1 : 0)
