'use strict';
(()=>{
 const $=id=>document.getElementById(id),dialog=$('account-dialog');
 $('account-open').textContent='试玩说明';document.querySelectorAll('[data-developer-open],[data-reviewer-only]').forEach(x=>x.hidden=false);
 $('account-open').addEventListener('click',()=>dialog.showModal());$('account-close').addEventListener('click',()=>dialog.close());
 $('local-reset').addEventListener('click',async()=>{if(!confirm('重置这份客户端的试玩进度？钱包、任务、兑换记录与对局会清空。'))return;const r=await fetch('/api/local/reset',{method:'POST',body:'{}'});if(r.ok){sessionStorage.clear();location.reload();}});
 $('desktop-exit').addEventListener('click',async()=>{if(!confirm('保存进度并退出知斗？'))return;const r=await fetch('/api/shutdown',{method:'POST',body:'{}'});if(r.ok)document.body.innerHTML='<main><h1>已保存并退出</h1><p>可以关闭此页。下次双击“开始试玩”继续。</p></main>';});
 window.Accounts={requireLogin(){window.Zhidou?.toast('本地存档正在准备，请稍后刷新。');}};
})();
