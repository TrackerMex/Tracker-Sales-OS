// Baseline observations only; no feature is marked PASSED by this script.
const { setup, request, fixtures, tmp } = require('./lib.cjs');
const fs = require('fs');
async function observe(h, name, fn) { h.step(name); try { await fn(); } catch (e) { h.note('observation incomplete', e.message); } }
(async () => {
  const health = { checkedAt: new Date().toISOString(), health: (await (await fetch('http://127.0.0.1:3005/')).json()).status, users: {}, clientsById: {} };
  for (const role of ['admin', 'director', 'seller']) { const r = await request(role, 'GET', '/sellers'); health.users[role] = { login: '200', sellers: r.status }; }
  for (const [name, c] of Object.entries(fixtures.clients)) { const r = await request('seller', 'GET', `/clients/${c.id}`); health.clientsById[name] = { status: r.status, message: r.body?.message }; }
  fs.writeFileSync(`${tmp}/baseline/api.json`, JSON.stringify(health, null, 2));
  console.log('Local API baseline', JSON.stringify(health));
  for (const role of ['seller', 'admin', 'director']) {
    const h = await setup({ role }); const p = h.page;
    await observe(h, '83 time zero prefix and 87 focus', async () => {
      await h.goto('/agenda');
      const trigger = p.getByRole('button', { name: 'Crear tarea', exact: true }); await trigger.click();
      await p.locator('#task-time').click(); await p.keyboard.press('0'); await p.keyboard.press('8'); await p.keyboard.press('1'); await p.keyboard.press('5');
      h.note('typed 08:15 shown', await p.locator('#task-time').locator('..').innerText().then(async t => ({ hour: await p.locator('#task-time').inputValue(), minutes: await p.locator('#task-time').locator('..').getByRole('textbox', { name: 'Minutos' }).inputValue(), period: t })));
      if (role === 'admin') {
        await p.fill('#task-objective', 'QA-BUGFIX admin baseline blocked create');
        const response = p.waitForResponse(r => r.url().endsWith('/api/tasks') && r.request().method() === 'POST');
        await p.getByRole('button', { name: 'Guardar tarea', exact: true }).click(); const r = await response;
        h.note('admin create task HTTP', r.status()); await h.shot('admin-create-error');
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(300); h.note('focus after Escape', await h.focus());
    });
    await observe(h, '83 calendar chip', async () => {
      await h.goto('/agenda'); await p.getByRole('tab', { name: 'Calendario', exact: true }).click();
      const chip = p.locator('[draggable="true"]').first(); await chip.waitFor(); await chip.click(); await p.waitForTimeout(350);
      h.note('dialogs after chip click', await h.dialogs()); await h.shot('calendar-chip-dialogs');
      await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    });
    if (role === 'seller') await observe(h, '85 pipeline same stage and deleted client', async () => {
      await h.goto('/pipeline'); const card = p.locator('[draggable="true"]', { hasText: fixtures.clients.visible.name }).first(); await card.waitFor();
      const count = h.state.requests.length; await card.dragTo(card.locator('xpath=ancestor::*[contains(@class,"pipe-col")][1]')); await p.waitForTimeout(700);
      h.note('same-stage mutation responses', h.state.requests.slice(count).filter(r => r.method !== 'GET'));
      h.note('deleted client visible in pipeline', await p.getByText(fixtures.clients.deleted.name).count());
      const deleted = p.locator('[draggable="true"]', { hasText: fixtures.clients.deleted.name }).first(); await deleted.click({ position: { x: 18, y: 10 } }); await p.waitForTimeout(650);
      await h.shot('pipeline-deleted-sheet'); await p.keyboard.press('Escape');
      const old = p.locator('[draggable="true"]', { hasText: fixtures.clients.outside100.name }).first(); await old.click({ position: { x: 18, y: 10 } }); await p.waitForTimeout(650); await h.shot('pipeline-outside100-sheet'); await p.keyboard.press('Escape');
    });
    await observe(h, '85 empty activity validation', async () => {
      await h.goto('/actividades/nueva'); h.note('form noValidate before fix', await p.locator('form').evaluate(f => ({ noValidate: f.noValidate, required: [...f.querySelectorAll('[required]')].map(e => e.id) })));
      const count = h.state.requests.length; await p.locator('form button[type=submit]').click();
      h.note('empty submit', { appErrorVisible: await p.getByText('Selecciona un cliente para actividades comerciales.').count(), nativeInvalid: await p.locator(':invalid').count(), writes: h.state.requests.slice(count).filter(r => !['GET', 'OPTIONS'].includes(r.method)) }); await h.shot('activity-empty');
    });
    for (const pathname of ['/equipo', '/reportes', '/lamina', '/configuracion', '/coaching']) await observe(h, `86 role requests ${pathname}`, async () => {
      const count = h.state.requests.length; await h.goto(pathname); await p.waitForTimeout(450);
      h.note('role request responses', h.state.requests.slice(count));
    });
    await h.finish();
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
