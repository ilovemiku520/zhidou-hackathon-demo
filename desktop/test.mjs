import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {database} from './database.mjs';
import {moves} from '../site/src/combat.mjs';
const {createDemo,summarize}=await import(pathToFileURL(process.env.ZHIDOU_DESKTOP_CORE||(process.platform==='win32'?'D:/知斗测试/知斗demo演示文件/core.mjs':path.resolve('dist/zhidou-demo/core.mjs'))));
assert.deepEqual(summarize([{attacker:1,damage:9,reflection:2,heal:[3,7],critical:true}]),{damage:[2,9],healing:[7,3],crits:[0,1]});
const db=database(':memory:',new URL('../site/drizzle/',import.meta.url)),raw=db.raw;let handle=await createDemo(db);
const call=async(url,p)=>{const r=await handle(url,p);const data=await r.json();assert.equal(r.status,200,JSON.stringify({url,data}));return data;};
const clock=Date.now,net=globalThis.fetch;let now=clock();Date.now=()=>now;globalThis.fetch=async()=>{throw Error('offline fixture');};
try{
 const account=await call('/api/account');assert.equal(account.authenticated,true);assert.equal(account.developer,true);
 assert.equal((await handle('/api/account/register',{name:'second'})).status,400);
 let state=await call('/api/state');assert.equal(state.wallet.fish,100);
 await call('/api/demo/wallet',{fish:10000,expected_fish:100,request_key:crypto.randomUUID()});
 let gift=await call('/api/redeem',{code:'少偶99'});assert.equal(gift.fish,10);assert.equal((await call('/api/redeem',{code:'少偶99'})).replayed,true);
 state=await call('/api/state');const p={side:'buy',qty:2,quote_id:state.quote.id,request_key:crypto.randomUUID()};await call('/api/trade',p);assert.equal((await call('/api/trade',p)).replayed,true);
 const tasks=await call('/api/tasks');await call('/api/tasks/claim',{date:tasks.date,task:'signin'});assert.equal((await call('/api/tasks/claim',{date:tasks.date,task:'signin'})).replayed,true);
 const list=await call('/api/knowledge');assert.ok(list.items.some(x=>x.id==='demo-probability'));
 const reading=await call('/api/tasks/reading',{date:tasks.date,work_id:'demo-probability'});assert.match(reading.source,/本地原创/);now+=21000;await call('/api/tasks/progress',{date:tasks.date,task:'knowledge',token:reading.token});await call('/api/tasks/claim',{date:tasks.date,task:'knowledge'});
 const wealth=await call('/api/wealth');assert.equal(wealth.rows.length,1);
 const board=await call('/api/adventures');assert.match(board.board.source,/示例/);assert.equal(board.hunt.found,false);assert.equal(board.hunt.question,null);
 assert.equal((await handle('/api/battle/start',{mode:'boss',request_key:crypto.randomUUID()})).status,409);
 for(const q of board.board.items){const r=await call('/api/adventures/explore',{date:board.board.date,question_id:q.id});if(r.found_here)break;}
 assert.equal((await call('/api/adventures')).hunt.found,true);
 const before=(await call('/api/state')).wallet;let g=await call('/api/battle/start',{mode:'boss',request_key:crypto.randomUUID()});
 await call('/api/battle/action',{id:g.id,revision:g.revision,action:'surrender',request_key:crypto.randomUUID()});
 assert.equal((await call('/api/state')).wallet.soft_cents,before.soft_cents-2000);
 assert.match((await call('/api/battle/review',{})).source,/非 AI/);
 let games=0;for(;games<20;games++){
  const balance=(await call('/api/state')).wallet.fish;g=await call('/api/battle/start',{request_key:crypto.randomUUID()});
  for(let i=0;g.phase!=='complete'&&i<40;i++){
   let p={id:g.id,revision:g.revision,request_key:crypto.randomUUID()};
   if(g.phase==='reveal'){now+=4000;p.action='advance';}else{const legal=moves(...g.hands,g.attacker===0?'attack':'defense',g.players[0].bank),m=legal.sort((a,b)=>b.fee-a.fee)[0];const hand=[...g.hands[0]],indices=m.attacks.map(c=>{const i=hand.indexOf(c);hand[i]=null;return i;});p={...p,action:'play',attack_indices:indices,support_index:m.support?g.hands[1].indexOf(m.support):null};}
   g=await call('/api/battle/action',p);now+=1000;
  }
  assert.equal(g.phase,'complete');assert.equal((await call('/api/state')).wallet.fish,balance+g.result.net);
 }
 handle=await createDemo(db);assert.equal((await call('/api/redeem',{code:'少偶99'})).replayed,true);
 console.log(JSON.stringify({local_account:'passed',developer_without_password:'passed',trading_and_gift:'passed',offline_reading_and_tasks:'passed',hidden_boss:'passed',complete_matches:games,wallet_accounting:'passed',local_state_reuse:'passed'}));
}finally{Date.now=clock;globalThis.fetch=net;raw.close();}
