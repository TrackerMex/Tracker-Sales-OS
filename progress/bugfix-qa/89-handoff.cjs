const fs = require('fs');
const crypto = require('crypto');
const { setup, request, tmp, api, fixture, dbOpen, select, chooseClient } = require('./89-lib.cjs');
const phase = process.argv[2] || 'after';
let failures = 0;
const created = [];

async function run(role, width, theme, db, f, noClient = false) {
  const client = noClient ? f.clients.B : f.clients.A;
  const contact = noClient ? f.contacts.B : f.contacts.A;
  const manager = role === 'admin';
  const title = `${f.prefix} Handoff ${phase} ${role} ${noClient ? 'NoClient ' : ''}${crypto.randomUUID().slice(0,8)}`;
  const date = new Date(); date.setUTCHours(manager ? 10 : 11, 49, 0, 0);
  const fixtureTask = await request('admin', 'POST', '/tasks', {
    sellerId: f.owner.id, ...(noClient ? {} : {clientId: f.clients.A.id}), type: 'Chat', title, scheduledAt: date.toISOString()
  });
  if (fixtureTask.status !== 201) throw Error(`QA task creation failed: ${fixtureTask.status}`);
  const task = fixtureTask.body; created.push(task);
  const q = await setup({role, width, theme, out: `${tmp}/89-handoff-${phase}-${role}-${width}-${theme}${noClient ? '-no-client' : ''}`});
  const {page} = q;
  const check = (name, pass, actual = {}) => { q.note(name, {pass, ...actual}); if (!pass) failures++; };
  try {
    q.step('complete task and preserve prelinked context');
    await q.goto(manager ? '/agenda' : '/mi-dia');
    if (manager) {
      await page.getByRole('combobox', {name:'Filtrar por vendedor'}).click({noWaitAfter:true});
      await page.getByRole('option', {name:f.owner.name, exact:true}).click({noWaitAfter:true});
      const row = page.locator('div.flex.items-start.justify-between').filter({has:page.getByText(title, {exact:true})});
      await row.getByText(f.clients.A.name, {exact:true}).waitFor();
      await row.getByRole('button', {name:'Completar', exact:true}).click({noWaitAfter:true});
    } else {
      await page.getByRole('button', {name:`Completar: ${title}`, exact:true}).click({noWaitAfter:true});
    }
    const completePromise = page.waitForResponse(r => r.url() === `${api}/tasks/${task.id}/complete` && r.request().method() === 'PATCH');
    await page.getByRole('button', {name:'Sí, completar', exact:true}).click({noWaitAfter:true});
    const completeResponse = await completePromise;
    const completeBody = await completeResponse.json();
    await page.waitForURL(u => u.pathname === '/actividades/nueva');
    await page.locator('#activity-summary').waitFor();
    const params = new URL(page.url()).searchParams;
    check('Completed task hands off exact client/owner/task IDs', completeResponse.status() === 200 && completeBody.status === 'Completado' && params.get('clientId') === (noClient ? null : f.clients.A.id) && params.get('sellerId') === f.owner.id && params.get('taskId') === task.id,
      {completeStatus:completeResponse.status(), taskStatus:completeBody.status, clientId:params.get('clientId'), sellerId:params.get('sellerId'), taskId:params.get('taskId')});
    const tasks = await request(role, 'GET', `/tasks/seller/${f.owner.id}/today?date=${date.toISOString().slice(0,10)}`);
    const rows = Array.isArray(tasks.body) ? tasks.body : tasks.body.items;
    check('Prelinked task is completed and outside pending task choices', tasks.status === 200 && rows?.some(t => t.id === task.id && t.status === 'Completado') && !rows?.filter(t=>t.status==='Pendiente').some(t=>t.id===task.id),
      {status:tasks.status, linkedStatus:rows?.find(t=>t.id===task.id)?.status});
    if (noClient) {
      check('Prelinked task without client keeps picker enabled and task title fixed', await page.locator('#clientId').innerText() === 'Sin cliente' && !await page.locator('#clientId').isDisabled() && await page.locator('#activity-task').inputValue() === title,
        {client:await page.locator('#clientId').innerText(), disabled:await page.locator('#clientId').isDisabled(), task:await page.locator('#activity-task').inputValue()});
      await chooseClient(page, client);
      check('Manual client remains compatible with fixed completed task without client', await page.locator('#clientId').innerText() === client.name && await page.locator('#activity-task').inputValue() === title,
        {client:await page.locator('#clientId').innerText(), task:await page.locator('#activity-task').inputValue()});
    } else {
      await page.locator('#clientId').getByText(client.name, {exact:true}).waitFor();
      check('Prelinked completed task keeps exact visible client and disables incompatible client changes', await page.locator('#clientId').innerText() === client.name && await page.locator('#clientId').isDisabled() && await page.locator('#activity-task').inputValue() === title && await page.getByText('Se conserva el cliente de la tarea vinculada.', {exact:true}).count() === 1,
        {client:await page.locator('#clientId').innerText(), disabled:await page.locator('#clientId').isDisabled(), task:await page.locator('#activity-task').inputValue()});
    }
    await select(page, 'activity-contact', new RegExp(contact.name));
    check('Prelinked client hydrates exact contact by ID', (await page.locator('#activity-contact').innerText()).includes(contact.name) && q.state.requests.some(r=>r.path===`/clients/${client.id}`&&r.status===200),
      {contact:await page.locator('#activity-contact').innerText(), detailGET:q.state.requests.filter(r=>r.path===`/clients/${client.id}`)});
    await page.locator('#activity-summary').fill(`${title} saved activity`);
    await q.shot('prelinked-completed-client-contact');
    const savePromise = page.waitForResponse(r=>r.url()===`${api}/activities`&&r.request().method()==='POST');
    await page.getByRole('button',{name:/^Registrar ·/}).click({noWaitAfter:true});
    const response=await savePromise, body=await response.json(), payload=response.request().postDataJSON();
    fs.writeFileSync(`${q.out}/final-post.json`,JSON.stringify({status:response.status(),payload,body},null,2));
    const match=o=>o.sellerId===f.owner.id&&o.clientId===client.id&&o.taskId===task.id&&o.contactId===contact.id;
    check('Prelinked activity POST201 response preserves exact task/client/owner/contact',response.status()===201&&match(payload)&&match(body),{status:response.status(),payload,body});
    const row=(await db.query('SELECT seller_id,client_id,task_id,contact_id,summary FROM activities WHERE id=$1',[body.id])).rows[0];
    check('Prelinked activity persists exact context in database',row?.seller_id===f.owner.id&&row.client_id===client.id&&row.task_id===task.id&&row.contact_id===contact.id&&row.summary===payload.summary,{row});
    check('No errors, unexpected HTTP failures or external requests',!q.state.http.length&&!q.state.errors.length&&!q.state.blocked.length,{http:q.state.http,errors:q.state.errors,blocked:q.state.blocked});
  } catch(e) {
    check('Handoff runner completed',false,{error:e.message}); await q.shot('failure').catch(()=>{}); fs.writeFileSync(`${q.out}/failure.html`,await page.content());
  } finally { await q.finish(); }
}
(async()=>{const f=fixture(),db=await dbOpen();try{await run('admin',1440,'light',db,f);await run('seller',390,'dark',db,f);await run('seller',1440,'light',db,f,true);}finally{for(const task of created){if(!task.title.startsWith(f.prefix+' Handoff '))throw Error('Unsafe cleanup task');await request('admin','DELETE',`/tasks/${task.id}`);}await db.end();}process.exitCode=failures?1:0;})().catch(e=>{console.error(e.message);process.exitCode=1;});
