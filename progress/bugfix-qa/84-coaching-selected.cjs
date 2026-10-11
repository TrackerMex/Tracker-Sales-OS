const fs=require('fs');const assert=require('assert/strict');const crypto=require('crypto');const {request,fixtures,tmp}=require('./lib.cjs');
const {Client}=require('/home/claude/sites/Tracker-Sales-OS/backend/node_modules/pg');
const env=Object.fromEntries(fs.readFileSync(`${tmp}/qa.env`,'utf8').trim().split('\n').map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));assert.equal(env.POSTGRES_PORT,'5434');assert.equal(env.POSTGRES_DB,'tracker_sales_bugfix_qa');
const db=new Client({host:env.POSTGRES_HOST,port:+env.POSTGRES_PORT,user:env.POSTGRES_USER,password:env.POSTGRES_PASSWORD,database:env.POSTGRES_DB});
const out=`${tmp}/84-coaching-selected`;fs.mkdirSync(out,{recursive:true});const tests=[];
(async()=>{await db.connect();try{for(const role of ['admin','director']){
 const owner=fixtures.sellers.other.id;const marker=`QA-BUGFIX84 ${role} selected ${crypto.randomUUID()}`;
 const quality=(await db.query('SELECT round(avg(quality))::int AS quality FROM activities WHERE seller_id=$1 AND executed_at>=NOW()-INTERVAL \'30 days\' AND deleted_at IS NULL',[owner])).rows[0].quality;
 const recent=(await db.query('SELECT summary FROM activities WHERE seller_id=$1 AND client_id=$2 AND deleted_at IS NULL ORDER BY executed_at DESC LIMIT 3',[owner,fixtures.clients.foreign.id])).rows.map(r=>r.summary.slice(0,80));
 const r=await request(role,'POST','/coaching/suggestion',{sellerId:owner,clientId:fixtures.clients.foreign.id,type:'Chat',objective:marker});
 const contexts=fs.readFileSync(`${tmp}/llm-context.jsonl`,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);const context=contexts.find(c=>c.messages.some(m=>m.role==='user'&&m.content.includes(marker)));const text=context?.messages.find(m=>m.role==='user')?.content||'';const actualQuality=Number(text.match(/Calidad promedio[^\n]*:\s*(\d+)%/)?.[1]);const historyMatches=recent.length>0&&recent.every(s=>text.includes(s));
 const test={role,pass:r.status===201&&r.body.source==='fallback'&&actualQuality===quality&&historyMatches,status:r.status,source:r.body.source,expectedQuality:quality,actualQuality,historyCount:recent.length,historyMatches};tests.push(test);console.log(JSON.stringify(test));
}}finally{await db.end();fs.writeFileSync(`${out}/result.json`,JSON.stringify({tests,failures:tests.filter(t=>!t.pass).length},null,2));}process.exitCode=tests.some(t=>!t.pass)?1:0;})().catch(e=>{console.error(e.message);process.exitCode=1;});
