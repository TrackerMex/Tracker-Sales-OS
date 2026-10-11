const fs=require('fs'),path=require('path'),crypto=require('crypto');const tmp='/tmp/tracker-sales-bugfix-qa',phase=process.argv[2]||'checked';
const result={phase,profiles:[],failed:[],baselineUnchanged:false,protectedUnchanged:false,sourceStable:false};
for(const width of [1440,390])for(const theme of ['light','dark']){
 const folder=`${tmp}/88-${phase}-${width}-${theme}`,d=JSON.parse(fs.readFileSync(`${folder}/result.json`));
 const failed=d.tests.filter(t=>t.actual?.pass===false).map(t=>t.name),passed=d.tests.filter(t=>t.actual?.pass===true).length;
 const views=['route','popup'].map(step=>{const tests=d.tests.filter(t=>t.step===step),pick=part=>tests.find(t=>t.name.includes(part))?.actual;const geometry=pick('contain essential text')?.metrics,fonts=pick('Montserrat Variable loads')?.fonts,aa=pick('contrast meets'),tables=pick('Tables retain reachable')?.tables;return{step,geometry,fonts,aa:{checked:aa?.checked,failures:aa?.failures?.length,unsupported:aa?.unsupported?.length},tables};});
 for(const name of ['lamina-route','report-popup'])if(!fs.existsSync(`${folder}/${name}.png`))failed.push(`MissingPNG:${name}`);
 result.profiles.push({width,theme,folder,passed,failed,views,requests:d.requests,popupRequests:d.popupRequests,errors:d.errors,http:d.http,blocked:d.blocked});result.failed.push(...failed.map(name=>({width,theme,name})));
}
const before=JSON.parse(fs.readFileSync(`${tmp}/88-hashes-before.json`)),after=JSON.parse(fs.readFileSync(`${tmp}/88-hashes-${phase}.json`));const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
result.baselineUnchanged=Object.entries(before.baseline).every(([p,h])=>after.baseline[p]===h&&hash(p)===h);
result.protectedUnchanged=Object.entries(before.protectedSource).every(([p,h])=>after.protectedSource[p]===h&&hash(path.resolve(p))===h);
result.sourceStable=!!after.allowedSource&&Object.entries(after.allowedSource).every(([p,h])=>hash(path.resolve(p))===h);
result.passed=result.profiles.reduce((n,p)=>n+p.passed,0);result.pass=result.failed.length===0&&result.baselineUnchanged&&result.protectedUnchanged&&result.sourceStable;
fs.writeFileSync(`${tmp}/88-${phase}-summary.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({passed:result.passed,failed:result.failed,baselineUnchanged:result.baselineUnchanged,protectedUnchanged:result.protectedUnchanged,sourceStable:result.sourceStable,pass:result.pass}));process.exitCode=result.pass?0:1;
