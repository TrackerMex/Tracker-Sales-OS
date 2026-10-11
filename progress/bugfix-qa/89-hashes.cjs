const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { tmp } = require('./89-lib.cjs');
const root = path.resolve(__dirname,'../..');
const allowed = new Set([
  'frontend/src/modules/activities/presentation/components/ActivityForm.tsx',
  'frontend/src/shared/components/forms/ClientCombobox.tsx'
]);
const digest = p => crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const read = n => JSON.parse(fs.readFileSync(`${tmp}/${n}`));
const before = read('89-implementer-before.json');
const stable = read('89-implementer-stable.json');
const prior = read('88-hashes-checked.json');
const base = {...prior.allowedSource, ...prior.protectedSource};
const protectedSource = Object.fromEntries(Object.entries(base).filter(([p])=>!allowed.has(p)));
const changedProtected = Object.entries(protectedSource).filter(([p,h])=>digest(p)!==h).map(([p])=>p);
const changedAfterStable = Object.entries(stable.paths).filter(([p,h])=>digest(p)!==h).map(([p])=>p);
const changedAuthorized = [...allowed].filter(p=>digest(p)!==before.paths[p]);
const result = {
  timestampUtc:new Date().toISOString(), base:'47595dc',
  allowedSource:Object.fromEntries([...allowed].map(p=>[p,digest(p)])),
  protectedCount:Object.keys(protectedSource).length,
  changedProtected, changedAfterStable, changedAuthorized,
  pass:changedProtected.length===0&&changedAfterStable.length===0&&changedAuthorized.length===2
};
fs.writeFileSync(`${tmp}/89-hashes-after.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
process.exitCode=result.pass?0:1;
