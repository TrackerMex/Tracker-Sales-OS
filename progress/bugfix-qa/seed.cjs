// QA-only fixtures; refuses any database outside the dedicated loopback stack.
const fs = require('fs');
const assert = require('assert/strict');
const root = '/home/claude/sites/Tracker-Sales-OS';
const tmp = '/tmp/tracker-sales-bugfix-qa';
for (const line of fs.readFileSync(`${tmp}/qa.env`, 'utf8').split('\n')) {
  const i = line.indexOf('='); if (i > 0) process.env[line.slice(0, i)] = line.slice(i + 1);
}
assert.equal(process.env.POSTGRES_HOST, '127.0.0.1');
assert.equal(process.env.POSTGRES_PORT, '5434');
assert.equal(process.env.POSTGRES_DB, 'tracker_sales_bugfix_qa');
require(`${root}/backend/node_modules/ts-node`).register({ transpileOnly: true, project: `${root}/backend/tsconfig.json` });
const bcrypt = require(`${root}/backend/node_modules/bcrypt`);
const ds = require(`${root}/backend/src/data-source.ts`).default;
const repo = name => ds.getRepository(name);
(async () => {
  await ds.initialize();
  try {
    await ds.synchronize();
    assert.equal(await repo('UserTypeormEntity').count(), 0, 'Seed runs only once on an empty QA database.');
    const passwordHash = await bcrypt.hash(process.env.QA_PASSWORD, 10);
    const sellers = {};
    for (const name of ['seller', 'other', 'inactive', 'team-action']) sellers[name] = await repo('SellerTypeormEntity').save({ name: `QA-BUGFIX ${name}`, active: name !== 'inactive', profile: 'QA-BUGFIX local fixture' });
    const users = {};
    for (const [name, role, sellerName] of [['admin', 'Admin', null], ['director', 'Director', null], ['seller', 'Seller', 'seller'], ['other', 'Seller', 'other']]) {
      users[name] = await repo('UserTypeormEntity').save({ username: `QA-BUGFIX-${name}`, name: `QA-BUGFIX ${role} ${name}`, passwordHash, role, sellerId: sellerName ? sellers[sellerName].id : null, active: true });
      if (sellerName) await repo('SellerTypeormEntity').update(sellers[sellerName].id, { userId: users[name].id });
    }
    const now = new Date();
    const clients = await repo('ClientTypeormEntity').save(Array.from({ length: 122 }, (_, i) => ({ name: `QA-BUGFIX Client ${String(i).padStart(3, '0')}`, domain: `qa-bugfix-${i}.example.invalid`, type: 'Nuevo', person: 'Moral', sellerId: sellers.seller.id, source: i % 2 ? 'Referido' : 'Prospección propia', stage: i < 2 ? 'Contactado' : 'Prospecto', expectedAmount: 12000 + i, units: 4, pain: 'QA-BUGFIX needs an accountable sales plan.', nextStep: 'QA-BUGFIX Call to confirm requirements', createdAt: i === 0 ? new Date('2025-01-01T12:00:00Z') : new Date(now.getTime() - i * 1000) })));
    const foreign = await repo('ClientTypeormEntity').save({ name: 'QA-BUGFIX Other Owner', domain: 'qa-bugfix-other.example.invalid', type: 'Nuevo', person: 'Moral', sellerId: sellers.other.id, source: 'Web', stage: 'Propuesta', expectedAmount: 18000, units: 5 });
    const removed = await repo('ClientTypeormEntity').save({ name: 'QA-BUGFIX Deleted Client', domain: 'qa-bugfix-deleted.example.invalid', type: 'Nuevo', person: 'Moral', sellerId: sellers.seller.id, source: 'Referido', stage: 'Contactado', deletedAt: now });
    await repo('ContactTypeormEntity').save({ clientId: clients[1].id, name: 'QA-BUGFIX Contact', role: 'Director', phone: '5550000101', email: 'qa-bugfix@example.invalid', isDecisionMaker: true });
    const deals = {};
    for (const [name, client] of [['outside100', clients[0]], ['visible', clients[1]], ['foreign', foreign], ['deleted', removed]]) deals[name] = await repo('DealTypeormEntity').save({ clientId: client.id, clientName: client.name, sellerId: client.sellerId, stage: client.stage, amount: 12000, probability: 20, opportunityName: `QA-BUGFIX ${name}`, stageHistory: [{ oldStage: 'Prospecto', newStage: client.stage, changedAt: now.toISOString(), changedBy: users.admin.id }] });
    const tasks = {};
    for (const [name, hours] of [['calendar', 10], ['complete', 11], ['activity', 12]]) {
      const scheduledAt = new Date(now); scheduledAt.setHours(hours, 15, 0, 0);
      tasks[name] = await repo('TaskTypeormEntity').save({ sellerId: sellers.seller.id, clientId: clients[1].id, type: 'Llamada', title: `QA-BUGFIX ${name} task`, description: 'QA-BUGFIX scheduled action', scheduledAt, status: 'Pendiente' });
    }
    for (let i = 0; i < 5; i++) await repo('ActivityTypeormEntity').save({ sellerId: sellers.seller.id, clientId: clients[1].id, taskId: i === 0 ? tasks.activity.id : null, type: 'Llamada', result: 'Interesado', summary: `QA-BUGFIX baseline activity ${i}: customer needs confirmed`, discovery: 'QA-BUGFIX budget and decision makers known', agreement: 'QA-BUGFIX call next week', nextStep: 'QA-BUGFIX Send concrete proposal', nextDate: now.toISOString().slice(0, 10), nextTime: '14:00', points: 3, quality: 80, stage: 'Contactado', status: 'Completada', activityHistory: [], executedAt: new Date(now.getTime() - i * 86400000), capturedAt: now, delayMinutes: 0 });
    for (const [i, type] of ['seller', 'atc', 'direction'].entries()) await repo('SaleTypeormEntity').save({ sellerId: sellers.seller.id, clientId: clients[1].id, clientName: clients[1].name, clientType: i === 1 ? 'Existente' : 'Nuevo', product: `QA-BUGFIX Product ${i}`, units: 12 + i, amount: 42000 + 5000 * i, pay: 'Pagado', source: i ? 'Referido' : 'Prospección propia', type, date: now.toISOString().slice(0, 10), notes: 'QA-BUGFIX local sale' });
    assert((await repo('ClientTypeormEntity').count()) > 100);
    const fixtures = { users: Object.fromEntries(Object.entries(users).map(([n, u]) => [n, { id: u.id, username: u.username, role: u.role, sellerId: u.sellerId }])), sellers: Object.fromEntries(Object.entries(sellers).map(([n, s]) => [n, { id: s.id, name: s.name, active: s.active }])), clients: { outside100: clients[0], visible: clients[1], foreign, deleted: removed }, deals, tasks, month: now.toISOString().slice(0, 7) };
    fs.writeFileSync(`${tmp}/fixtures.json`, JSON.stringify(fixtures, null, 2), { mode: 0o600 });
    console.log('QA fixtures ready: four users, four sellers, 123 live clients, deleted-client deal, three tasks, activities and sales. Credentials omitted.');
  } finally { await ds.destroy(); }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
