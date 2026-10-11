const fs = require('fs');
const {tmp,fixture,dbOpen}=require('./89-lib.cjs');
(async()=>{const f=fixture(),db=await dbOpen();try{
 const files=fs.readdirSync(tmp).filter(n=>n.startsWith('89-handoff-after-')).map(n=>`${tmp}/${n}/final-post.json`).filter(p=>fs.existsSync(p));
 const ids=files.map(p=>JSON.parse(fs.readFileSync(p)).payload.taskId);
 const rows=(await db.query('SELECT id,title,status,deleted_at FROM tasks WHERE id=ANY($1::uuid[]) ORDER BY id',[ids])).rows;
 const result={timestampUtc:new Date().toISOString(),pass:rows.length===3&&rows.every(r=>r.title.startsWith(f.prefix+' Handoff ')&&r.status==='Completado'&&r.deleted_at),rows};
 fs.writeFileSync(`${tmp}/89-handoff-after-cleanup.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,count:rows.length}));process.exitCode=result.pass?0:1;
}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
