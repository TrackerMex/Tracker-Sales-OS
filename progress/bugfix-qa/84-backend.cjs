// Run only after the QA API has been recompiled from feature84 source.
const fs=require('fs');const assert=require('assert/strict');const crypto=require('crypto');
const {request,fixtures,tmp}=require('./lib.cjs');
const {Client}=require('/home/claude/sites/Tracker-Sales-OS/backend/node_modules/pg');
const env=Object.fromEntries(fs.readFileSync(`${tmp}/qa.env`,'utf8').trim().split('\n').map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
assert.equal(env.POSTGRES_HOST,'127.0.0.1');assert.equal(env.POSTGRES_PORT,'5434');assert.equal(env.POSTGRES_DB,'tracker_sales_bugfix_qa');
const db=new Client({host:env.POSTGRES_HOST,port:+env.POSTGRES_PORT,user:env.POSTGRES_USER,password:env.POSTGRES_PASSWORD,database:env.POSTGRES_DB});
const phase=process.argv[2]||'after';const out=`${tmp}/84-backend-${phase}`;fs.mkdirSync(out,{recursive:true});const tests=[];let failures=0;
function check(name,pass,actual){tests.push({name,pass,actual});console.log(`${pass?'PASS':'FAIL'} ${name}${actual?' '+JSON.stringify(actual):''}`);if(!pass)failures++;}
async function counts(){return (await db.query('SELECT (SELECT count(*)::int FROM tasks) AS tasks,(SELECT count(*)::int FROM activities) AS activities,(SELECT count(*)::int FROM deals) AS deals')).rows[0];}
const task=(sellerId,clientId)=>({sellerId,clientId,type:'Chat',title:`QA-BUGFIX84 API ${crypto.randomUUID()}`,scheduledAt:new Date(Date.now()+6*86400000+Math.floor(Math.random()*86400000)).toISOString()});
const activity=(sellerId,clientId,extra={})=>({sellerId,clientId,type:'Chat',result:'Interesado',summary:'QA-BUGFIX84 API owner and client validation regression',executedAt:new Date().toISOString(),...extra});
(async()=>{
 await db.connect();try{
  for(const role of ['admin','director']){
   for(const resource of ['tasks','activities']){
    for(const [sellerName,sellerId]of[['nonexistent',crypto.randomUUID()],['inactive',fixtures.sellers.inactive.id]]){
     const before=await counts();const r=await request(role,'POST',`/${resource}`,resource==='tasks'?task(sellerId,fixtures.clients.visible.id):activity(sellerId,fixtures.clients.visible.id));const after=await counts();check(`${role} ${resource} ${sellerName}400 before writes`,r.status===400&&JSON.stringify(before)===JSON.stringify(after)&&/seller|vendedor|activo|existe/i.test(JSON.stringify(r.body?.message)),{status:r.status,message:r.body?.message,before,after});
    }
    const before=await counts();const r=await request(role,'POST',`/${resource}`,resource==='tasks'?task(fixtures.sellers.other.id,fixtures.clients.visible.id):activity(fixtures.sellers.other.id,fixtures.clients.visible.id));check(`${role} ${resource} mismatched client rejects before writes`,r.status===400&&JSON.stringify(before)===JSON.stringify(await counts()),{status:r.status,message:r.body?.message});
   }
   const createdTask=await request(role,'POST','/tasks',task(fixtures.sellers.other.id,fixtures.clients.foreign.id));check(`${role} selected seller task201`,createdTask.status===201&&createdTask.body.sellerId===fixtures.sellers.other.id,{status:createdTask.status,sellerId:createdTask.body?.sellerId});if(createdTask.status===201)await request(role,'DELETE',`/tasks/${createdTask.body.id}`);
   const createdActivity=await request(role,'POST','/activities',activity(fixtures.sellers.other.id,fixtures.clients.foreign.id));check(`${role} selected seller activity201`,createdActivity.status===201&&createdActivity.body.sellerId===fixtures.sellers.other.id&&createdActivity.body.points===1,{status:createdActivity.status,sellerId:createdActivity.body?.sellerId,points:createdActivity.body?.points});
  }
  for(const resource of ['tasks','activities']){
   const r=await request('seller','POST',`/${resource}`,resource==='tasks'?task(fixtures.sellers.other.id,fixtures.clients.visible.id):activity(fixtures.sellers.other.id,fixtures.clients.visible.id));check(`Seller JWT overrides submitted seller in ${resource}`,r.status===201&&r.body.sellerId===fixtures.sellers.seller.id,{status:r.status,sellerId:r.body?.sellerId});if(resource==='tasks'&&r.status===201)await request('seller','DELETE',`/tasks/${r.body.id}`);
  }
  for(const [name,extra]of[['owner',{sellerId:fixtures.sellers.other.id,clientId:fixtures.clients.foreign.id}],['client',{sellerId:fixtures.sellers.seller.id,clientId:fixtures.clients.foreign.id}]]){
   const before=await counts();const r=await request('admin','POST','/activities',activity(fixtures.sellers.seller.id,fixtures.clients.visible.id,{taskId:fixtures.tasks.activity.id,...extra}));check(`linked task ${name} mismatch rejects before writes`,r.status===400&&JSON.stringify(before)===JSON.stringify(await counts()),{status:r.status,message:r.body?.message});
  }
  if(phase!=='baseline'){
   const marker=`QA-BUGFIX84 JWT coaching ${crypto.randomUUID()}`;
   const expected=(await db.query('SELECT round(avg(quality))::int AS quality FROM activities WHERE seller_id=$1 AND executed_at>=NOW()-INTERVAL \'30 days\' AND deleted_at IS NULL',[fixtures.sellers.seller.id])).rows[0].quality;
   const coaching=await request('seller','POST','/coaching/suggestion',{type:'Chat',sellerId:fixtures.sellers.other.id,clientId:fixtures.clients.visible.id,objective:marker});
   const contexts=fs.existsSync(`${tmp}/llm-context.jsonl`)?fs.readFileSync(`${tmp}/llm-context.jsonl`,'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line)):[];
   const context=contexts.find(c=>c.messages?.some(m=>m.role==='user'&&m.content?.includes(marker)));const text=context?.messages?.find(m=>m.role==='user')?.content||'';const actual=Number(text.match(/Calidad promedio[^\n]*:\s*(\d+)%/)?.[1]);
   check('Seller coaching uses JWT quality despite forged sellerId',coaching.status===201&&coaching.body.source==='fallback'&&actual===expected,{status:coaching.status,source:coaching.body?.source,expectedQuality:expected,observedQuality:actual,contextCaptured:!!context});
   const foreignSummary=`QA-BUGFIX84 PRIVATE OTHER ${crypto.randomUUID().slice(0,8)}`;const probe=await request('other','POST','/activities',activity(fixtures.sellers.other.id,fixtures.clients.foreign.id,{summary:foreignSummary}));assert.equal(probe.status,201);
   const before=await counts();const foreignMarker=`QA-BUGFIX84 foreign context ${crypto.randomUUID()}`;const response=await request('seller','POST','/coaching/suggestion',{type:'Chat',sellerId:fixtures.sellers.other.id,clientId:fixtures.clients.foreign.id,objective:foreignMarker});
   const foreignContexts=fs.readFileSync(`${tmp}/llm-context.jsonl`,'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));const foreignContext=foreignContexts.find(c=>c.messages?.some(m=>m.role==='user'&&m.content?.includes(foreignMarker)));const foreignText=foreignContext?.messages?.find(m=>m.role==='user')?.content||'';const observedQuality=Number(foreignText.match(/Calidad promedio[^\n]*:\s*(\d+)%/)?.[1]);
   const afterContext=await counts();check('Seller coaching foreign client excludes other owner history and uses JWT quality',response.status===201&&response.body.source==='fallback'&&!!foreignContext&&!foreignText.includes(foreignSummary)&&observedQuality===expected&&JSON.stringify(before)===JSON.stringify(afterContext),{before,after:afterContext,status:response.status,source:response.body?.source,expectedQuality:expected,observedQuality,foreignSummaryExcluded:!foreignText.includes(foreignSummary),contextCaptured:!!foreignContext});
  }
  const before=(await db.query('SELECT coalesce(sum(points),0)::int AS points FROM activities WHERE seller_id=$1 AND deleted_at IS NULL',[fixtures.sellers.seller.id])).rows[0].points;
  const r=await request('admin','POST','/activities',activity(fixtures.sellers.seller.id,fixtures.clients.visible.id,{taskId:fixtures.tasks.activity.id}));check('Admin linked task keeps owner/client/task/points',r.status===201&&r.body.sellerId===fixtures.sellers.seller.id&&r.body.clientId===fixtures.clients.visible.id&&r.body.taskId===fixtures.tasks.activity.id&&r.body.points===1,{status:r.status,sellerId:r.body?.sellerId,clientId:r.body?.clientId,taskId:r.body?.taskId,points:r.body?.points});
  const after=(await db.query('SELECT coalesce(sum(points),0)::int AS points FROM activities WHERE seller_id=$1 AND deleted_at IS NULL',[fixtures.sellers.seller.id])).rows[0].points;const adminPoints=(await db.query('SELECT count(*)::int AS count FROM activities WHERE seller_id=$1',[fixtures.users.admin.id])).rows[0].count;check('Points increase task owner and never Admin id',after===before+1&&adminPoints===0,{before,after,adminRecords:adminPoints});
 }catch(e){check('runner completed',false,e.message);}finally{await db.end();fs.writeFileSync(`${out}/result.json`,JSON.stringify({finishedAt:new Date().toISOString(),failures,tests},null,2));}process.exitCode=failures?1:0;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
