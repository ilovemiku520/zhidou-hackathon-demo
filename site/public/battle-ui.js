'use strict';
window.BattleUI=(()=>{
  const $=id=>document.getElementById(id), safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>Number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  let current=null,filter='output',pending=false;
  const paths={
    A:'M18 8 42 4 38 28 22 44 12 34ZM12 34 7 39M9 30l12 12M24 28 37 10',
    D:'m25 3 5 15 15 7-15 6-5 16-6-16-15-6 15-7ZM25 12v26M12 25h26',
    B:'m25 4 19 9v13c0 9-11 17-19 22C17 43 6 35 6 26V13ZM16 21l9-6 9 6v12l-9 6-9-6ZM25 15v24M16 21l9 6 9-6',
    C:'M19 4h12M21 4v14L9 36q-4 9 5 10h23q8-1 4-10L29 18V4M15 29h21M21 35h1M29 39h1M28 28h1'
  };
  function icon(role){return `<svg viewBox="0 0 50 50" class="profession-symbol" aria-hidden="true"><path d="${paths[role]}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
  function art(id,cls='',thumb=true){return `<img class="${cls}" src="/art/kanshan-v1/${id}.svg" alt="" decoding="async" draggable="false">`;}
  function phase(g){return g.attacker===0?'攻击':'防御';}
  function timing(c,g){return c.role==='A'||c.role==='D'?g.attacker===0:c.timing==='支援'||c.timing===(g.attacker===0?'己攻支援':'受击支援');}
  function reason(g,pile,i,selected,support){
    if(g.phase!=='selection')return '揭示阶段，稍后继续选牌';
    const c=g.cards[g.hands[pile][i]];
    if(!timing(c,g))return c.timing==='受击支援'?'只能在防御时使用':c.timing==='己攻支援'?'只能在攻击时使用':'本次防御不能使用输出牌';
    if(pile===0&&selected.includes(i)||pile===1&&support===i)return '';
    if(pile===0&&selected.length>=2)return '输出牌已选满，请先取消一张';
    const total=selected.reduce((sum,k)=>sum+g.cards[g.hands[0][k]].fee,0)+(pile===1?c.fee:(support===null?0:g.cards[g.hands[1][support]].fee)+c.fee);
    return total>g.players[0].bank?'局内小鱼干不足，请调整组合':'';
  }
  function states(g,p){
    const a=[];
    if(p.wave)a.push(`下次攻击 +${p.wave}`);
    if(p.focus)a.push(`下次暴击 +${n(p.focus*100)}个百分点`);
    if(p.potion){const v=g.cards.C10.potion;a.push(`蓄存药剂：下次攻击 +${v[0]}、暴击 +${n(v[1]*100)}个百分点`);}
    if(p.guard)a.push(`预置防护：${g.cards[p.guard].name}`);
    if(p.weak)a.push(`攻击削弱 −${p.weak}`);
    return a;
  }
  function team(g,i){
    const p=g.players[i],a=g.roles[p.team[0]],s=g.roles[p.team[1]],buffs=states(g,p);
    const event=g.phase==='reveal'?g.last_event:null,delta=event?event.after[i]-event.before[i]:0;
    return `<section class="combat-team ${i?'enemy':'friendly'}"><div class="combat-team-heading"><span class="team-label">${i?'电脑':'我方'}</span><span class="stance ${g.attacker===i?'offense':'defense'}">${g.attacker===i?'攻击方':'防御方'}</span><button class="team-info" data-team-info="${i}" aria-label="查看${i?'电脑':'我方'}角色属性与状态">属性 ⓘ</button></div><div class="duo-names"><span class="role-emblem role-${p.team[0]}">${art("role-"+p.team[0],"team-portrait")}</span><b>${safe(a.name)}</b><span class="duo-plus">＋</span><span class="role-emblem role-${p.team[1]}">${art("role-"+p.team[1],"team-portrait")}</span><b>${safe(s.name)}</b></div><div class="combat-hp"><progress max="${(p.stats?.hp_cap||g.limits.hp_cap)}" value="${p.hp}" aria-label="${i?'电脑':'我方'}生命"></progress><strong>${n(p.hp)}<small> / ${(p.stats?.hp_cap||g.limits.hp_cap)}</small></strong>${delta?`<span class="hp-delta ${delta<0?'loss':'gain'}">${delta>0?'+':''}${n(delta)}</span>`:''}</div><div class="combat-states">${buffs.length?buffs.map(t=>`<span>${safe(t)}</span>`).join(''):'<span class="no-state">无储备或削弱</span>'}</div></section>`;
  }
  function roleCards(roles){
    const desc={A:'蓄势与击破，稳定推进攻势。',D:'暴击与追击，寻找爆发时机。',B:'预置防护，以格挡与反射应战。',C:'治疗、调配药剂，改变攻守条件。'};
    return Object.entries(roles).filter(([id])=>!'EF'.includes(id)).map(([id,r])=>`<article class="role-card role-${id}"><button class="lobby-art" data-role-art="${id}" aria-label="查看${safe(r.name)}图标与牌库">${art("role-"+id,"lobby-portrait",false)}<span>查看图标与牌库 ↗</span></button><span class="role-kind">${safe(r.kind)}</span><h3>${safe(r.name)}</h3><p>${desc[id]}</p><div class="lobby-role-stats">${r.kind==='输出'?`攻击 ${r.attack} · 暴击 ${n(r.probability*100)}%<br>暴击额外伤害 ＋${n(r.crit_damage)}点`:`基础防御 ${r.defense}<br>与搭档共用生命与小鱼干`}</div></article>`).join('');
  }
  function journal(g){
    return `<aside class="table-journal" aria-label="最近对战记录"><h3>对战记录</h3>${g.logs.slice(-4).reverse().map(e=>`<button class="journal-event" data-journal-event="${g.logs.indexOf(e)}"><small>第 ${e.round} 轮 · ${e.stage===1?'首场':'次场'}交锋</small><b>${e.damage?e.damage+' 伤害':'未造成伤害'}${e.critical?' · 暴击':''}</b><span>对手：${[...e.moves[1].attacks,e.moves[1].support].filter(Boolean).map(id=>safe(g.cards[id].name)).join('、')||'放弃出牌'}</span></button>`).join('')||'<p class="journal-empty">双方揭牌后，这里会留下出牌和伤害记录。</p>'}<p>点击记录查看完整效果。</p><span class="journal-mark" aria-hidden="true">◇</span></aside>`;
  }
  function render(data){
    current=data;const g=data.battle,target=$('battle-content');
    filter=g?.attacker===0?'output':'support';
    document.body.classList.toggle('in-match',!!g&&g.phase!=='complete');
    if(!g){
      target.innerHTML=`<div class="battle-lobby"><section class="panel lobby-start"><div class="eyebrow">盐忆 · 双角色协作</div><h2>你的下一位搭档，<br>会是谁？</h2><p>系统为双方各随机分配一名输出与一名辅助。用有限的手牌，打出彼此的配合。</p><div class="lobby-facts"><span><b>100</b>初始生命</span><span><b>45 秒</b>每次选牌</span><span><b>最多 5 轮</b>各攻防一次</span></div><div class="lobby-wallet">可用 <b data-battle-wallet>${n(data.wallet_fish)}</b> 小鱼干 <span>至少 ${data.entry_min} 可入场</span></div><button id="battle-start" class="primary-button battle-start" ${data.wallet_fish<data.entry_min?'disabled':''}>标准对战 · 电脑练习 →</button><p class="lobby-entry-note">开局暂存 20 保证金＋首轮 12。对局结束返还未花余额，奖惩另行结算。</p><a href="#market" class="text-button">前往鱼干批发补充小鱼干 ↗</a></section><section class="role-grid">${roleCards(data.roles)}</section></div>`;
      return;
    }
    updateHistory(g);
    if(g.phase==='complete'){renderResult(data);return;}
    const attack=g.attacker===0;
    target.innerHTML=`<div class="mode-banner">${safe(g.challenge?.name||"标准对战 · 电脑练习")} · ${g.challenge?"击败敌人才能通关 · 最多6轮":"双方同规则 · 最多5轮"}${g.challenge?.id==='daily-boss'?" · 狂化：第4轮起攻击＋5":""}</div><div class="battle-board" data-phase="${g.phase}">${journal(g)}<header class="combat-toolbar"><div class="round-marker"><b>第 ${g.round} 轮</b><span>交锋 ${g.stage} / 2</span></div><div class="turn-marker"><span class="stance ${attack?'offense':'defense'}">${phase(g)}</span><strong class="battle-phase">${g.phase==='reveal'?'交锋已揭示':attack?'组合你的攻击':'准备本次防御'}</strong></div><div class="combat-timer"><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="timer-track" cx="20" cy="20" r="17"/><circle id="timer-ring" cx="20" cy="20" r="17" pathLength="100"/></svg><b id="battle-clock">—</b><span>${g.phase==='reveal'?'展示倒计时':'选牌倒计时'}</span></div><div class="combat-tools"><button id="battle-gallery" class="text-button">图鉴</button><button id="battle-history" class="text-button">战报 <span>${g.logs.length}</span></button><button id="battle-rules-open" class="text-button">规则</button><button id="surrender-open" class="text-button">认输</button></div></header><div class="combat-teams">${team(g,0)}<div class="combat-versus"><span>${g.phase==='reveal'?'揭示':'暗选'}</span><b>VS</b><small>同时揭牌</small></div>${team(g,1)}</div><section id="selection-stage" class="selection-stage" aria-label="本次选择"><div class="selection-owner"><span>我的组合</span><small>${attack?'2 输出 + 1 辅助':'1 辅助'}</small></div><div id="selected-slots" class="selected-slots"></div><div class="opponent-lock"><span class="card-back">◇</span><div><b>对手已锁定</b><small>提交后同时揭示</small></div></div></section><div id="reveal-banner" class="reveal-banner" ${g.phase==='reveal'?'':'hidden'}></div><section class="hand-zone"><div class="hand-toolbar"><div><b>本轮手牌</b><small id="hand-context">${attack?'点击卡牌加入组合':'只能使用辅助牌，输出牌留待本轮攻击'}</small></div><div class="hand-tabs" role="group" aria-label="切换手牌"><button data-hand-tab="output" class="${filter==='output'?'active':''}" ${attack?'':'hidden'}>输出 <span>${g.hands[0].length}</span></button><button data-hand-tab="support" class="${filter==='support'?'active':''}">辅助 <span>${g.hands[1].length}</span></button></div><span class="deck-count">牌库余 ${g.deck_counts[0].reduce((a,b)=>a+b,0)} 张</span>${!attack?'<button id="held-attacks" class="text-button">查看保留的输出牌</button>':''}</div><div class="hand-groups ${attack?'attack-hand':'defense-hand'}" data-filter="${filter}"><section class="hand-group output-group" ${attack?'':'hidden'}><h3>输出牌 <small>最多 2 张</small></h3><div class="hand-grid">${attack?cards(g,0):""}</div></section><section class="hand-group support-group"><h3>辅助牌 <small>最多 1 张</small></h3><div class="hand-grid">${cards(g,1)}</div></section></div></section><footer class="battle-controls"><div class="budget-display"><small>局内可用</small><strong>${g.players[0].bank}<span> 小鱼干</span></strong><small>钱包 <span data-battle-wallet>${data.wallet_fish}</span> · 保证金 ${g.limits.deposit}</small></div><div class="selection-summary"><strong id="selection-cost"></strong><span id="selection-hint"></span></div><div class="combat-actions"><button id="cards-clear" class="text-button">清空</button><button id="cards-pass" class="secondary-button">放弃出牌</button><button id="cards-submit" class="primary-button" disabled>确认出牌</button><button id="battle-next" class="primary-button" ${g.phase==='reveal'?'':'hidden'}>继续 →</button></div><div id="submission-state" class="submission-state" role="status" hidden></div></footer><div class="board-footnote"><span id="timeout-status">连续超时 ${g.timeouts}/3 · 主动提交会清零</span><span>本轮各攻防一次后弃余牌 · <span class="keyboard-help">1–8 选牌，Enter 提交</span></span></div></div>`;
    if(g.phase==='reveal'){renderReveal(g);document.querySelector('.hand-zone').hidden=true;}
    if(g.phase==='selection'&&g.last_event){const e=g.last_event,ids=[...e.moves[1].attacks,e.moves[1].support].filter(Boolean);const memory=document.createElement('div');memory.className='opponent-memory';memory.innerHTML=`<span>对手上次出牌</span><div>${ids.map(id=>`<button data-card-info="${id}" class="memory-card role-${g.cards[id].role}">${art(id)}<b>${safe(g.cards[id].name)}</b></button>`).join('')||'<small>放弃出牌</small>'}</div><button class="text-button" id="last-event-detail">回看 ↗</button>`;document.querySelector('.selection-stage').prepend(memory);}
    selection(g,[],null,false,false);
  }
  function cards(g,pile){
    return g.hands[pile].map((id,i)=>{const c=g.cards[id];return `<article class="card-shell role-${c.role}"><button class="play-card card-${c.role}" data-pile="${pile}" data-index="${i}" aria-pressed="false" aria-label="${safe(c.name)}，${c.fee}小鱼干，${safe(c.rule)}"><span class="card-top"><span>${safe(g.roles[c.role].name)}</span><b class="card-cost">${c.fee}<small>鱼干</small></b></span><span class="card-art illustration">${art(id,"skill-illustration")}</span><strong>${safe(c.name)}</strong><span class="card-rule">${safe(c.rule)}</span><span class="card-state" aria-live="off"></span><span class="card-check" aria-hidden="true">✓</span></button><button class="card-detail" data-card-info="${id}" aria-label="查看${safe(c.name)}完整效果">详情 ↗</button><span class="card-shortcut" aria-hidden="true">${pile*4+i+1}</span></article>`;}).join('')||'<div class="empty-hand">这类手牌已用完</div>';
  }
  function selection(g,selected,support,working,expired){
    if(!g||g.phase!=='selection')return;
    const fee=selected.reduce((sum,i)=>sum+g.cards[g.hands[0][i]].fee,0)+(support===null?0:g.cards[g.hands[1][support]].fee);
    document.querySelectorAll('.play-card').forEach(b=>{
      const pile=+b.dataset.pile,i=+b.dataset.index,chosen=pile===0?selected.includes(i):support===i;
      const why=reason(g,pile,i,selected,support),blocked=working||expired||!!why;
      b.classList.toggle('chosen',chosen);b.classList.toggle('unavailable',blocked&&!chosen);b.setAttribute('aria-pressed',chosen);b.setAttribute('aria-disabled',blocked);b.dataset.reason=why;
      const c=g.cards[g.hands[pile][i]],hint=c.role==='B'&&g.attacker===0?'预置下次防护':'点击选择';
      b.querySelector('.card-state').textContent=chosen?(hint==='点击选择'?'已加入组合':'已选 · '+hint):why||hint;
    });
    const picks=[...selected.map(i=>[0,i]),...(support===null?[]:[[1,support]])],max=g.attacker===0?3:1;
    $('selected-slots').innerHTML=picks.map(([pile,i])=>{const c=g.cards[g.hands[pile][i]];return `<button class="chosen-slot role-${c.role}" data-remove-pile="${pile}" data-remove-index="${i}" ${working?'disabled':''}><span class="slot-art">${art(g.hands[pile][i],"slot-portrait")}</span><b>${safe(c.name)}</b><small>${c.fee} 鱼干</small><span class="remove-mark">×</span></button>`;}).join('')+Array.from({length:max-picks.length},(_,i)=>`<span class="empty-slot">${picks.length?'＋':'选择卡牌'}</span>`).join('');
    $('selection-cost').textContent=`已选 ${picks.length} 张 · 消耗 ${fee} 小鱼干`;
    $('selection-hint').textContent=working?'正在提交，请稍候':expired?'时间已到，正在等待结算':fee>g.players[0].bank?'局内余额不足，请减少费用':g.attacker===0&&selected.length===0&&support!==null?'仅使用辅助牌，本次不会攻击':`提交后局内剩余 ${g.players[0].bank-fee} 小鱼干`;
    $('cards-submit').disabled=working||expired||fee>g.players[0].bank||!picks.length;
    $('cards-submit').textContent=working?'提交中…':`确认${g.attacker===0?'攻击':'防御'}${picks.length?' · '+fee+' 鱼干':''}`;
    $('cards-pass').disabled=working||expired;$('cards-clear').disabled=working||!picks.length;
  }
  function renderReveal(g){
    const e=g.last_event,own=e.moves[0],foe=e.moves[1],attacked=e.moves[e.attacker].attacks.length>0;
    $('selection-stage').hidden=true;
    const ids=m=>[...m.attacks,m.support].filter(Boolean);
    const moveCards=(m,large)=>ids(m).map(id=>{const c=g.cards[id];return `<button class="revealed-card ${large?'spotlight-card':'response-card'} role-${c.role}" data-card-info="${id}">${art(id,'reveal-art')}<span class="revealed-card-body"><small>${safe(g.roles[c.role].name)} · ${c.fee} 鱼干</small><b>${safe(c.name)}</b><span>${safe(c.rule)}</span></span><span class="reveal-detail-hint">查看详情 ↗</span></button>`;}).join('')||'<div class="pass-label"><b>本次放弃出牌</b><small>没有使用卡牌，也没有消耗卡费</small></div>';
    const hp=i=>`<span>${i?'对手':'我方'}生命 <b>${e.before[i]}</b><i>→</i><strong class="${e.after[i]<e.before[i]?'loss':'gain'}">${e.after[i]}</strong></span>`;
    $('reveal-banner').innerHTML=`<div class="reveal-heading"><div><span class="reveal-eyebrow">第 ${e.round} 轮 · 第 ${e.stage} 次交锋</span><h2 id="reveal-focus" tabindex="-1">${ids(foe).length?'对手打出了这些牌':'对手本次没有出牌'}</h2></div><small id="reveal-reading-hint">查看后继续</small></div><section class="revealed-side foe-play"><header><b>对手 · ${e.attacker===1?'攻击':'防御'}</b><span>${ids(foe).length} 张牌 · 消耗 ${foe.fee} 小鱼干</span></header><div class="revealed-deck spotlight-deck">${moveCards(foe,true)}</div></section><div class="impact-summary"><b>${attacked?(e.critical?'暴击 · ':'')+'造成 '+e.damage+' 伤害':'本次未攻击'}</b><small>${e.attacker===0?'我方':'对手'}发起 · 反射 ${e.reflection} · 治疗 ${e.heal.reduce((a,b)=>a+b,0)}</small><div class="reveal-health">${hp(0)}${hp(1)}</div><button id="last-event-detail" class="text-button">结算明细 ↗</button></div><section class="revealed-side own-play"><header><b>我方响应</b><span>${e.attacker===0?'攻击':'防御'} · 消耗 ${own.fee} 小鱼干</span></header><div class="revealed-deck response-deck">${moveCards(own,false)}</div></section>`;
    for(const id of ['cards-clear','cards-pass','cards-submit'])$(id).hidden=true;
    $('selection-cost').textContent=`本次消耗 ${own.fee} 小鱼干`;
    $('selection-hint').textContent=g.stage===1?'看完后交换攻守，保留本轮未出的手牌':'看完后弃掉余牌，进入新轮或结算';
  }
  function renderResult(data){
    const g=data.battle,r=g.result;
    $('battle-content').innerHTML=`<section class="battle-result result-${r.winner===0?'win':r.winner===1?'loss':'draw'}"><div class="result-banner"><span class="eyebrow">对局结束 · ${safe(r.reason)}</span><h2>${r.winner===null?'势均力敌':r.winner===0?'胜 利':'本场落败'}</h2><div class="final-score"><span>我方 <b>${r.hp[0]}</b></span><i>生命</i><span><b>${r.hp[1]}</b> 电脑</span></div><p>${safe(g.roles[g.players[0].team[0]].name)} ＋ ${safe(g.roles[g.players[0].team[1]].name)} <span>对阵</span> ${safe(g.roles[g.players[1].team[0]].name)} ＋ ${safe(g.roles[g.players[1].team[1]].name)}</p></div><div class="result-body"><div class="net-result"><span>本局小鱼干净变化</span><strong>${r.net>0?'+':''}${r.net}</strong>${g.challenge?`<p>活力币变化 <b>${(r.vitality_net_cents||0)/100}</b> · 挑战保证金${r.winner===0?'已退回':'已扣除'}</p>`:''}<small>胜负奖惩 ${r.prize>0?'+':''}${r.prize} − 出牌消耗 ${r.spent}</small></div><dl class="settlement-lines"><div><dt>未花局内余额退回</dt><dd>${r.bank_returned}</dd></div><div><dt>小鱼干保证金退回</dt><dd>${r.deposit_returned}</dd></div><div><dt>当前钱包可用</dt><dd><span data-battle-wallet>${data.wallet_fish}</span> 小鱼干</dd></div></dl><p class="subtle">返还暂存资金不计为收益。所有收支已计入共用钱包。</p><div class="result-actions"><button id="battle-start" class="primary-button" ${data.wallet_fish<data.entry_min?'disabled':''}>标准对战 · 随机搭档 →</button><button id="battle-history" class="secondary-button">回看 ${g.logs.length} 次交锋</button><a href="#adventures" class="secondary-button">关卡与热榜 Boss</a><a href="#market" class="text-button">返回鱼干批发</a></div><section class="battle-review"><h3>把这一局，变成下一局的经验</h3><div class="result-actions"><button data-copy-report class="secondary-button">复制阵容与关键战报</button><button data-ai-review class="secondary-button">知乎 AI 战术复盘</button></div><p class="subtle">生成复盘仅发送阵容与已公开战报；每天最多2次。由你决定是否分享。</p><pre id="battle-review-text" aria-live="polite"></pre></section><p id="battle-funds-hint" class="subtle">${data.wallet_fish<data.entry_min?`至少 ${data.entry_min} 小鱼干可入场，请先兑换补充。`:''}</p></div></section>`;
  }
  function eventText(g,e){
    const move=m=>[...m.attacks,m.support].filter(Boolean).map(id=>safe(g.cards[id].name)).join('＋')||'放弃出牌';
    return `<article class="history-event"><div><b>第 ${e.round} 轮 · ${e.stage===1?'首场':'次场'}交锋</b><span>${e.attacker===0?'我方':'电脑'}攻击${e.timeout?' · 选牌超时':''}</span></div>${e.resolved_at?`<small>${safe(window.Beijing.format(e.resolved_at))} · 北京时间</small>`:''}<p>我方：${move(e.moves[0])}<br>电脑：${move(e.moves[1])}</p><dl><div><dt>生命变化</dt><dd>我方 ${e.before[0]} → ${e.after[0]} · 电脑 ${e.before[1]} → ${e.after[1]}</dd></div><div><dt>攻击与有效防御</dt><dd>${e.P} / ${e.E}${e.moves[e.attacker].attacks.length?'':'（本次未攻击）'}</dd></div><div><dt>暴击</dt><dd>概率 ${n(e.probability*100)}% · ${e.crit_damage!==undefined?"额外伤害 ＋"+n(e.crit_damage)+"点":"旧局倍率 "+n(e.multiplier)+"×"} · ${e.critical?'本次触发':'本次未触发'}</dd></div><div><dt>伤害 / 反射 / 治疗</dt><dd>${e.damage} / ${e.reflection} / ${e.heal.reduce((a,b)=>a+b,0)}</dd></div><div><dt>双方卡费</dt><dd>我方 ${e.moves[0].fee} · 电脑 ${e.moves[1].fee}</dd></div></dl></article>`;
  }
  function updateHistory(g){if($('combat-dialog').open&&$('combat-dialog').dataset.kind==='history')$('combat-dialog-body').innerHTML=history(g);}
  function history(g){return g.logs.length?g.logs.slice().reverse().map(e=>eventText(g,e)).join(''):'<p class="dialog-empty">第一场交锋尚未揭示。出牌后，双方选择与结算会记在这里。</p>';}
  function show(title,html,kind='info'){$('combat-dialog-title').textContent=title;$('combat-dialog-body').innerHTML=html;$('combat-dialog').dataset.kind=kind;const note=$('combat-dialog').querySelector('.dialog-timer-note');if(note)note.hidden=!current?.battle||current.battle.phase==='complete';if(!$('combat-dialog').open)$('combat-dialog').showModal();$('combat-dialog').scrollTop=0;}
  function info(action,value){
    const g=current?.battle, catalog=window.CardArt;
    if(action==='gallery'){gallery(value||'A');return;}
    if(action==='role'){gallery(value);return;}
    if(action==='card'){
      const c=(g?.cards||catalog.cards)[value];if(!c)return;
      const roles=g?.roles||catalog.roles;
      show(c.name,`<div class="illustrated-card-detail role-${c.role}"><figure>${art(value,'full-illustration',false)}</figure><div><span class="eyebrow">${value} · ${safe(roles[c.role].name)}</span><h3>${safe(c.name)}</h3><p class="detail-fee">${c.fee} 小鱼干 <span>${safe(c.timing)}</span></p><p class="full-card-rule">${safe(c.rule)}</p>${g&&c.role==='B'?`<p class="subtle">${g.attacker===0?'攻击时使用：预置到下一次防御；已有预置防护会被替换。':'防御时使用：与已有预置防护共同结算，受防御加成上限约束。'}</p>`:''}<button class="text-button" data-role-art="${c.role}">查看${safe(roles[c.role].name)}完整牌库 ↗</button></div></div>`,'art-card');return;
    }
    if(!g)return;
    if(action==='history')show('交锋记录',history(g),'history');
    if(action==='event')show('交锋结算',eventText(g,value===undefined?g.last_event:g.logs[+value]));
    if(action==='team'){
      const p=g.players[+value],a=g.roles[p.team[0]],b=g.roles[p.team[1]],ss=states(g,p);
      show(value==='0'?'我方属性与状态':'电脑属性与状态',`<div class="team-detail-portraits"><button data-role-art="${p.team[0]}">${art('role-'+p.team[0],'',false)}<span>${safe(a.name)} ↗</span></button><button data-role-art="${p.team[1]}">${art('role-'+p.team[1],'',false)}<span>${safe(b.name)} ↗</span></button></div><h3>${safe(a.name)} ＋ ${safe(b.name)}</h3><dl class="attribute-list"><div><dt>基础攻击</dt><dd>${p.stats?.attack??a.attack}</dd></div><div><dt>基础防御</dt><dd>${p.stats?.defense??b.defense}</dd></div><div><dt>基础暴击概率</dt><dd>${n(a.probability*100)}%</dd></div><div><dt>基础暴击额外伤害</dt><dd>＋${n(p.stats?.crit_damage??a.crit_damage)}点</dd></div><div><dt>累计有效治疗</dt><dd>${p.healed} / ${p.stats?.heal_cap||30}</dd></div><div><dt>局内余额 / 已花费</dt><dd>${p.bank} / ${p.spent} 小鱼干</dd></div><div><dt>上次攻击</dt><dd>伤害 ${p.last_damage} · ${p.last_crit?'已暴击':'未暴击'}</dd></div></dl><h3>当前储备与削弱</h3><p class="status-description">${ss.length?ss.map(safe).join('<br>'):'无储备或削弱。'}</p><p class="subtle">基础属性不含本次卡牌与临时效果，最终伤害以交锋结算为准。</p>`);
    }
    if(action==='held')show('保留的输出牌',`<p>本次防御不能使用。本轮轮到你攻击时仍可选用；双方各攻防一次后才弃余牌。</p><div class="held-list">${g.hands[0].map(id=>`<article><b>${safe(g.cards[id].name)}</b><span>${g.cards[id].fee} 小鱼干</span><p>${safe(g.cards[id].rule)}</p></article>`).join('')||'<p>本轮输出牌已用完。</p>'}</div>`);
    if(action==='rules')show('本局规则',document.querySelector('.battle-rules').innerHTML.replace(/<summary[\s\S]*?<\/summary>/,''));
  }
  function gallery(role='A'){
    const catalog=window.CardArt,roles=catalog.roles,r=roles[role]||roles.A;
    if(!roles[role])role='A';
    const list=Object.entries(catalog.cards).filter(([id,c])=>c.role===role);
    show('角色与卡牌图鉴',`<nav class="art-role-tabs" aria-label="浏览角色">${['A','D','B','C'].map(id=>`<button data-role-art="${id}" class="role-${id} ${id===role?'active':''}" aria-pressed="${id===role}">${art('role-'+id,'tab-portrait')}<span>${safe(roles[id].name)}<small>${safe(roles[id].kind)} · 10种卡</small></span></button>`).join('')}</nav><div class="art-gallery-role role-${role}"><figure>${art('role-'+role,'gallery-hero',false)}</figure><div><span class="eyebrow">${safe(r.kind)} · 盐忆</span><h3>${safe(r.name)}</h3><p>${safe(catalog.role_descriptions[role]||"暗黑看山的专属挑战牌库。")}</p><p class="subtle">图鉴只供查阅功能与效果。开局仍由系统随机分配一名输出与一名辅助。</p><div class="gallery-stats">${r.kind==='输出'?`基础攻击 ${r.attack} · 暴击概率 ${n(r.probability*100)}% · 暴击额外伤害 ＋${n(r.crit_damage)}点`:`队伍基础防御 ${r.defense}`}</div></div></div><div class="art-gallery-grid">${list.map(([id,c])=>`<button class="gallery-skill role-${role}" data-card-info="${id}" aria-label="查看${safe(c.name)}插画与效果">${art(id,'gallery-card-art')}<span class="gallery-card-label"><small>${id} · ${c.fee} 小鱼干</small><b>${safe(c.name)}</b><span>插画与效果 ↗</span></span></button>`).join('')}</div>`,'gallery');
  }
  function chooseFilter(name){filter=name;const groups=document.querySelector('.hand-groups');if(groups)groups.dataset.filter=name;document.querySelectorAll('[data-hand-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.handTab===name);b.setAttribute('aria-pressed',b.dataset.handTab===name);});}
  function busy(value){
    pending=value;if($('battle-start'))$('battle-start').disabled=value||((current?.wallet_fish||0)<(current?.entry_min||80));
    const status=$('submission-state');if(status){status.hidden=!value;status.textContent=value?'正在同步对局，请稍候…':'';}
    if($('surrender-open'))$('surrender-open').disabled=value;if($('battle-next')&&value)$('battle-next').disabled=true;
  }
  function clock(g,seconds){
    if(!$('battle-clock'))return;
    $('battle-clock').textContent=seconds+'s';const warn=g.phase==='selection'&&seconds<=g.timer.warning_seconds;
    document.querySelector('.combat-timer').classList.toggle('urgent',warn);
    const total=g.phase==='selection'?g.timer.selection_seconds:g.timer.reveal_seconds;
    $('timer-ring').setAttribute('stroke-dasharray',`${Math.max(0,Math.min(100,seconds/total*100))} 100`);
    if(g.phase==='reveal'&&$('battle-next')){
      const min=g.timer.reveal_min_seconds||0,wait=Math.max(0,seconds-(g.timer.reveal_seconds-min));
      $('battle-next').disabled=pending||wait>0||seconds===0;
      $('battle-next').textContent=wait>0?`查看出牌 · ${wait}s`:'看完了，继续 →';
      if($('reveal-reading-hint'))$('reveal-reading-hint').textContent=wait>0?`阅读时间 ${wait}s · 随后可继续`:`${seconds}s 后自动继续 · 可点击卡牌查看详情`;
    }
    const status=$('timeout-status');if(status)status.textContent=seconds===0?'时间已到，等待服务端结算':`连续超时 ${g.timeouts}/3 · 主动提交会清零`;
  }
  function wallet(w){document.querySelectorAll('[data-battle-wallet]').forEach(x=>x.textContent=n(w.fish));if(current)current.wallet_fish=w.fish;if($('battle-start'))$('battle-start').disabled=pending||w.fish<(current?.entry_min||80);if($('battle-funds-hint'))$('battle-funds-hint').textContent=w.fish<(current?.entry_min||80)?`至少 ${current?.entry_min||80} 小鱼干可入场，请先兑换补充。`:'';}
  document.addEventListener('DOMContentLoaded',()=>{$('combat-dialog-close').addEventListener('click',()=>$('combat-dialog').close());$('art-gallery').addEventListener('click',()=>gallery());$('combat-dialog-body').addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.roleArt)info('role',b.dataset.roleArt);else if(b?.dataset.cardInfo)info('card',b.dataset.cardInfo);});});
  return {render,selection,clock,busy,info,reason,chooseFilter,wallet};
})();
