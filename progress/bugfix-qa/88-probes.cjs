async function geometry(page){return page.evaluate(()=>{
 const root=document.querySelector('#executive-slide'),r=root.getBoundingClientRect(),clipped=[],scrollable=[],ancestorClipped=[];
 const isScroll=(p,axis)=>['auto','scroll'].includes(getComputedStyle(p)[`overflow${axis}`])&&(axis==='X'?p.scrollWidth>p.clientWidth:p.scrollHeight>p.clientHeight);
 for(const el of root.querySelectorAll('*'))for(const n of el.childNodes){
  if(n.nodeType!==3||!n.textContent.trim())continue;
  const range=document.createRange();range.selectNode(n);const b=range.getBoundingClientRect();if(!b.width||!b.height)continue;
  const chain=[];for(let p=el;p;p=p.parentElement)chain.push(p);
  const item={text:n.textContent.trim().slice(0,90),x:b.x,right:b.right,y:b.y,bottom:b.bottom};
  if(b.x<r.x-1||b.right>r.right+1){if(chain.some(p=>isScroll(p,'X')))scrollable.push(item);else clipped.push(item);}
  for(let i=0;i<chain.length;i++){const p=chain[i],s=getComputedStyle(p),pr=p.getBoundingClientRect();
   for(const axis of ['X','Y']){if(!['hidden','clip'].includes(s[`overflow${axis}`]))continue;
    const local=chain.slice(0,i).find(child=>isScroll(child,axis));const bounded=local?local.getBoundingClientRect():b;
    const min=axis==='X'?pr.x+p.clientLeft:pr.y+p.clientTop,max=min+(axis==='X'?p.clientWidth:p.clientHeight);
    const start=axis==='X'?bounded.x:bounded.y,end=axis==='X'?bounded.right:bounded.bottom;
    if(start<min-2||end>max+2)ancestorClipped.push({...item,axis,ancestor:{tag:p.tagName,id:p.id,class:p.className,overflow:s[`overflow${axis}`],min,max},bounded:{start,end},localScroll:!!local});
   }
  }
 }
 const textElements=[...document.querySelectorAll('#executive-slide *,p')].filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&el.getBoundingClientRect().width>0);
 const unsupported=textElements.filter(el=>{for(let p=el;p;p=p.parentElement)if(+getComputedStyle(p).opacity!==1||getComputedStyle(p).backgroundImage!=='none')return true;return false;}).map(el=>el.textContent.trim().slice(0,90));
 const captions=textElements.filter(el=>!root.contains(el)).map(el=>{const b=el.getBoundingClientRect();return{text:el.innerText,x:b.x,right:b.right,width:b.width,pass:b.x>=-1&&b.right<=innerWidth+1};});
 return{viewport:innerWidth,document:document.documentElement.scrollWidth,slide:{x:r.x,right:r.right,width:r.width,clientWidth:root.clientWidth,scrollWidth:root.scrollWidth},clipped,ancestorClipped,scrollable,unsupported,captions};
});}
async function tableReachability(page,root,metrics){
 const tables=[];for(const [index,table]of (await root.locator('table').all()).entries()){
  const m=await table.evaluate(t=>{const r=t.getBoundingClientRect();let p=t.parentElement;while(p&&p.id!=='executive-slide'&&!['auto','scroll'].includes(getComputedStyle(p).overflowX))p=p.parentElement;return{width:r.width,scrollWidth:t.scrollWidth,headers:[...t.querySelectorAll('th')].map(th=>th.textContent.trim()),wrapper:p&&p.id!=='executive-slide'?{width:p.clientWidth,scrollWidth:p.scrollWidth,overflow:getComputedStyle(p).overflowX,tabIndex:p.tabIndex}:null};});
  if(m.wrapper&&m.wrapper.scrollWidth>m.wrapper.width){
   const id=`qa88-scroll-table-${index}`;await table.evaluate((t,id)=>{let p=t.parentElement;while(p&&!['auto','scroll'].includes(getComputedStyle(p).overflowX))p=p.parentElement;p.dataset.qa88Scroll=id;p.scrollLeft=0;},id);
   const target=page.locator(`[data-qa88-scroll="${id}"]`);await target.scrollIntoViewIfNeeded();
   // Begin from the preceding actual tab stop, then require a real Tab into this wrapper.
   const preceding=await table.evaluate(t=>{let p=t.parentElement;while(p&&!['auto','scroll'].includes(getComputedStyle(p).overflowX))p=p.parentElement;const controls=[...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(e=>e!==p&&e.tabIndex>=0&&!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');const previous=controls.filter(e=>!!(e.compareDocumentPosition(p)&Node.DOCUMENT_POSITION_FOLLOWING)).at(-1);if(previous){previous.focus();return{tag:previous.tagName,id:previous.id};}document.activeElement?.blur();return null;});
   let tabs=0,focused=false;for(;tabs<12&&!focused;tabs++){await page.keyboard.press('Tab');focused=await target.evaluate(p=>p===document.activeElement);}
   const keyboard={tabIndex:m.wrapper.tabIndex,preceding,tabs,focused,before:await target.evaluate(p=>p.scrollLeft)};
   await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);keyboard.after=await target.evaluate(p=>p.scrollLeft);
   m.keyboardReachable=m.wrapper.tabIndex>=0&&keyboard.focused&&keyboard.after>keyboard.before;m.keyboard=keyboard;
   await target.evaluate(p=>p.scrollLeft=p.scrollWidth);const last=await table.locator('tr').first().locator('th').last().boundingBox(),wrapper=await target.boundingBox();
   m.lastReachable=!!last&&!!wrapper&&last.x>=Math.max(0,wrapper.x)-1&&last.x+last.width<=Math.min(metrics.viewport,wrapper.x+wrapper.width)+1;
   m.lastColumnBounds=last;m.wrapperBounds=wrapper;
   await target.evaluate(p=>p.scrollLeft=0);
  }else m.lastReachable=m.width<=metrics.slide.clientWidth+1;
  tables.push(m);
 }return tables;
}
module.exports={geometry,tableReachability};
// Controlled static-popup mode. Any Fetch interception (context or page)
// leaves this Chromium document.write popup's font request pending. The source
// is inspected before opening, and every request during this short interval is
// recorded; only local GET assets are accepted. No application scripts/API are
// written into this popup. The main page is already network-idle.
async function popupFontRouting(q){
 const styles=await q.page.evaluate(()=>[...document.querySelectorAll('link[rel="stylesheet"],style')].flatMap(el=>el.tagName==='LINK'?[el.href]:[...el.textContent.matchAll(/url\(\s*['"]?([^)'"]+)/g)].map(m=>m[1])).map(url=>url.startsWith('data:')?{url:'data:',local:true}:{url:new URL(url,document.baseURI).href,local:new URL(url,document.baseURI).origin===location.origin}));
 if(styles.some(s=>!s.local))throw Error('Popup source contains non-local stylesheet/assets');
 q.note('Popup static CSS asset URLs are local before controlled no-routing interval',{pass:true,styles});
 await q.ctx.unroute('**/*');
 q.state.popupRequests=[];q.ctx.on('request',r=>{const u=new URL(r.url());if(!['http:','https:'].includes(u.protocol))return;q.state.popupRequests.push({origin:u.origin,path:u.pathname,method:r.method(),type:r.resourceType(),local:u.origin===q.base,api:u.pathname.startsWith('/api')});});
}
module.exports.popupFontRouting=popupFontRouting;
