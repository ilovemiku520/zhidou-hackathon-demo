import worker from '../site/src/worker.mjs';
import {initialize,quote,initialState,one,run} from '../site/src/store.mjs';
import {day} from '../site/src/util.mjs';
const topics=['为什么随机事件也会连续发生？','为什么同样的选择会得到不同结果？','怎样分辨相关关系与因果关系？','面对不确定性应该如何做决定？','什么样的合作能让双方受益？','为什么海水有咸味？'];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
export function summarize(logs){const damage=[0,0],healing=[0,0],crits=[0,0];for(const e of logs){damage[e.attacker]+=e.damage;damage[1-e.attacker]+=e.reflection;healing[e.attacker]+=e.heal[0];healing[1-e.attacker]+=e.heal[1];if(e.critical)crits[e.attacker]++;}return{damage,healing,crits};}
export async function createDemo(db){
 await initialize(db);const now=Date.now(),q=await quote(db,now);
 if(!await one(db,"SELECT id FROM users WHERE id='local'")){const s=initialState(q.rate,now);await run(db,'INSERT INTO users(id,name,password,role,state,soft,fish,held,created) VALUES(?,?,?,?,?,?,?,0,?)','local','本地试玩','not-an-account','reviewer',JSON.stringify(s),s.soft,s.fish,now);}
 async function board(){const date=day(Date.now()),id='hot:'+date;await run(db,'INSERT OR IGNORE INTO world(id,value) VALUES(?,?)',id,JSON.stringify({date,available:true,captured_at:Date.now(),source:'示例探索题单 · 非实时知乎热榜',items:topics.map((title,i)=>({id:String(i),title,url:'https://www.zhihu.com/search?type=content&q='+encodeURIComponent(title)}))}));}
 return async(path,p)=>{
  if(!/^\/api\//.test(path)||path.startsWith('/api/account/'))return json({message:'本地试玩无需账户操作。'},400);
  if(path.startsWith('/api/adventures')||path==='/api/battle/start')await board();
  if(path==='/api/battle/review'){
   const u=await one(db,"SELECT state FROM users WHERE id='local'"),g=JSON.parse(u.state).battle;
   if(!g||g.phase!=='complete')return json({message:'完成对局后可查看统计。'},409);
   const {damage,healing,crits}=summarize(g.logs);
   return json({available:true,source:'本地战术统计 · 非 AI 生成',text:`本局共 ${g.logs.length} 次交锋。我方造成 ${damage[0]} 点伤害（含反射），对手造成 ${damage[1]} 点；双方有效治疗分别为 ${healing[0]} / ${healing[1]}。\n\n我方触发 ${crits[0]} 次暴击，对手 ${crits[1]} 次。单局结果不能说明长期暴击概率或阵容强弱。\n\n可结合关键战报比较出牌费用与实际收益。讨论下一次选择时，只使用之前已经公开的信息；本次双方是在揭牌前同时暗选。`,notice:'统计来自本局记录，不改变结算。可复制战报后自行在知乎讨论。'});
  }
  const r=await worker.fetch(new Request('https://local.zhidou.invalid'+path,{method:p===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:'https://local.zhidou.invalid','X-CSRF-Token':'local-demo'},body:p===undefined?undefined:JSON.stringify(p)}),{DB:db});
  return r;
 };
}
