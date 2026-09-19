// 关注初音未来谢谢喵，ilovemiku520
// Please follow Hatsune Miku, thank you, meow. ilovemiku520
// 使用、借鉴或学习本项目（包括 AI 使用、借鉴与学习）之前，均需先收藏（Star）本项目。
// Star this repository before using, referencing, or learning from it, including AI use, reference, and learning.
// Repository: https://github.com/ilovemiku520/zhidou-hackathon-demo
import c from '../game.json' with {type:'json'};
import {clone,roll,shuffle,fail,held,removeCost,grantFish,stamp,day} from './util.mjs';
export {c};
function describeCard(x,p){
 const pieces=[],labels={atk:'攻击＋',br:'击破＋',guard:'防御＋',heal:'恢复生命',crit_damage:'暴击额外伤害＋',dr:'穿防后固定减伤',thorns:'承伤后反伤（不超过实际承伤）',shield:'格挡后盾反（不超过格挡）',resist_break:'抵消击破',retaliation:'成功格挡后，下次攻击储备＋',charge_atk:'下次攻击储备＋',follow_damage:'上次造成伤害时，攻击再＋',follow_crit:'上次暴击时，攻击再＋',charge_bonus:'有攻击储备时，攻击再＋',focus_bonus:'有暴击储备时，攻击再＋',execute_br:'敌方生命≤'+p.stats.execute_hp+'时，击破再＋'};
 for(const[k,label]of Object.entries(labels))if(x[k])pieces.push(label+x[k]+'点');
 for(const[k,label]of Object.entries({prob:'暴击概率＋',anticrit:'压制敌方暴击概率',charge_prob:'下次暴击概率储备＋',execute_prob:'敌方生命≤'+p.stats.execute_hp+'时，暴击概率再＋'}))if(x[k])pieces.push(label+Math.round(x[k]*100)+'个百分点');
 if(x.low)pieces.push('己方生命≤'+p.stats.low_hp+'时攻击＋'+(10+p.boost)+'，否则＋'+(4+p.boost));
 if(x.low_guard)pieces.push('己方生命≤'+p.stats.low_hp+'时防御改为＋'+x.low_guard);
 if(x.weak_next)pieces.push('己攻时施加敌方下次攻击－'+x.weak_next+'；受击时敌方本次攻击－'+x.weak_now);else if(x.weak_now)pieces.push('敌方本次攻击－'+x.weak_now);
 if(x.potion)pieces.push('交锋末储备下一次攻击＋'+x.potion[0]+'、暴击概率＋'+Math.round(x.potion[1]*100)+'个百分点');
 if(x.cleanse)pieces.push('清除已有削弱，免疫新延迟削弱');if(x.ban)pieces.push('本次不能暴击');
 return pieces.join('；')+'。同槽储备不叠加；受到本模式上限约束。';
}
const effective=(id,p)=>{const raw=c.cards[id]||{},x={...raw},n=p?.boost||0;for(const k of ['atk','br','guard','low_guard','heal','weak_now','weak_next','charge_atk','charge_bonus','follow_damage','follow_crit','focus_bonus','execute_br','retaliation','dr','thorns','shield','resist_break','crit_damage'])if(x[k])x[k]+=n;if(x.potion)x.potion=[x.potion[0]+n,x.potion[1]];return x;};
const stats=p=>p.stats||{attack:c.roles[p.team[0]].attack,defense:c.roles[p.team[1]].defense,probability:c.roles[p.team[0]].probability,crit_damage:c.roles[p.team[0]].crit_damage,hp_cap:c.hp_cap,heal_cap:c.heal_cap};
const ceiling=(p,k)=>c[k]+(p.limitBoost??p.boost??0)*3;
export function battleCards(g){return Object.fromEntries(Object.entries(c.cards).map(([id,x])=>{const p=g.players.find(p=>p.team.includes(x.role));const card=effective(id,p);return[id,{...card,rule:p?.boost?describeCard(card,p):card.rule}];}));}
const cards=c.cards, move=(attacks=[],support='')=>({attacks,support,fee:[...attacks,support].filter(Boolean).reduce((n,k)=>n+cards[k].fee,0)});
export function moves(ah,sh,phase,bank){
 let attacks=[[]];if(phase==='attack'){for(let i=0;i<ah.length;i++){attacks.push([ah[i]]);for(let j=i+1;j<ah.length;j++)attacks.push([ah[i],ah[j]].sort());}}
 attacks=[...new Map(attacks.map(a=>[a.join(','),a])).values()];const supp=['',...new Set(sh.filter(s=>['支援',phase==='attack'?'己攻支援':'受击支援'].includes(cards[s].timing)))];
 return attacks.flatMap(a=>supp.map(s=>move(a,s))).filter(m=>m.fee<=bank);
}
const guard=(id,hp,p)=>{const d=effective(id,p);return Object.fromEntries(['guard','dr','thorns','shield','anticrit','resist_break','retaliation'].map(k=>[k,k==='guard'&&hp<=(p?.stats?.low_hp||50)?(d.low_guard??d.guard??0):(d[k]||0)]));};
export function evaluate(a,d,am,dm){
 const role=stats(a),defense=stats(d).defense,asc=effective(am.support,a),dsc=effective(dm.support,d),potion=effective('C10',a).potion,attack=!!am.attacks.length;
 const ah=Math.max(0,Math.min(asc.heal||0,role.hp_cap-a.hp,role.heal_cap-a.healed)),dh=Math.max(0,Math.min(dsc.heal||0,stats(d).hp_cap-d.hp,stats(d).heal_cap-d.healed));
 let bonus=asc.atk||0,prob=role.probability+(asc.prob||0),critBonus=role.crit_damage+(asc.crit_damage||0),br=asc.br||0,ban=false,newwave=0,newfocus=0;
 for(const cid of am.attacks){const x=effective(cid,a);bonus+=(x.atk||0)+(x.low?(a.hp<=(role.low_hp||50)?10+(a.boost||0):4+(a.boost||0)):0)+(a.last_damage>0?x.follow_damage||0:0)+(a.last_crit?x.follow_crit||0:0)+(a.wave?x.charge_bonus||0:0)+(a.focus?x.focus_bonus||0:0);br+=(x.br||0)+(d.hp<=(stats(d).execute_hp||40)?x.execute_br||0:0);prob+=(x.prob||0)+(d.hp<=(stats(d).execute_hp||40)?x.execute_prob||0:0);critBonus+=x.crit_damage||0;ban=ban||x.ban;newwave=Math.max(newwave,x.charge_atk||0);newfocus=Math.max(newfocus,x.charge_prob||0);}
 if(attack){bonus+=a.wave+(a.potion?potion[0]:0);prob+=a.focus+(a.potion?potion[1]:0);}
 const weak=Math.min(ceiling(a,'weak_cap'),(asc.cleanse?0:a.weak)+(dsc.weak_now||0)),P=Math.max(0,role.attack+Math.min(ceiling(a,'attack_cap'),bonus)-weak);
 const g1=guard(d.guard,d.hp,d),g2=guard(['B','F'].includes(d.team[1])?dm.support:'',d.hp,d),guardValue=Math.min(ceiling(d,'guard_cap'),g1.guard+g2.guard),combined=Object.fromEntries(['dr','thorns','shield','anticrit','resist_break','retaliation'].map(k=>[k,Math.max(g1[k],g2[k])]));
 const E=Math.max(0,defense+guardValue-Math.max(0,Math.min(ceiling(a,'break_cap'),br)-combined.resist_break)),anticrit=Math.max(combined.anticrit,dsc.anticrit||0),p=ban?0:Math.max(0,Math.min(c.prob_cap,prob)-anticrit),critDamage=Math.max(0,Math.min(ceiling(a,'crit_damage_cap'),critBonus));
 const ar=[Math.max(newwave,attack?0:a.wave),Math.max(newfocus,attack?0:a.focus),!!asc.potion||(a.potion&&!attack),['B','F'].includes(a.team[1])&&effective(am.support,a).guard?am.support:a.guard,attack||asc.cleanse?0:a.weak];
 const dr=[d.wave,d.focus,d.potion||!!dsc.potion,'',dsc.cleanse?0:d.weak];if(asc.weak_next&&!dsc.cleanse)dr[4]=Math.max(dr[4],asc.weak_next);if(attack&&E>0&&P>0)dr[0]=Math.max(dr[0],combined.retaliation);
 const branches=[false,true].map(critical=>{const raw=attack?P+(critical?critDamage:0):0,damage=attack?Math.min(d.hp+dh,Math.max(0,raw-E-combined.dr)):0,blocked=attack?Math.min(raw,E):0,reflection=Math.min(a.hp+ah,ceiling(d,'reflection_cap'),Math.min(blocked,combined.shield)+Math.min(damage,combined.thorns));return[a.hp+ah-reflection,d.hp+dh-damage,damage,reflection,blocked];});
 return{attack,P,E,p,critDamage,heal:[ah,dh],ar,dr,branches};
}
// The policy sees public history and samples unknown hands; it never reads the opponent's current cards.
export function choose(g,index=1,random=roll){
 const me=g.players[index],foe=g.players[1-index],phase=g.attacker===index?'attack':'defense',other=phase==='attack'?'defense':'attack',unseen=clone(g.initial[1-index]);
 for(const id of g.discards[1-index])for(const pile of unseen){const at=pile.indexOf(id);if(at>=0){pile.splice(at,1);break;}}
 const enemies=[];for(let n=0;n<3;n++){const sampled=unseen.map((pile,j)=>{const copy=[...pile];for(let i=copy.length-1;i>0;i--){const k=Math.floor(random()*(i+1));[copy[i],copy[k]]=[copy[k],copy[i]];}return copy.slice(0,g.hands[1-index][j].length);});const legal=moves(...sampled,other,foe.bank),active=legal.filter(x=>other==='attack'?x.attacks.length:x.support),pool=active.length?active:legal;enemies.push(pool[Math.floor(random()*pool.length)]);}
 let best=move(),score=-Infinity;
 for(const own of moves(...g.hands[index],phase,me.bank)){let v=0;for(const enemy of enemies){const isAtt=phase==='attack',e=isAtt?evaluate(me,foe,own,enemy):evaluate(foe,me,enemy,own);e.branches.forEach((b,j)=>{const hp=isAtt?[b[0],b[1]]:[b[1],b[0]];let gain=(hp[0]-me.hp)-(hp[1]-foe.hp);if(!hp[0]||!hp[1])gain=500*(Number(hp[0]>0)-Number(hp[1]>0));const slots=isAtt?e.ar:e.dr;gain+=.5*slots[0]+8*slots[1]+(slots[2]?2:0);if(slots[3]){const x=effective(slots[3],me);gain+=.45*(x.guard+(x.dr||0));}v+=(j?e.p:1-e.p)*gain/enemies.length;});}v-=.3*own.fee;if(v>score){score=v;best=own;}}
 return best;
}
export function player(team,wallet){return{team,hp:c.hp,healed:0,bank:0,spent:0,wallet:wallet-c.deposit,wave:0,focus:0,potion:false,guard:'',weak:0,last_damage:0,last_crit:false};}
function selection(g,at){g.phase='selection';g.revision++;g.deadline=at+c.turn_timer.selection_seconds*1000;g.computer_move=choose(g);}
export function finish(s,m,winner,reason,rate,at){
 const g=s.battle;if(g.phase==='complete')return;const spent=g.players[0].spent,bank=g.players[0].bank,reward=Math.min(c.reward_cap,c.loss_penalty+g.players.reduce((n,p)=>n+p.spent,0)),prize=g.challenge?(winner===0?g.challenge.reward:0):(winner===null?0:winner===0?reward:-c.loss_penalty),penalty=Math.max(0,-prize);
 if(penalty)removeCost(s,penalty);s.fish+=bank+c.deposit-penalty;g.players[0].bank=0;g.phase='complete';
 if(prize>0)grantFish(s,prize,rate);m.fish+=c.reward_cap-Math.max(0,prize);s.battleStats.reward+=Math.max(0,prize);s.battleStats.penalty+=penalty;
 let vitality=0;if(g.challenge){const q=g.challenge;const success=winner===0;vitality=success?q.soft_reward:-q.penalty;s.soft+=success?q.penalty+q.soft_reward:0;m.soft+=success?0:q.penalty+q.soft_reward;s.pveStats||={reward_fish:0,vitality_net:0};s.pveStats.reward_fish+=Math.max(0,prize);s.pveStats.vitality_net+=vitality;if(success){if(q.id==='daily-boss')s.bossDaily.won=true;else if(!s.stages.includes(q.id))s.stages.push(q.id);}}
 g.result={vitality_net_cents:vitality,winner,reason,spent,bank_returned:bank,deposit_returned:c.deposit-penalty,prize,net:prize-spent,wallet:s.fish,hp:g.players.map(p=>p.hp)};g.revision++;g.deadline=null;g.hands=[[[],[]],[[],[]]];g.decks=[[[],[]],[[],[]]];
 if(['生命归零','双方牌库与手牌耗尽'].includes(reason)&&g.logs.some(e=>!e.timeout&&e.moves[0].fee>0)){if(s.tasks.day!==day(at))s.tasks={day:day(at),done:[],claimed:[],reading:null};if(!s.tasks.done.includes('battle'))s.tasks.done.push('battle');}
}
function beginRound(s,m,at,rate){const g=s.battle;g.players[0].wallet=s.fish;const poor=g.players.map(p=>p.wallet<c.round_funds);if(poor.some(Boolean)){finish(s,m,poor.every(Boolean)?null:Number(poor[0]),'新轮资金不足',rate,at);return;}g.round++;if(g.challenge?.id==='daily-boss'&&g.round===4)g.players[1].stats.attack+=5;g.stage=0;g.hands=[];s.fish-=c.round_funds;g.players.forEach((p,i)=>{p.wallet-=c.round_funds;p.bank+=c.round_funds;g.hands.push(g.decks[i].map(pile=>pile.splice(0,c.draw)));});g.attacker=g.first^Number(g.round%2===0);selection(g,at);}
export function start(s,m,rate,now,options={}){if(s.battle&&s.battle.phase!=='complete')return;if(s.fish<(options.challenge?92:c.entry_min))fail('ENTRY_FUNDS',options.challenge?'挑战需要至少 92 小鱼干。':'入场需要至少 80 小鱼干。');if(m.fish<c.reward_cap)fail('REWARD_STOCK','对战奖励库存不足。');const teams=[0,1].map(()=>['A','D'][Math.floor(roll()*2)]+['B','C'][Math.floor(roll()*2)]),decks=teams.map(t=>[...t].map(r=>shuffle(Array.from({length:10*c.copies},(_,i)=>r+String(Math.floor(i/c.copies)+1).padStart(2,'0')))));let dice=[1,1];while(dice[0]===dice[1])dice=[1+Math.floor(roll()*6),1+Math.floor(roll()*6)];s.battle={id:'B-'+crypto.randomUUID(),revision:0,round:0,stage:0,first:Number(dice[0]<dice[1]),dice,players:[player(teams[0],s.fish),player(teams[1],200)],decks,initial:clone(decks),hands:[],discards:[[],[]],timeouts:0,phase:'selection',deadline:0,logs:[],result:null,initial_wallet:s.fish};s.battle.schema=2;s.battle.mode=options.mode||'standard';s.battle.challenge=options.challenge||null;s.battle.config=c;if(options.challenge)configureChallenge(s.battle,options.challenge);s.fish-=c.deposit;m.fish-=c.reward_cap;beginRound(s,m,now,rate);}
function resolve(s,own,timedOut,at){
 const g=s.battle,att=g.attacker,de=1-att,ms=[own,g.computer_move],a=g.players[att],d=g.players[de],e=evaluate(a,d,ms[att],ms[de]),before=g.players.map(p=>p.hp),crit=e.attack&&roll()<e.p,b=e.branches[Number(crit)];
 removeCost(s,own.fee);s.battleStats.spent+=own.fee;
 for(const[p,mm,h,res]of[[a,ms[att],e.heal[0],e.ar],[d,ms[de],e.heal[1],e.dr]]){p.bank-=mm.fee;p.spent+=mm.fee;p.healed+=h;[p.wave,p.focus,p.potion,p.guard,p.weak]=res;}
 a.hp=b[0];d.hp=b[1];if(e.attack){a.last_damage=b[2];a.last_crit=crit;}
 ms.forEach((mm,i)=>{for(const cid of mm.attacks){g.hands[i][0].splice(g.hands[i][0].indexOf(cid),1);g.discards[i].push(cid);}if(mm.support){g.hands[i][1].splice(g.hands[i][1].indexOf(mm.support),1);g.discards[i].push(mm.support);}});
 g.timeouts=timedOut?g.timeouts+1:0;g.logs.push({round:g.round,stage:g.stage+1,attacker:att,moves:clone(ms),before,after:g.players.map(p=>p.hp),P:e.P,E:e.E,probability:e.p,crit_damage:e.critDamage,heal:e.heal,timeout:timedOut,resolved_at:at/1000,critical:crit,damage:b[2],reflection:b[3],blocked:b[4]});
 if(Math.min(a.hp,d.hp)===0)g.pending_result={winner:g.challenge?(g.players[0].hp>0&&g.players[1].hp===0?0:1):(g.players[0].hp===g.players[1].hp?null:Number(g.players[1].hp>0)),reason:'生命归零'};else if(g.timeouts>=c.turn_timer.consecutive_timeouts_forfeit)g.pending_result={winner:1,reason:'连续超时'};
 g.phase='reveal';g.revision++;g.deadline=at+c.turn_timer.reveal_seconds*1000;
}
function advance(s,m,at,rate){const g=s.battle;if(g.pending_result){const{winner,reason}=g.pending_result;delete g.pending_result;finish(s,m,winner,reason,rate,at);}else if(g.stage===0){g.stage=1;g.attacker=1-g.attacker;selection(g,at);}else{g.hands.forEach((p,i)=>g.discards[i].push(...p.flat()));g.hands=[[[],[]],[[],[]]];if(!g.decks.flat(2).length){const hp=g.players.map(p=>p.hp);finish(s,m,g.challenge?1:(hp[0]===hp[1]?null:Number(hp[1]>hp[0])),'双方牌库与手牌耗尽',rate,at);}else beginRound(s,m,at,rate);}}
export function tick(s,m,rate,now){const g=s.battle;let changed=false;while(g&&g.phase!=='complete'&&now>=g.deadline){const at=g.deadline;changed=true;if(g.phase==='selection')resolve(s,move(),true,at);else advance(s,m,at,rate);}return changed;}
export function action(s,m,p,rate,now){const g=s.battle;if(!g||p.id!==g.id)fail('BATTLE_NOT_FOUND','未找到这场对局。',404);if(g.phase==='complete'||p.revision!==g.revision||now>=g.deadline)fail('STALE_BATTLE','对局已推进，请按最新阶段操作。');if(p.action==='surrender'){if(g.pending_result)fail('BATTLE_ENDING','最后一次交锋已结算，请查看后继续。');finish(s,m,1,'主动认输',rate,now);}else if(p.action==='advance'&&g.phase==='reveal'){if(now<g.deadline-(c.turn_timer.reveal_seconds-c.turn_timer.reveal_min_seconds)*1000)fail('REVEAL_READING','请先查看双方出牌。');advance(s,m,now,rate);}else if(p.action==='play'&&g.phase==='selection'){const ah=g.hands[0][0],sh=g.hands[0][1],ix=p.attack_indices??[],si=p.support_index??null;if(!Array.isArray(ix)||ix.length>c.max_attack_cards||new Set(ix).size!==ix.length||ix.some(x=>!Number.isInteger(x)||x<0||x>=ah.length)||(si!==null&&(!Number.isInteger(si)||si<0||si>=sh.length)))fail('ILLEGAL_CARD','所选卡牌无效。',400);const phase=g.attacker===0?'attack':'defense',own=moves(ah,sh,phase,g.players[0].bank).find(m=>m.support===(si===null?'':sh[si])&&[...m.attacks].sort().join(',')===ix.map(i=>ah[i]).sort().join(','));if(!own)fail('ILLEGAL_CARD','阶段不符或本局小鱼干不足。',400);resolve(s,own,false,now);}else fail('INVALID_ACTION','当前阶段不支持该操作。',400);}
export function publicBattle(s,now){const g=s.battle;if(!g)return null;const players=clone(g.players);players[0].wallet=s.fish;return{schema:g.schema,mode:g.mode,challenge:g.challenge,id:g.id,revision:g.revision,phase:g.phase,round:g.round,stage:g.stage+1,attacker:g.attacker,dice:g.dice,players,hands:clone(g.hands[0]),deck_counts:g.decks.map(p=>p.map(a=>a.length)),opponent_hand_counts:g.hands[1].map(a=>a.length),timeouts:g.timeouts,seconds_remaining:g.deadline?Math.max(0,(g.deadline-now)/1000):0,result:g.result,last_event:g.logs.at(-1)||null,logs:g.logs,roles:c.roles,cards:battleCards(g),limits:Object.fromEntries(['entry_min','deposit','round_funds','hp_cap','reward_cap','loss_penalty'].map(k=>[k,c[k]])),timer:c.turn_timer};}

