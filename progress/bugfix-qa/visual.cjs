// Capture route/popup before or after changes. PNGs stay in /tmp, never in git.
const { setup, tmp } = require('./lib.cjs');
const phase = process.argv[2] || 'baseline';
async function contrast(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const c = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = color => { c.clearRect(0,0,1,1); c.fillStyle = color; c.fillRect(0,0,1,1); return [...c.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v); };
    const over = (front, back) => front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3])).concat(1);
    const bg = el => { const chain=[]; for(let n=el;n;n=n.parentElement) chain.unshift(n); return chain.reduce((b,n)=>over(rgba(getComputedStyle(n).backgroundColor),b),[255,255,255,1]); };
    const lum = color => color.slice(0,3).map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((l,v,i)=>l+v*[0.2126,0.7152,0.0722][i],0);
    const entries = [...document.querySelectorAll('#executive-slide *')].filter(el => [...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()) && el.getBoundingClientRect().width > 0).map(el => {
      const s=getComputedStyle(el), background=bg(el), foreground=over(rgba(s.color),background), a=lum(foreground), b=lum(background), ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05), large=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.666&&parseInt(s.fontWeight)>=700), threshold=large?3:4.5;
      return {text:el.textContent.trim().slice(0,120), color:s.color, background:background.slice(0,3).map(Math.round), font:s.fontFamily, size:s.fontSize, weight:s.fontWeight, ratio:+ratio.toFixed(2), threshold, pass:ratio+0.005>=threshold};
    });
    return { checked: entries.length, failures: entries.filter(e=>!e.pass), entries };
  });
}
(async()=> {
  for (const width of [1440,390]) for (const theme of ['light','dark']) {
    const h=await setup({role:'admin',width,theme,out:`${tmp}/${phase}/visual-${width}-${theme}`});
    try {
      h.step('88 route'); await h.goto('/lamina'); await h.page.waitForSelector('#executive-slide'); await h.page.evaluate(()=>document.fonts.ready);
      h.note('lamina route dimensions',await h.metrics()); h.note('lamina route contrast',await contrast(h.page)); await h.shot('lamina-route');
      h.step('88 popup'); await h.goto('/reportes'); await h.page.waitForSelector('#executive-slide');
      const popupPromise=h.ctx.waitForEvent('page'); await h.page.getByRole('button',{name:'Abrir lámina',exact:true}).click(); const popup=await popupPromise;
      await popup.waitForSelector('#executive-slide'); await popup.waitForTimeout(500); h.note('report popup dimensions',await h.metrics(popup)); h.note('report popup contrast',await contrast(popup)); await h.shot('report-popup',popup); await popup.close();
      if(width===390) {
        h.step('87 mobile sales'); await h.goto('/ventas'); await h.page.waitForTimeout(600); h.note('sales document dimensions',await h.metrics());
        h.note('sales actions bounds',await h.page.getByRole('button',{name:/Acciones de venta/}).evaluateAll(bs=>bs.map(b=>({label:b.getAttribute('aria-label'),x:b.getBoundingClientRect().x,right:b.getBoundingClientRect().right,scrollAncestors:[...function*(e){for(let p=e.parentElement;p;p=p.parentElement)yield p;}(b)].filter(p=>p.scrollWidth>p.clientWidth).map(p=>({tag:p.tagName,width:p.clientWidth,scroll:p.scrollWidth,overflow:getComputedStyle(p).overflowX}))})))); await h.shot('sales-mobile');
      }
    } catch(e) {h.note('capture incomplete',e.message);} finally {await h.finish();}
  }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
