const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=process.cwd(),tmp='/tmp/tracker-sales-bugfix-qa';
const allowed=['frontend/src/index.css','frontend/src/modules/reports/presentation/components/ExecutiveSlide.tsx','frontend/src/modules/reports/presentation/pages/LaminaPage.tsx','frontend/src/modules/reports/presentation/pages/ReportsPage.tsx'];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const phase=process.argv[2]||'before',manifest=`${tmp}/88-hashes-${phase}.json`;
const baseline=walk(`${tmp}/baseline`).filter(p=>/\/visual-(1440|390)-(light|dark)\/(lamina-route|report-popup)\.png$/.test(p)).sort();
if(baseline.length!==8)throw Error(`Expected8baselinePNGs, got${baseline.length}`);
const source=[...walk(`${root}/backend/src`),...walk(`${root}/frontend/src`)].filter(p=>!allowed.includes(path.relative(root,p))).sort();
const value={createdAt:new Date().toISOString(),allowed,allowedSource:Object.fromEntries(allowed.map(p=>[p,hash(path.join(root,p))])),baseline:Object.fromEntries(baseline.map(p=>[p,hash(p)])),protectedSource:Object.fromEntries(source.map(p=>[path.relative(root,p),hash(p)]))};
fs.writeFileSync(manifest,JSON.stringify(value,null,2));
let mismatch=[];if(phase!=='before'){const before=JSON.parse(fs.readFileSync(`${tmp}/88-hashes-before.json`));for(const group of ['baseline','protectedSource']){for(const[p,h]of Object.entries(before[group]))if(value[group][p]!==h)mismatch.push({group,path:p});for(const p of Object.keys(value[group]))if(!(p in before[group]))mismatch.push({group,path:p,added:true});}fs.writeFileSync(`${tmp}/88-hash-comparison-${phase}.json`,JSON.stringify({pass:mismatch.length===0,mismatch,baselinePNGs:baseline.length,protectedFiles:source.length},null,2));}
console.log(JSON.stringify({manifest,baselinePNGs:baseline.length,protectedFiles:source.length,mismatch}));process.exitCode=mismatch.length?1:0;
