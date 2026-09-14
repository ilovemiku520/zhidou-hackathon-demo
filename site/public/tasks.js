'use strict';
(()=>{
  const h=window.Zhidou,$=id=>document.getElementById(id),dialog=$('task-dialog');
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let data=null,loading=false,queued=false,busy=false,expires=0,reading=null,readUntil=0,dialogEpoch=0;
  const labels={signin:'签到',knowledge:'阅读',battle:'对战'};
  function render(){
    if(!data)return;
    $('tasks-date').textContent=data.date+' · 北京时间';
    $('tasks-earned').textContent=data.claimed_cents/100;$('tasks-total').textContent=data.total_cents/100;
    $('tasks-ready').textContent=data.available_cents?`${data.available_cents/100} 活力币待领取`:'暂时没有待领取奖励';
    $('tasks-completed').textContent=`${data.tasks.filter(x=>x.completed).length} / ${data.tasks.length} 项已完成`;
    $('daily-dot').hidden=!data.available_cents;
    $('task-track').innerHTML=data.tasks.map(t=>`<div class="${t.claimed?'collected':t.completed?'ready':''}" title="${escape(t.title)}：${t.claimed?'已领取':t.completed?'待领取':'待完成'}"><b>${t.claimed?'✓':t.completed?'＋':'·'}</b><span>${labels[t.id]}</span></div>`).join('');
    $('task-grid').innerHTML=data.tasks.map((t,i)=>`<article class="task-card ${t.claimed?'collected':t.completed?'ready':''}" data-task="${t.id}" aria-labelledby="task-name-${t.id}"><div class="task-card-top"><span>${String(i+1).padStart(2,'0')} / ${escape(t.kind)}</span><span class="task-state">${t.claimed?'已领取':t.completed?'待领取':'进行中'}</span></div><div class="task-card-main"><div><h3 id="task-name-${t.id}">${escape(t.title)}</h3><p>${escape(t.description)}</p></div><img src="/art/kanshan-v1/role-${t.art}.svg" alt="" loading="lazy"></div><div class="task-progress"><progress max="1" value="${t.progress}" aria-label="${escape(t.title)}进度"></progress><span>${t.progress} / ${t.target}</span></div><div class="task-reward"><span class="task-coin" aria-hidden="true">活</span><strong>＋${t.reward_soft_cents/100}</strong><span>活力币</span></div><button class="task-action" data-task-action="${t.id}" ${busy||t.claimed?'disabled':''}>${t.claimed?'✓ 今日已领取':t.completed?'领取奖励':t.id==='battle'?'去对战 ↗':t.id==='knowledge'?'去阅读 ↗':'去体验 ↗'}</button></article>`).join('');
    countdown();
  }
  async function refresh(){
    if(loading){queued=true;return;}loading=true;
    try{data=await h.api('/api/tasks');expires=Date.now()+data.seconds_remaining*1000;render();}
    catch{$('tasks-status').textContent='任务进度暂未更新，请稍后刷新。';}
    finally{loading=false;if(queued){queued=false;refresh();}}
  }
  async function post(url,payload){
    if(!h.getState()&&!await h.refresh())throw new Error('offline');
    return h.api(url,payload);
  }
  async function claim(task){
    if(busy||!data)return;busy=true;render();$('tasks-status').textContent='';
    try{const r=await post('/api/tasks/claim',{date:data.date,task});$('tasks-status').textContent=r.replayed?'这项奖励已领取，不会重复发放。':`已领取 ${r.reward_soft_cents/100} 活力币，奖励已存入钱包。`;}
    catch(e){$('tasks-status').textContent=e.code?e.message:'领取结果待确认。刷新任务可核对是否到账，再次领取不会重复发放。';}
    finally{busy=false;await h.refresh();await refresh();}
  }
  function open(title,label){
    dialogEpoch++;reading=null;$('task-dialog-title').textContent=title;$('task-dialog-label').textContent=label;
    $('task-dialog-status').textContent='';$('task-dialog-body').replaceChildren();if(!dialog.open)dialog.showModal();
    return dialogEpoch;
  }
  async function listKnowledge(){
    const epoch=open('今天，想知道什么？','知乎知识 · 官方内容');$('task-dialog-body').textContent='正在获取知乎知识…';
    try{
      const d=await h.api('/api/knowledge');if(epoch!==dialogEpoch||!dialog.open)return;
      $('task-dialog-body').innerHTML=`<p class="subtle">选择一篇阅读。打开正文满 ${data.requirements.reading_seconds} 秒并确认已读后，返回任务卡领取奖励。</p><div class="knowledge-list">${d.items.map(x=>`<button data-knowledge="${escape(x.id)}"><strong>${escape(x.title)}</strong><span>${escape(x.description)}</span><b>阅读 →</b></button>`).join('')||'<p>接口暂未提供可读内容。</p>'}</div>`;
    }catch(e){if(epoch!==dialogEpoch)return;$('task-dialog-body').innerHTML='<p>内容暂时无法加载，任务进度不会因此增加。</p><button id="knowledge-retry" class="secondary-button">重新获取</button>';$('task-dialog-status').textContent=e.code?e.message:'网络连接暂不可用，请稍后重试。';}
  }
  async function readKnowledge(id){
    const epoch=open('正在打开正文…','知乎知识 · 官方内容');
    try{
      const r=await post('/api/tasks/reading',{date:data.date,work_id:id});if(epoch!==dialogEpoch||!dialog.open)return;
      reading=r;readUntil=Date.now()+r.seconds_remaining*1000;$('task-dialog-title').textContent=r.title;
      $('task-dialog-body').innerHTML=`<p class="knowledge-source">作者：${escape(r.author)} · ${escape(r.source)} <a href="${escape(r.source_url)}" target="_blank" rel="noopener noreferrer">来源 ↗</a></p><div class="knowledge-body" tabindex="0" role="region" aria-label="知识正文">${escape(r.content)}</div>${r.truncated?'<p class="subtle">长文仅显示前 30,000 字。</p>':''}<div class="knowledge-finish"><p id="reading-wait"></p><button id="reading-finish" class="primary-button" disabled>确认已读</button></div>`;
      countdown();
    }catch(e){if(epoch===dialogEpoch){$('task-dialog-body').innerHTML='<button id="knowledge-retry" class="secondary-button">返回知识列表</button>';$('task-dialog-status').textContent=e.code?e.message:'正文暂时无法读取，请稍后重试。';}}
  }
  async function progress(task,extra={}){
    if(busy||!data)return;busy=true;const epoch=dialogEpoch;
    dialog.querySelectorAll('button:not(#task-dialog-close)').forEach(b=>b.disabled=true);
    try{
      await post('/api/tasks/progress',{date:reading?.date||data.date,task,...extra});
      if(epoch===dialogEpoch){dialog.close();reading=null;location.hash='tasks';$('tasks-status').textContent='任务已完成，点击对应任务卡领取奖励。';}
    }catch(e){if(epoch===dialogEpoch)$('task-dialog-status').textContent=e.code?e.message:'完成结果待确认，请返回任务页刷新进度。';}
    finally{busy=false;await refresh();if(epoch===dialogEpoch){dialog.querySelectorAll('button').forEach(b=>b.disabled=false);countdown();}}
  }
  $('task-grid').addEventListener('click',e=>{const b=e.target.closest('[data-task-action]');if(!b||busy)return;const task=data.tasks.find(x=>x.id===b.dataset.taskAction);if(task.claimed)return;if(task.completed)claim(task.id);else if(task.id==='battle')location.hash='battle';else if(task.id==='knowledge')listKnowledge();});
  $('daily-open').addEventListener('click',()=>{location.hash='tasks';refresh();});
  $('tasks-refresh').addEventListener('click',()=>{$('tasks-status').textContent='';refresh();});
  $('task-dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{dialogEpoch++;reading=null;});
  dialog.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||busy)return;if(b.dataset.knowledge)readKnowledge(b.dataset.knowledge);if(b.id==='knowledge-retry')listKnowledge();if(b.id==='reading-finish')progress('knowledge',{token:reading.token});});
  function countdown(){
    if(data){const n=Math.max(0,Math.ceil((expires-Date.now())/1000));$('tasks-countdown').textContent=`${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n%3600/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')} 后刷新`;if(!n&&!loading)refresh();}
    if(reading&&$('reading-finish')){const n=Math.max(0,Math.ceil((readUntil-Date.now())/1000));$('reading-wait').textContent=n?`阅读计时：还需 ${n} 秒`:'达到阅读时长后，请确认你已阅读正文。';$('reading-finish').disabled=busy||n>0;}
  }
  document.addEventListener('wallet-updated',()=>refresh());
  window.addEventListener('hashchange',()=>{if(location.hash==='#tasks')refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(countdown,1000);refresh();
})();