export const stages=[
 {id:'stage-1',name:'潮口试炼',level:1,hp:180,enemy_hp:160,attack:12,enemy_attack:8,boost:2,enemy_boost:2,reward:12,soft_reward:6000,penalty:1000},
 {id:'stage-2',name:'盐塔试炼',level:2,hp:180,enemy_hp:190,attack:12,enemy_attack:12,boost:3,enemy_boost:3,reward:18,soft_reward:9000,penalty:1500}
];
export const bossSpec={id:'daily-boss',name:'暗黑看山',hp:210,enemy_hp:245,attack:18,enemy_attack:0,boost:4,enemy_boost:0,reward:40,soft_reward:20000,penalty:2000};
function configureChallenge(g,q){
 if(q.id==='daily-boss'){g.players[1]=player('EF',500);g.decks[1]=['E','F'].map(r=>shuffle(Array.from({length:20},(_,i)=>r+String(i%5+1).padStart(2,'0'))));g.initial[1]=clone(g.decks[1]);}
 if(q.id==='daily-boss')g.players[1].limitBoost=4;
 g.decks=g.decks.map(piles=>piles.map(pile=>shuffle([...pile,...shuffle([...pile]).slice(0,4)])));g.initial=clone(g.decks);
 g.players.forEach((p,i)=>{const r=c.roles[p.team[0]],hp=i?q.enemy_hp:q.hp;p.hp=hp;p.boost=i?q.enemy_boost:q.boost;p.stats={attack:r.attack+(i?q.enemy_attack:q.attack),defense:c.roles[p.team[1]].defense+3,probability:r.probability,crit_damage:r.crit_damage+4,hp_cap:hp,heal_cap:50,low_hp:Math.floor(hp/2),execute_hp:Math.floor(hp*.4)};});
}
