export const day = (now=Date.now())=>new Date(now+28800000).toISOString().slice(0,10);
export const endDay = (now=Date.now())=>Date.parse(day(now)+'T16:00:00Z');
export const stamp = (now=Date.now())=>new Date(now+28800000).toISOString().replace('Z','+08:00');
export const clone = x=>structuredClone(x);
export function fail(code,message,status=409){throw Object.assign(new Error(message),{code,status});}
export function key(v){if(typeof v!=='string'||!/^[A-Za-z0-9_-]{16,80}$/.test(v))fail('REQUEST_KEY','请求编号无效。',400);return v;}
export function canonical(x){return JSON.stringify(x,Object.keys(x).sort());}
export const hex = buf=>Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');
export const randomToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const hash=async text=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
export const roll=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
export function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(roll()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export const half=n=>Math.floor(n+0.5);
export const held=s=>s.battle&&s.battle.phase!=='complete'?s.battle.players[0].bank+20:0;
export const owned=s=>s.fish+held(s);
export function removeCost(s,n){const qty=owned(s);if(n>qty||n<0)throw new Error('Cost balance mismatch');const removed=n===qty?s.cost:half(s.cost*n/qty);s.cost-=removed;return removed;}
export function grantFish(s,n,rate){const count=owned(s),value=Number(rate)*100;s.cost+=half((count+n)*value)-half(count*value);s.fish+=n;}
export const parse = row=>row?{...row,state:JSON.parse(row.state)}:null;

export const heldVitality=s=>s.battle?.phase!=='complete'?(s.battle?.challenge?.penalty||0):0;
