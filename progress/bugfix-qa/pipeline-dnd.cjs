// Observe the installed Atlaskit adapter's actual drop target data without changing the app.
module.exports=async page=>page.evaluate(async()=>{
 const source=await fetch('/src/modules/pipeline/presentation/components/KanbanColumn.tsx').then(r=>r.text());
 const path=source.match(/from\s+["']([^"']*pragmatic-drag-and-drop[^"']*adapter[^"']*)["']/)?.[1];
 if(!path)throw new Error('Cannot locate the existing Vite drag adapter');
 const{monitorForElements}=await import(path);window.qaMonitorDrops=[];window.qaStopMonitor?.();
 window.qaStopMonitor=monitorForElements({onDrop({source,location}){window.qaMonitorDrops.push({dealId:source.data.dealId,targets:location.current.dropTargets.map(t=>({stage:t.data.stage,rect:{x:t.element.getBoundingClientRect().x,y:t.element.getBoundingClientRect().y,width:t.element.getBoundingClientRect().width,height:t.element.getBoundingClientRect().height}})),pointer:location.current.input});}});
 return path;
});
