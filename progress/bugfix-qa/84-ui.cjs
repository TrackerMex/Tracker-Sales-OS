const assert = require('assert/strict');
const crypto = require('crypto');
const {setup,request,fixtures,tmp,api}=require('./lib.cjs');
const phase=process.argv[2]||'after';
const part=process.argv[3]||'all';
const roles=process.argv[4]?[process.argv[4]]:['admin','director'];
let failures=0;
const created=[];
const unique=`QA-BUGFIX84 ${crypto.randomUUID().slice(0,8)}`;
async function fixtureTask(seller,client,hour,label){
 const date=new Date();date.setUTCHours(hour,45,0,0);
 const r=await request('admin','POST','/tasks',{sellerId:fixtures.sellers[seller].id,clientId:fixtures.clients[client].id,type:'Chat',title:`${unique} ${label}`,scheduledAt:date.toISOString()});
 assert.equal(r.status,201,JSON.stringify(r.body));created.push(r.body);return r.body;
}
async function run(role,segment,otherTask,ownTask){
 const q=await setup({role,out:`${tmp}/84-ui-${phase}-${role}-${segment}`});const {page,state}=q;
 const payloads=[];
 page.on('request',r=>{if(r.url().startsWith(api)&&r.method()==='POST'&&['/tasks','/activities','/coaching/suggestion'].includes(r.url().slice(api.length))){const b=r.postDataJSON();payloads.push({path:r.url().slice(api.length),sellerId:b.sellerId,clientId:b.clientId,contactId:b.contactId,taskId:b.taskId,opportunityName:b.opportunityName});}});
 const check=(name,pass,actual)=>{q.note(name,{pass,...actual});if(!pass)failures++;};
 const select=async(id,name)=>{await page.locator(`#${id}`).click({noWaitAfter:true});await page.getByRole('option',{name,exact:typeof name==='string'}).click({noWaitAfter:true});};
 const client=async(id,name)=>{await page.locator(`#${id}`).click({noWaitAfter:true});await page.getByPlaceholder('Buscar por nombre...').fill(name);await page.getByRole('option',{name,exact:true}).click({noWaitAfter:true});};
 const post=async(path,button)=>{const response=page.waitForResponse(r=>r.url()===`${api}${path}`&&r.request().method()==='POST');await button.click({noWaitAfter:true});const r=await response;return{status:r.status(),body:await r.json(),payload:payloads.at(-1)};};
 const aux=owner=>state.requests.filter(r=>r.status===200&&(r.path.includes(`/seller/${owner}`)||r.path.includes(`seller=${owner}`)));
 try{
  if(segment==='create'){
   q.step('task owner required');await q.goto('/agenda');await page.getByRole('button',{name:'Crear tarea',exact:true}).click({noWaitAfter:true});await page.locator('#task-objective').fill(`${unique} ${role} task`);
   const n=payloads.length;await page.getByRole('button',{name:'Guardar tarea',exact:true}).click({noWaitAfter:true});await page.locator('#sellerId-error').waitFor();check('Task missing owner: own error and zero POST',payloads.length===n&&/activo/.test(await page.locator('#sellerId-error').innerText()),{posts:payloads.length-n,focus:await q.focus()});
   await page.locator('#task-seller').click({noWaitAfter:true});check('Task choices contain only active sellers',await page.getByRole('option',{name:fixtures.sellers.other.name,exact:true}).count()===1&&await page.getByRole('option',{name:fixtures.sellers.inactive.name,exact:true}).count()===0,{});await page.getByRole('option',{name:fixtures.sellers.other.name,exact:true}).click({noWaitAfter:true});
   await client('task-client',fixtures.clients.foreign.name);await page.getByRole('button',{name:'Obtener sugerencias',exact:true}).waitFor();const coaching=await post('/coaching/suggestion',page.getByRole('button',{name:'Obtener sugerencias',exact:true}));check('Task coaching selected owner and client, local fallback',coaching.status===201&&coaching.payload.sellerId===fixtures.sellers.other.id&&coaching.payload.clientId===fixtures.clients.foreign.id&&coaching.body.source==='fallback',{...coaching,payload:coaching.payload,body:{source:coaching.body.source}});
   await select('task-seller',fixtures.sellers.seller.name);check('Task owner change clears client and contact',/Buscar|cliente|empresa/.test(await page.locator('#task-client').innerText())&&!/Other Owner/.test(await page.locator('#task-client').innerText())&&/primero/.test(await page.locator('#task-contact').innerText()),{client:await page.locator('#task-client').innerText(),contact:await page.locator('#task-contact').innerText()});
   await select('task-seller',fixtures.sellers.other.name);await client('task-client',fixtures.clients.foreign.name);
   const time=page.locator('#task-time').locator('..');await page.locator('#task-time').focus();await page.keyboard.type(role==='admin'?'05':'06');await time.getByRole('textbox',{name:'Minutos'}).focus();await page.keyboard.type('00');if((await time.getByRole('button').innerText()).trim()!=='PM')await time.getByRole('button').click({noWaitAfter:true});
   await q.shot('task-selected');const saved=await post('/tasks',page.getByRole('button',{name:'Guardar tarea',exact:true}));check('Task saved for selected owner and client',saved.status===201&&saved.body.sellerId===fixtures.sellers.other.id&&saved.body.clientId===fixtures.clients.foreign.id,{status:saved.status,payload:saved.payload});if(saved.status===201)created.push(saved.body);
   check('Task occupancy/client queries use selected owner',aux(fixtures.sellers.other.id).some(r=>r.path.startsWith('/tasks/seller/'))&&aux(fixtures.sellers.other.id).some(r=>r.path.startsWith('/clients?')),{requests:aux(fixtures.sellers.other.id)});
   q.step('activity owner and auxiliary context');await q.goto('/actividades/nueva');await page.getByRole('button',{name:'Registrar actividad',exact:true}).click({noWaitAfter:true});await page.locator('#activity-summary').fill(`${unique} ${role} activity summary`);
   const m=payloads.length;await page.getByRole('button',{name:/^Registrar ·/}).click({noWaitAfter:true});await page.locator('#sellerId-error').waitFor();check('Activity missing owner: own error and zero POST',payloads.length===m&&/activo/.test(await page.locator('#sellerId-error').innerText()),{posts:payloads.length-m,focus:await q.focus()});
   await page.locator('#activity-seller').click({noWaitAfter:true});check('Activity choices contain only active sellers',await page.getByRole('option',{name:fixtures.sellers.other.name,exact:true}).count()===1&&await page.getByRole('option',{name:fixtures.sellers.inactive.name,exact:true}).count()===0,{});await page.getByRole('option',{name:fixtures.sellers.other.name,exact:true}).click({noWaitAfter:true});await client('clientId',fixtures.clients.foreign.name);
   await select('activity-task',otherTask.title);await select('activity-opportunity',/^QA-BUGFIX foreign/);await page.getByRole('button',{name:'Coach IA',exact:true}).click({noWaitAfter:true});const advice=await post('/coaching/suggestion',page.getByRole('button',{name:'Obtener sugerencias',exact:true}));check('Activity coaching selected owner and client, local fallback',advice.status===201&&advice.payload.sellerId===fixtures.sellers.other.id&&advice.payload.clientId===fixtures.clients.foreign.id&&advice.body.source==='fallback',{status:advice.status,payload:advice.payload,source:advice.body.source});
   check('Activity pipeline, client deals and tasks share owner',state.requests.some(r=>r.status===200&&r.path===`/pipeline/seller/${fixtures.sellers.other.id}`)&&state.requests.some(r=>r.status===200&&r.path===`/pipeline/client/${fixtures.clients.foreign.id}/seller/${fixtures.sellers.other.id}/deals`),{requests:aux(fixtures.sellers.other.id)});
   await select('activity-seller',fixtures.sellers.seller.name);check('Activity owner change clears linked context',await page.locator('#clientId').innerText()==='Sin cliente'&&await page.locator('#activity-task').innerText()==='Sin tarea vinculada'&&await page.locator('#activity-opportunity').count()===0&&/primero/.test(await page.locator('#activity-contact').innerText()),{client:await page.locator('#clientId').innerText(),task:await page.locator('#activity-task').innerText(),opportunityCount:await page.locator('#activity-opportunity').count(),contact:await page.locator('#activity-contact').innerText()});
   await client('clientId',fixtures.clients.visible.name);await q.shot('activity-selected');const activity=await post('/activities',page.getByRole('button',{name:/^Registrar ·/}));check('Activity saved for new selected owner without stale task/opportunity',activity.status===201&&activity.body.sellerId===fixtures.sellers.seller.id&&activity.body.clientId===fixtures.clients.visible.id&&!activity.payload.taskId&&!activity.payload.opportunityName&&activity.body.points===1,{status:activity.status,payload:activity.payload,points:activity.body.points});
  }
  if(segment==='completion'){
   const task=role==='seller'?ownTask:otherTask;const owner=role==='seller'?fixtures.sellers.seller:fixtures.sellers.other;const expectedClient=role==='seller'?fixtures.clients.visible:fixtures.clients.foreign;
   q.step(`${role} completion context`);await q.goto(role==='seller'?'/mi-dia':'/agenda');
   if(role==='seller'){await page.getByRole('button',{name:`Completar: ${task.title}`,exact:true}).click({noWaitAfter:true});}
   else{await selectByLabel();const row=page.locator('div.flex.items-start.justify-between').filter({has:page.getByText(task.title,{exact:true})});await row.getByRole('button',{name:'Completar',exact:true}).click({noWaitAfter:true});}
   await page.getByRole('button',{name:'Sí, completar',exact:true}).click({noWaitAfter:true});await page.waitForURL(u=>u.pathname==='/actividades/nueva');await page.locator('#activity-summary').waitFor();const search=new URL(page.url()).searchParams;
   check('Completion URL preserves owner, client and task',search.get('sellerId')===owner.id&&search.get('clientId')===expectedClient.id&&search.get('taskId')===task.id,{sellerId:search.get('sellerId'),clientId:search.get('clientId'),taskId:search.get('taskId')});
   if(role!=='seller')check('Linked task owner selector is fixed to task owner',await page.locator('#activity-seller').isDisabled()&&(await page.locator('#activity-seller').innerText()).includes(owner.name),{text:await page.locator('#activity-seller').innerText()});
   await page.locator('#activity-summary').fill(`${unique} ${role} completion activity`);await q.shot('linked-task-context');const saved=await post('/activities',page.getByRole('button',{name:/^Registrar ·/}));check('Completion activity gives points to task owner with client/task context',saved.status===201&&saved.body.sellerId===owner.id&&saved.body.clientId===expectedClient.id&&saved.body.taskId===task.id&&saved.body.points===1,{status:saved.status,payload:saved.payload,points:saved.body.points});
   async function selectByLabel(){await page.getByRole('combobox',{name:'Filtrar por vendedor',exact:true}).click({noWaitAfter:true});await page.getByRole('option',{name:owner.name,exact:true}).click({noWaitAfter:true});}
  }
  if(segment==='manager-view'){
   q.step('Mi dia no owner');await q.goto('/mi-dia');const before=state.requests.filter(r=>r.path.startsWith('/tasks/seller/')||r.path.startsWith('/dashboard/mi-dia/seller/'));
   check('Mi dia without selection makes zero owner queries',before.length===0,{requests:before});
   q.step('Mi dia selected owner');await page.getByRole('button',{name:new RegExp(fixtures.sellers.other.name)}).click({noWaitAfter:true});await page.getByText(otherTask.title,{exact:true}).waitFor();
   const after=state.requests.filter(r=>r.path.startsWith('/tasks/seller/')||r.path.startsWith('/dashboard/mi-dia/seller/'));
   check('Mi dia selected seller queries use owner and never user id',after.length>=2&&after.every(r=>r.path.includes(fixtures.sellers.other.id)&&!r.path.includes(fixtures.users[role].id)&&r.status===200),{requests:after});
   check('Mi dia manager retains current read-only completion permission',await page.getByRole('button',{name:/^Completar/}).count()===0,{completionButtons:await page.getByRole('button',{name:/^Completar/}).count()});await q.shot('mi-dia-selected');
  }
  check('No source console/page errors or unexpected HTTP',state.errors.length===0&&state.http.length===0,{errors:state.errors,http:state.http});
 }catch(e){check('runner completed',false,{error:e.message});await q.shot('failure').catch(()=>{});require('fs').writeFileSync(`${q.out}/failure.html`,await page.content());}finally{state.payloads=payloads;await q.finish();}
}
(async()=>{let otherTask,ownTask;try{otherTask=await fixtureTask('other','foreign',14,'other context');ownTask=await fixtureTask('seller','visible',7,'own context');if(part==='all'||part==='create')for(const role of roles)await run(role,'create',otherTask,ownTask);if(part==='all'||part==='completion'){await run('admin','completion',otherTask,ownTask);await run('seller','completion',otherTask,ownTask);}if(part==='all'||part==='manager-view')await run('director','manager-view',otherTask,ownTask);}finally{for(const t of created)await request('admin','DELETE',`/tasks/${t.id}`);}process.exitCode=failures?1:0;})().catch(e=>{console.error(e.message);process.exitCode=1;});
