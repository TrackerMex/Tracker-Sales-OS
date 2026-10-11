const { setup, request, fixtures, tmp, api } = require('./lib.cjs');
const fs = require('fs');
const phase = process.argv[2] || 'after';
const part = process.argv[3] || 'all';
(async () => {
  const h = await setup({ role: 'seller', out: `${tmp}/83-${phase}` }); const p = h.page; let failed = 0;
  const check = (name, pass, actual) => { h.note(name, { pass, actual }); if (!pass) failed++; };
  const timeGroup = id => p.locator(`#${id}`).locator('..');
  async function typeTime(id, hh, mm, period = 'AM') {
    await p.locator(`#${id}`).focus();
    for (const key of hh) await p.keyboard.press(key);
    check(`${id} auto-focus minutes`, await timeGroup(id).getByRole('textbox', { name: 'Minutos' }).evaluate(e => e === document.activeElement), hh);
    for (const key of mm) await p.keyboard.press(key);
    check(`${id} auto-focus period`, await timeGroup(id).getByRole('button').evaluate(e => e === document.activeElement), mm);
    const toggle = timeGroup(id).getByRole('button');
    if ((await toggle.innerText()).trim() !== period) await toggle.click({noWaitAfter:true});
  }
  async function matrix(id) {
    for (let hour = 1; hour <= 9; hour++) {
      const hh = String(hour).padStart(2, '0'); await typeTime(id, hh, hour % 2 ? '00' : '59');
      const actual = { hour: await p.locator(`#${id}`).inputValue(), minutes: await timeGroup(id).getByRole('textbox', { name: 'Minutos' }).inputValue() };
      check(`${id} typed ${hh}`, actual.hour === hh && actual.minutes === (hour % 2 ? '00' : '59'), actual);
    }
    for (const [hour, minute, period] of [['08','15','AM'],['08','15','PM'],['12','00','AM'],['12','59','PM']]) { await typeTime(id,hour,minute,period); check(`${id} ${hour}:${minute} ${period}`, await p.locator(`#${id}`).inputValue() === hour && await timeGroup(id).getByRole('textbox',{name:'Minutos'}).inputValue() === minute && (await timeGroup(id).getByRole('button').innerText()).trim() === period); }
    await typeTime(id,'12','59','AM'); await p.keyboard.press('Shift+Tab'); check(`${id} Shift+Tab`,await timeGroup(id).getByRole('textbox',{name:'Minutos'}).evaluate(e=>e===document.activeElement)); await p.locator(`#${id}`).focus(); await p.keyboard.press('ArrowUp'); check(`${id} hour up wraps`,await p.locator(`#${id}`).inputValue()==='01'); await p.keyboard.press('ArrowDown'); check(`${id} hour down wraps`,await p.locator(`#${id}`).inputValue()==='12');
    await p.keyboard.press('ArrowRight'); check(`${id} ArrowRight`,await timeGroup(id).getByRole('textbox',{name:'Minutos'}).evaluate(e=>e===document.activeElement)); await p.keyboard.press('ArrowUp'); check(`${id} minute up wraps`,await timeGroup(id).getByRole('textbox',{name:'Minutos'}).inputValue()==='00'); await p.keyboard.press('ArrowDown'); check(`${id} minute down wraps`,await timeGroup(id).getByRole('textbox',{name:'Minutos'}).inputValue()==='59'); await p.keyboard.press('ArrowLeft'); check(`${id} ArrowLeft`,await p.locator(`#${id}`).evaluate(e=>e===document.activeElement)); await p.keyboard.press('Tab'); check(`${id} Tab`,await timeGroup(id).getByRole('textbox',{name:'Minutos'}).evaluate(e=>e===document.activeElement));
    await p.locator(`#${id}`).focus(); await p.keyboard.press('1'); await timeGroup(id).getByRole('textbox',{name:'Minutos'}).focus(); await p.locator(`#${id}`).focus(); await p.keyboard.press('0'); await p.keyboard.press('8'); check(`${id} partial digit reset on blur/focus`,await p.locator(`#${id}`).inputValue()==='08');
    await p.locator(`#${id}`).focus(); await p.keyboard.press('1'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('0'); await p.keyboard.press('8'); check(`${id} partial digit reset on non-digit`,await p.locator(`#${id}`).inputValue()==='08');
  }
  try {
    if (part === 'all' || part === 'tasks') {
    h.step('create task input matrix'); await h.goto('/agenda'); await p.getByRole('button',{name:'Crear tarea',exact:true}).click({noWaitAfter:true}); await matrix('task-time'); await h.shot('create-matrix'); await p.keyboard.press('Escape');
    h.step('real task conversions');
    for (const [hour,minute,period,expected] of [['08','15','AM',8],['08','15','PM',20],['12','00','AM',0],['12','59','PM',12]]) {
      await p.getByRole('button',{name:'Crear tarea',exact:true}).click({noWaitAfter:true}); await p.fill('#task-objective',`QA-BUGFIX 83 ${hour}:${minute} ${period}`); await typeTime('task-time',hour,minute,period);
      const promise=p.waitForResponse(r=>r.url()===`${api}/tasks`&&r.request().method()==='POST'); await p.getByRole('button',{name:'Guardar tarea',exact:true}).click({noWaitAfter:true}); const response=await promise; const body=await response.json();
      check(`saved task ${hour}:${minute} ${period}`,response.status()===201&&new Date(body.scheduledAt).getUTCHours()===expected&&new Date(body.scheduledAt).getUTCMinutes()===Number(minute),{status:response.status(),scheduledAt:body.scheduledAt});
      await p.getByRole('dialog').waitFor({state:'hidden'});
      const deleted=await request('seller','DELETE',`/tasks/${body.id}`); check('clean conversion task',deleted.status===200);
    }
    }
    if (part === 'all' || part === 'calendar') {
    h.step('calendar click and Enter'); await p.getByRole('tab',{name:'Calendario',exact:true}).click({noWaitAfter:true});
    const chip=()=>p.locator('[draggable=true]',{hasText:fixtures.clients.visible.name}).filter({hasText:'10:15'}).first(); await chip().waitFor(); await chip().click({noWaitAfter:true});
    check('chip click opens only Editar',(await h.dialogs()).length===1&&(await h.dialogs())[0].title==='Editar tarea',await h.dialogs());
    await matrix('edit-task-time'); await typeTime('edit-task-time','08','15','PM');
    const update=p.waitForResponse(r=>r.url()===`${api}/tasks/${fixtures.tasks.calendar.id}`&&r.request().method()==='PATCH'); await p.getByRole('button',{name:'Actualizar tarea',exact:true}).click({noWaitAfter:true}); const updated=await update; const body=await updated.json();
    check('edited task stores20:15',updated.status()===200&&new Date(body.scheduledAt).getUTCHours()===20&&new Date(body.scheduledAt).getUTCMinutes()===15,{status:updated.status(),scheduledAt:body.scheduledAt}); await p.getByRole('dialog').waitFor({state:'hidden'});
    const editedChip=p.locator('[draggable=true]',{hasText:fixtures.clients.visible.name}).filter({hasText:await p.evaluate(iso=>new Date(iso).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}),body.scheduledAt)}).first(); await editedChip.focus(); await p.keyboard.press('Enter'); check('chip Enter opens only Editar',(await h.dialogs()).length===1&&(await h.dialogs())[0].title==='Editar tarea',await h.dialogs()); await p.keyboard.press('Escape');
    h.step('calendar empty date and drag');
    const targetDay=new Date().getUTCDate()===15?16:15;
    const cell=p.locator('div[class*="min-h-[90px]"]').filter({has:p.locator('div').filter({hasText:new RegExp(`^${targetDay}$`)})}).first(); await cell.scrollIntoViewIfNeeded();const cellBounds=await cell.boundingBox();await p.mouse.click(cellBounds.x+30,cellBounds.y+60);
    check('empty cell opens only Crear',(await h.dialogs()).length===1&&(await h.dialogs())[0].title==='Crear tarea con objetivo',await h.dialogs());
    const dateShown=await p.locator('#task-date').innerText(); check('empty cell date correct',dateShown.trim() === `${String(targetDay).padStart(2,'0')}/${String(new Date().getUTCMonth()+1).padStart(2,'0')}/${new Date().getUTCFullYear()}`,dateShown); await p.keyboard.press('Escape');
    const drag=p.waitForResponse(r=>r.url()===`${api}/tasks/${fixtures.tasks.calendar.id}`&&r.request().method()==='PATCH');
    await editedChip.dragTo(cell,{noWaitAfter:true}); const moved=await drag; const movedBody=await moved.json(); check('drag reschedules retaining time',moved.status()===200&&new Date(movedBody.scheduledAt).getUTCDate()===targetDay&&new Date(movedBody.scheduledAt).getUTCHours()===20,{status:moved.status(),scheduledAt:movedBody.scheduledAt});
    const original=await request('seller','PATCH',`/tasks/${fixtures.tasks.calendar.id}`,{scheduledAt:fixtures.tasks.calendar.scheduledAt}); check('restore calendar fixture',original.status===200);
    h.step('calendar navigation');
    for(const [label,prev,next] of [['Mes','Mes anterior','Mes siguiente'],['Semana','Semana anterior','Semana siguiente'],['Día','Día anterior','Día siguiente']]) {
      await p.getByRole('tab',{name:label,exact:true}).click({noWaitAfter:true}); const previous=p.getByRole('button',{name:prev,exact:true}); const nav=previous.locator('..'); const initial=await nav.innerText(); await previous.click({noWaitAfter:true}); await p.waitForTimeout(350); const before=await nav.innerText(); await p.getByRole('button',{name:next,exact:true}).click({noWaitAfter:true}); await p.waitForTimeout(350); const restored=await nav.innerText(); check(`calendar ${label} navigation`,initial!==before&&initial===restored,{initial,before,restored});
    }
    await h.shot('calendar-navigation');
    }
    if (part === 'all' || part === 'activity') {
    h.step('activity time matrix and saved conversion'); await h.goto('/actividades/nueva'); await p.getByRole('button',{name:'Registrar actividad',exact:true}).click({noWaitAfter:true}); await matrix('activity-exec-time');
    await typeTime('activity-capture-time','08','15','AM'); check('capture08:15AM display',await p.locator('#activity-capture-time').inputValue()==='08'); await typeTime('activity-capture-time','08','15','PM');
    await p.click('#activity-type',{noWaitAfter:true}); await p.getByRole('option',{name:/^Llamada ·/}).click({noWaitAfter:true}); check('next hour starts empty',await p.locator('#activity-next-time').inputValue()===''); await typeTime('activity-next-time','08','15','AM'); check('next08:15AM display',await p.locator('#activity-next-time').inputValue()==='08'); await typeTime('activity-next-time','08','15','PM');
    await p.fill('#activity-next-step','QA-BUGFIX Send reviewed proposal'); await p.click('#activity-next-date',{noWaitAfter:true}); await p.locator('[data-slot="popover-content"]').getByRole('button').filter({hasText:new RegExp(`^${new Date().getUTCDate()}$`)}).first().click({noWaitAfter:true});
    await p.click('#clientId',{noWaitAfter:true}); await p.locator('[cmdk-input]').fill(fixtures.clients.visible.name); await p.locator('[cmdk-item]',{hasText:fixtures.clients.visible.name}).first().click({noWaitAfter:true});
    await p.fill('#activity-summary','QA-BUGFIX 83 activity time conversion confirms captured meeting context'); await typeTime('activity-exec-time','08','15','PM');
    const create=p.waitForResponse(r=>r.url()===`${api}/activities`&&r.request().method()==='POST'); await p.locator('form button[type=submit]').click({noWaitAfter:true}); const created=await create; const activity=await created.json();
    check('capture stores20:15',new Date(activity.programmedAt).getUTCHours()===20&&new Date(activity.programmedAt).getUTCMinutes()===15,activity.programmedAt); check('nextTime stores20:15 from empty',activity.nextTime==='20:15',activity.nextTime);
    check('activity stores20:15',created.status()===201&&new Date(activity.executedAt).getUTCHours()===20&&new Date(activity.executedAt).getUTCMinutes()===15,{status:created.status(),executedAt:activity.executedAt}); await h.shot('activity-saved');
    }
  } catch(e) { check('suite completed',false,e.message); await h.shot('failure'); h.note('failure visible main',await p.locator('main').innerText()); }
  finally { h.note('suite failures',failed); await h.finish(); }
  fs.writeFileSync(`${tmp}/83-${phase}/summary.json`,JSON.stringify({failed,complete:failed===0,results:`${tmp}/83-${phase}/result.json`},null,2));
  process.exitCode=failed?1:0;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
