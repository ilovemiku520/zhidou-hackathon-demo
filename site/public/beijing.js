'use strict';
(()=>{
  const dateTime=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const clock=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  window.Beijing={format(value){const d=new Date(typeof value==='number'?value*1000:value);return Number.isNaN(d.valueOf())?'—':dateTime.format(d);}};
  let anchor=Date.now(),elapsed=performance.now();
  document.addEventListener('wallet-updated',e=>{const s=e.detail;const n=Date.parse(s.server_time)-s.day_offset*86400000;if(Number.isFinite(n)){anchor=n;elapsed=performance.now();}render();});
  function render(){const el=document.getElementById('beijing-clock');if(el)el.textContent='北京时间 '+clock.format(new Date(anchor+performance.now()-elapsed));}
  render();setInterval(render,1000);
})();
