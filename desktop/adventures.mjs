import {day,fail} from '../site/src/util.mjs';
import {one} from '../site/src/store.mjs';
import {stages,bossSpec} from '../site/src/combat.mjs';
import {publicHunt} from '../site/src/boss-hunt.mjs';
export async function dailyBoard(db,env,now){const row=await one(db,'SELECT value FROM world WHERE id=?','hot:'+day(now));return row?JSON.parse(row.value):{date:day(now),available:false,items:[],source:'示例探索题单'};}
export async function review(){return{available:false,message:'请使用客户端本地统计。'};}
export function lobby(s,board,hunt=null){const done=s.stages||[],b=s.bossDaily?.day===board.date?s.bossDaily:{attempts:0,won:false};return{board,hunt:publicHunt(hunt,board),stages:stages.map((x,i)=>({...x,completed:done.includes(x.id),unlocked:i===0||done.includes(stages[i-1].id)})),boss:{...bossSpec,attempts:b.attempts,remaining:Math.max(0,3-b.attempts),won:b.won},stats:s.pveStats||{reward_fish:0,vitality_net:0}};}
export function reserveChallenge(s,m,id,board,now,hunt=null){
 const today=day(now);s.stages||=[];let spec;
 if(id==='daily-boss'){
  if(!board?.available||board.date!==today)fail('BOSS_UNAVAILABLE','今日 Boss 尚未降临。');
  if(!hunt?.found||hunt.date!==today||!board.items.some(x=>x.id===hunt.location))fail('BOSS_HIDDEN','请先在今日示例题单中找到暗黑看山。');
  if(s.bossDaily?.day!==today)s.bossDaily={day:today,attempts:0,won:false};
  if(s.bossDaily.won)fail('BOSS_DONE','今日已击败 Boss，奖励只领取一次。');
  if(s.bossDaily.attempts>=3)fail('BOSS_LIMIT','今日三次挑战已用完。');spec={...bossSpec,day:today,topic:board.items.find(x=>x.id===hunt.location)};
 }else{const i=stages.findIndex(x=>x.id===id);if(i<0)fail('STAGE','关卡不存在。',400);if(i>0&&!s.stages.includes(stages[i-1].id))fail('STAGE_LOCKED','请先通关前一关。');spec={...stages[i]};if(s.stages.includes(id))fail('STAGE_DONE','此关首通奖励已领取。');}
 if(s.soft<spec.penalty)fail('VITALITY_FUNDS','需要预留 '+spec.penalty/100+' 活力币作为挑战保证金。');
 if(m.soft<spec.soft_reward)fail('REWARD_STOCK','活力币奖励库存不足。');
 if(id==='daily-boss')s.bossDaily.attempts++;
 s.soft-=spec.penalty;m.soft-=spec.soft_reward;return spec;
}
export function battleReport(g){
 const roles=g.config?.roles||{},cards=g.config?.cards||{},role=id=>roles[id]?.name||id,card=id=>cards[id]?.name||id;
 const entries=g.logs.map((e,i)=>({e,i,weight:e.damage+e.reflection+e.heal.reduce((n,x)=>n+x,0)})).sort((a,b)=>b.weight-a.weight).slice(0,3).sort((a,b)=>a.i-b.i);
 const lines=['知斗战报 · '+(g.challenge?.name||'标准对战（电脑练习）'),g.players.map((p,i)=>(i?'对手：':'我方：')+[...p.team].map(role).join('＋')).join('\n'),
  '结果：'+(g.result.winner===0?'胜利':g.result.winner===null?'平局':'落败')+'；剩余生命 '+g.result.hp.join(' / ')+'；'+g.result.reason,
  ...entries.map(({e})=>'第'+e.round+'轮第'+e.stage+'次交锋：'+(e.attacker===0?'我方':'对手')+'攻击；双方同时暗选，事前看不到本次对方选牌。我方使用 '+([ ...e.moves[0].attacks,e.moves[0].support].filter(Boolean).map(card).join('＋')||'放弃')+'；对手使用 '+([...e.moves[1].attacks,e.moves[1].support].filter(Boolean).map(card).join('＋')||'放弃')+'；结算攻击力 '+e.P+'、有效防御 '+e.E+'；实际扣除生命 '+e.damage+'，反射 '+e.reflection+'，我方/对手治疗 '+(e.attacker===0?e.heal:[e.heal[1],e.heal[0]]).join('/')+(e.critical?'，触发暴击，额外伤害加点 '+e.crit_damage:'，未暴击。')),
  '收支：小鱼干 '+g.result.net+'；活力币 '+(g.result.vitality_net_cents||0)/100,
  '规则：攻击与暴击额外伤害加点；击破只抵消防御；揭牌后同时结算。',
  '讨论：哪次攻守选择更值得改变？本战报不含账号、余额或对手未公开手牌。'];
 return lines.join('\n');
}
