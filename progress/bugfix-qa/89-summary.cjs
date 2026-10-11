const fs=require('fs');
const {tmp}=require('./89-lib.cjs');
const groups=[
 ['baseline','89-before-fixed-'],
 ['ui','89-after-'],
 ['backend','89-backend-after'],
 ['rapid','89-rapid-after-'],
 ['handoff','89-handoff-after-'],
 ['shared','89-edit-task-after-fixed-']
];
const results=[];
for(const[group,prefix]of groups){
 for(const folder of fs.readdirSync(tmp).filter(n=>n.startsWith(prefix))){
  const file=`${tmp}/${folder}/result.json`;
  if(!fs.existsSync(file))continue;
  const data=JSON.parse(fs.readFileSync(file));
  const bad=data.tests.filter(t=>!(t.pass??t.actual?.pass));
  results.push({group,folder,file,checks:data.tests.length,passed:data.tests.length-bad.length,failed:bad.length,failedNames:bad.map(t=>t.name),http:data.http?.length??null,errors:data.errors?.length??null,blocked:data.blocked?.length??null});
 }
}
const hashes=JSON.parse(fs.readFileSync(`${tmp}/89-hashes-after.json`));
const result={timestampUtc:new Date().toISOString(),results,afterChecks:results.filter(r=>r.group!=='baseline').reduce((n,r)=>n+r.checks,0),afterFailures:results.filter(r=>r.group!=='baseline').reduce((n,r)=>n+r.failed,0),hashes};
fs.writeFileSync(`${tmp}/89-results-summary.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
process.exitCode=result.afterFailures||!hashes.pass?1:0;
