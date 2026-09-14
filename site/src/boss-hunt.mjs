import {roll,fail} from './util.mjs';
import {one,run} from './store.mjs';
const huntKey=(uid,date)=>'boss-hunt:'+date+':'+uid;

// The daily question snapshot is shared; the secret location belongs to one account.
export async function personalHunt(db,uid,board,random=roll){
 if(!board.available||!board.items.length)return null;
 const id=huntKey(uid,board.date),old=await one(db,'SELECT value FROM world WHERE id=?',id);
 if(old)return JSON.parse(old.value);
 const hunt={date:board.date,location:board.items[Math.floor(random()*board.items.length)].id,visited:[],found:false};
 await run(db,'INSERT OR IGNORE INTO world(id,value) VALUES(?,?)',id,JSON.stringify(hunt));
 return JSON.parse((await one(db,'SELECT value FROM world WHERE id=?',id)).value);
}
export function publicHunt(hunt,board){
 return{date:board.date,found:!!hunt?.found,visited:hunt?.visited||[],question:hunt?.found?board.items.find(x=>x.id===hunt.location)||null:null};
}
export async function exploreQuestion(db,uid,board,question){
 if(!board.available)fail('BOSS_UNAVAILABLE','今日热榜暂不可用，请稍后再来。');
 if(typeof question!=='string'||!board.items.some(x=>x.id===question))fail('QUESTION','请选择今日热榜里的问题。',400);
 await personalHunt(db,uid,board);
 // Append once in a single statement so concurrent explorations cannot overwrite progress.
 await run(db,"UPDATE world SET value=json_set(json_insert(value,'$.visited[#]',?),'$.found',CASE WHEN json_extract(value,'$.location')=? THEN json('true') ELSE json_extract(value,'$.found') END) WHERE id=? AND NOT EXISTS(SELECT 1 FROM json_each(world.value,'$.visited') WHERE value=?)",question,question,huntKey(uid,board.date),question);
 return JSON.parse((await one(db,'SELECT value FROM world WHERE id=?',huntKey(uid,board.date))).value);
}
