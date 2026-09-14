import http from 'node:http';
import {readFile,writeFile,mkdir,unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {database} from './database.mjs';
import {createDemo} from './core.mjs';
const root=fileURLToPath(new URL('./',import.meta.url)),data=path.join(root,'data'),pub=path.join(root,'public');
await mkdir(data,{recursive:true});
const lock=path.join(data,'instance.lock'),instance=randomUUID();
// A lock prevents two launchers from opening the same portable save concurrently.
try{await writeFile(lock,String(process.pid),{flag:'wx'});}catch(e){
 if(e.code!=='EEXIST')throw e;
 const pid=Number(await readFile(lock,'utf8'));let alive=false;try{process.kill(pid,0);alive=true;}catch{}
 if(alive)process.exit(0);
 await unlink(lock);await writeFile(lock,String(process.pid),{flag:'wx'});
}
let db,handle;
try{db=database(path.join(data,'zhidou-demo.sqlite'));handle=await createDemo(db);}catch(e){await unlink(lock);throw e;}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon'};
const security={'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
let origin,queue=Promise.resolve(),closing=false;
const json=(res,status,value)=>{res.writeHead(status,{...security,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
async function dispatch(req,res){
 if(req.headers.host!==new URL(origin).host)return json(res,403,{message:'仅限本机客户端访问。'});
 if(req.headers.origin&&req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{message:'请从客户端页面操作。'});
 if(!['GET','POST','HEAD'].includes(req.method))return json(res,405,{message:'不支持该操作。'});
 const url=new URL(req.url,origin),p=url.pathname;
 if(p==='/api/health')return json(res,200,{app:'zhidou-desktop',instance,pid:process.pid});
 if(p.startsWith('/api/')){
  if(closing)return json(res,503,{message:'正在退出，请重新启动。'});
  let body;
  if(req.method==='POST'){
   if(req.headers.origin!==origin)return json(res,403,{message:'请从客户端页面操作。'});
   let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>8192)return json(res,413,{message:'请求过长。'});parts.push(chunk);}
   try{body=JSON.parse(Buffer.concat(parts).toString());if(!body||Array.isArray(body)||typeof body!=='object')throw Error();}catch{return json(res,400,{message:'数据格式不正确。'});}
  }
  if(p==='/api/local/reset'){
   if(req.method!=='POST')return json(res,405,{message:'请使用重置按钮。'});
   db.raw.exec('BEGIN IMMEDIATE; DELETE FROM operations; DELETE FROM orders; DELETE FROM redemptions; DELETE FROM sessions; DELETE FROM users; DELETE FROM market; DELETE FROM quotes; DELETE FROM world; DELETE FROM throttles; COMMIT;');
   db.raw.close();db=database(path.join(data,'zhidou-demo.sqlite'));
   handle=await createDemo(db);return json(res,200,{ok:true});
  }
  if(p==='/api/shutdown'){
   if(req.method!=='POST')return json(res,405,{message:'请使用退出按钮。'});
   json(res,200,{ok:true});setTimeout(shutdown,100);return;
  }
  const result=await handle(p+url.search,body);res.writeHead(result.status,{...security,...Object.fromEntries(result.headers)});res.end(Buffer.from(await result.arrayBuffer()));return;
 }
 if(req.method==='POST')return json(res,405,{message:'不支持该操作。'});
 let decoded;try{decoded=decodeURIComponent(p);}catch{return json(res,400,{message:'地址无效。'});}
 const file=path.resolve(pub,'.'+(decoded==='/'?'/index.html':decoded));
 if(!file.startsWith(pub+path.sep))return json(res,403,{message:'地址无效。'});
 try{const content=await readFile(file);res.writeHead(200,{...security,'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);}catch{return json(res,404,{message:'文件不存在。'});}
}
const server=http.createServer((req,res)=>{queue=queue.then(()=>dispatch(req,res)).catch(()=>{if(!res.headersSent)json(res,500,{message:'操作失败，请重试或重新启动客户端。'});else res.end();});});
server.requestTimeout=15000;server.headersTimeout=10000;
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
await writeFile(path.join(data,'startup.json'),JSON.stringify({origin,pid:process.pid,instance}));
console.log('知斗已启动：'+origin);
async function shutdown(){if(closing)return;closing=true;server.close();server.closeIdleConnections();db.raw.close();await unlink(lock).catch(()=>{});await unlink(path.join(data,'startup.json')).catch(()=>{});process.exit(0);}
process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
