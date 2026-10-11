process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const fs = require('fs');
const assert = require('assert/strict');
const { chromium } = require(process.env.QA_PLAYWRIGHT_MODULE || '/home/claude/sites/odc/frontend/node_modules/.pnpm/playwright@1.62.0/node_modules/playwright');
const tmp = '/tmp/tracker-sales-bugfix-qa';
const env = Object.fromEntries(fs.readFileSync(`${tmp}/qa.env`, 'utf8').trim().split('\n').map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const fixtures = JSON.parse(fs.readFileSync(`${tmp}/fixtures.json`, 'utf8'));
const base = 'http://127.0.0.1:3001';
const api = 'http://127.0.0.1:3005/api';
async function request(role, method, pathname, data) {
  assert(pathname.startsWith('/') && !pathname.startsWith('//'));
  const auth = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: fixtures.users[role].username, password: env.QA_PASSWORD }) });
  assert.equal(auth.status, 200);
  const { accessToken } = await auth.json();
  const response = await fetch(`${api}${pathname}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, ...(data ? { body: JSON.stringify(data) } : {}) });
  let body; try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}
async function setup({ role = 'admin', theme = 'light', width = 1440, out = `${tmp}/baseline/${role}-${width}-${theme}` } = {}) {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', timezoneId: 'UTC' });
  await ctx.addInitScript(t => localStorage.setItem('theme', t), theme);
  ctx.setDefaultTimeout(20000); ctx.setDefaultNavigationTimeout(20000);
  const state = { role, theme, width, startedAt: new Date().toISOString(), tests: [], http: [], errors: [], requests: [], blocked: [] };
  let step = 'login';
  await ctx.route('**/*', route => {
    const u = new URL(route.request().url());
    const allowed = u.origin === base || u.origin === 'http://127.0.0.1:3005';
    if (!allowed || (u.pathname.startsWith('/api') && u.origin !== 'http://127.0.0.1:3005')) { state.blocked.push({ step, url: u.origin + u.pathname }); return route.abort(); }
    return route.continue();
  });
  const page = await ctx.newPage();
  const track = p => {
    p.on('pageerror', e => state.errors.push({ step, text: e.message }));
    p.on('console', m => { if (m.type() === 'error') state.errors.push({ step, text: m.text() }); });
    p.on('response', r => {
      if (r.url().startsWith(api)) { const item = { step, method: r.request().method(), path: r.url().slice(api.length), status: r.status() }; state.requests.push(item); if (r.status() >= 400) state.http.push(item); }
    });
  };
  track(page); ctx.on('page', p => { if (p !== page) track(p); });
  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name=username]', fixtures.users[role].username);
  await page.fill('input[name=password]', env.QA_PASSWORD);
  await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]);
  return {
    page, ctx, state, out, base, fixtures,
    step(name) { step = name; },
    note(name, actual) { state.tests.push({ step, name, actual }); console.log(`${role}/${width}/${theme}: ${name} = ${JSON.stringify(actual)}`); },
    async shot(name, target = page) { await target.screenshot({ path: `${out}/${name}.png`, fullPage: true, timeout: 10000 }); },
    async goto(pathname) { await page.goto(`${base}${pathname}`, { waitUntil: 'networkidle' }); },
    async dialogs() { return page.locator('[role=dialog],[role=alertdialog]').evaluateAll(ds => ds.filter(d => d.getBoundingClientRect().width).map(d => ({ title: (d.querySelector('h2') || d).textContent.trim().slice(0, 80), hidden: !!d.closest('[aria-hidden=true]') }))); },
    async focus() { return page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim().slice(0, 60), id: document.activeElement?.id })); },
    async metrics(target = page) { return target.evaluate(() => { const slide = document.querySelector('#executive-slide'); const r = slide?.getBoundingClientRect(); return { viewport: innerWidth, document: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth - innerWidth, slide: r ? { x: r.x, width: r.width, right: r.right, scrollWidth: slide.scrollWidth } : null, theme: document.documentElement.className }; }); },
    async finish() { fs.writeFileSync(`${out}/result.json`, JSON.stringify(state, null, 2)); await browser.close(); },
  };
}
module.exports = { setup, request, fixtures, tmp, base, api };
