'use strict';
(()=>{
  const h=window.Zhidou,$=id=>document.getElementById(id),fmt=(v,d=2)=>Number(v).toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d});
  const signed=(v,d=2)=>(v>0?'+':v<0?'−':'')+fmt(Math.abs(v),d);
  let packet=null,loading=false,queued=false;
  function metric(id,cents){const el=$(id);el.textContent=signed(cents/100);el.className=cents>0?'pnl-positive':cents<0?'pnl-negative':'pnl-neutral';}
  function render(){
    if(!packet)return;
    for(const [id,key] of [['pnl-total','total_cents'],['pnl-realized','realized_cents'],['pnl-floating','unrealized_cents']])metric(id,packet[key]);
    $('pnl-battle').textContent=signed(packet.battle.net_fish,0);$('pnl-battle').className=packet.battle.net_fish>0?'pnl-positive':packet.battle.net_fish<0?'pnl-negative':'pnl-neutral';
    $('pnl-position').textContent=`持有 ${fmt(packet.fish,0)} 小鱼干 · 均价 ${packet.average_cost===null?'—':fmt(packet.average_cost,4)}`;
    $('pnl-date').textContent='按 '+packet.date+' 报价估值';
    $('pnl-breakdown').innerHTML=`<div><dt>当前持仓市值</dt><dd>${fmt(packet.value_cents/100)} 活力币</dd></div><div><dt>剩余持仓成本（含买入费用）</dt><dd>${fmt(packet.cost_cents/100)} 活力币</dd></div><div><dt>累计交易手续费</dt><dd>${fmt(packet.fees_cents/100)} 活力币</dd></div><div><dt>累计买入 / 卖出笔数</dt><dd>${packet.buy_count} / ${packet.sell_count}</dd></div><div><dt>对战：奖励 − 惩罚 − 卡费</dt><dd>${packet.battle.reward_fish} − ${packet.battle.penalty_fish} − ${packet.battle.spent_fish} 小鱼干</dd></div>`;
    $('pnl-legacy').hidden=!packet.legacy_estimated_inflows;
    $('pnl-sales').replaceChildren(...packet.recent_sales.map(s=>{const row=document.createElement('li'),info=document.createElement('span'),value=document.createElement('b');info.textContent=`卖出 ${s.qty} 小鱼干 · ${window.Beijing.format(s.date).slice(5,16)}`;value.textContent=signed(s.pnl_cents/100)+' 活力币';value.className=s.pnl_cents>0?'pnl-positive':s.pnl_cents<0?'pnl-negative':'pnl-neutral';row.append(info,value);return row;}));
    $('pnl-empty').hidden=packet.recent_sales.length>0;
  }
  async function refresh(){
    if(loading){queued=true;return;}loading=true;
    try{packet=await h.api('/api/performance');render();$('pnl-error').hidden=true;}
    catch{$('pnl-error').hidden=false;}
    finally{loading=false;if(queued){queued=false;refresh();}}
  }
  function market(s){
    const points=s.history.filter(x=>x.rate!==null),rates=points.map(x=>Number(x.rate)),first=rates[0],last=rates.at(-1);
    $('week-change').textContent=signed((last/first-1)*100)+'%';$('week-high').textContent=fmt(Math.max(...rates),4);$('week-low').textContent=fmt(Math.min(...rates),4);
    const neg=s.config.noise.filter(x=>x.basis_points<0).reduce((n,x)=>n+x.weight,0),pos=s.config.noise.filter(x=>x.basis_points>0).reduce((n,x)=>n+x.weight,0);
    $('probability-caption').textContent=`负扰动 ${neg}% · 零扰动 ${100-neg-pos}% · 正扰动 ${pos}%`;
    $('quote-draw').textContent=`今日随机扰动 ${signed((s.quote.epsilon_bps||0)/100)}%`;
    $('probability-list').replaceChildren(...s.config.noise.map(x=>{const item=document.createElement('li'),v=document.createElement('span'),p=document.createElement('b');v.textContent=signed(x.basis_points/100)+'%';p.textContent=x.weight+'% 概率';item.className=x.basis_points>0?'positive':x.basis_points<0?'negative':'neutral';item.append(v,p);return item;}));
    const old=Number(s.quote.previous_rate),mean=Number(s.config.reversion_k)*(Number(s.config.reference_rate)-old),random=old*(s.quote.epsilon_bps||0)/10000;
    $('quote-equation').textContent=old?`${fmt(old,4)} ${signed(mean,4)}（回归） ${signed(random,4)}（随机） = ${fmt(s.quote.rate,4)}`:'首日报价从基准价开始。';
    let downs=0,ups=0;for(let i=1;i<s.history.length;i++){const a=s.history[i-1].rate,b=s.history[i].rate;if(a===null||b===null)continue;if(Number(b)>Number(a))ups++;if(Number(b)<Number(a))downs++;}
    $('week-direction').textContent=`可比日：${ups} 次上涨 · ${downs} 次下跌`;
  }
  function dice(){const a=new Uint32Array(1),limit=4294967200;do{crypto.getRandomValues(a);}while(a[0]>=limit);return a[0]%100;}
  function simulate(){
    const s=h.getState();if(!s)return;const c=s.config,rates=[Number(s.quote.rate)];
    for(let i=0;i<30;i++){let r=dice(),eps=0;for(const n of c.noise){r-=n.weight;if(r<0){eps=n.basis_points/10000;break;}}const old=rates.at(-1);rates.push(old+Number(c.reversion_k)*(Number(c.reference_rate)-old)+old*eps);}
    const min=Math.min(...rates),max=Math.max(...rates),range=Math.max(.01,max-min),x=i=>22+i*556/30,y=v=>172-(v-min)/range*142;
    const path=rates.map((v,i)=>(i?'L':'M')+x(i)+','+y(v)).join(' ');
    $('probability-chart').innerHTML=`<svg viewBox="0 0 600 210" role="img" aria-label="一次独立的30步随机价格试算"><line x1="22" y1="172" x2="578" y2="172" stroke="#39545d"/><path d="${path}" fill="none" stroke="#8ee1cf" stroke-width="3" stroke-linejoin="round"/><circle cx="578" cy="${y(rates.at(-1))}" r="5" fill="#efc284"/><text x="22" y="200">起点 ${fmt(rates[0],2)}</text><text x="578" y="200" text-anchor="end">第30步 ${fmt(rates.at(-1),2)}</text></svg>`;
    const ups=rates.slice(1).filter((v,i)=>v>rates[i]).length,downs=rates.slice(1).filter((v,i)=>v<rates[i]).length;
    $('probability-result').textContent=`本次试算：上涨 ${ups} 次，下跌 ${downs} 次；累计变化 ${signed((rates.at(-1)/rates[0]-1)*100)}%。`;
  }
  $('pnl-open').addEventListener('click',()=>{render();$('pnl-dialog').showModal();refresh();});$('pnl-close').addEventListener('click',()=>$('pnl-dialog').close());
  $('probability-open').addEventListener('click',()=>{const s=h.getState();if(s){market(s);simulate();$('probability-dialog').showModal();}});
  $('probability-close').addEventListener('click',()=>$('probability-dialog').close());$('probability-simulate').addEventListener('click',simulate);
  document.addEventListener('wallet-updated',e=>{market(e.detail);refresh();});if(h.getState())market(h.getState());refresh();
})();
