import {one} from '../site/src/store.mjs';
import {fail} from '../site/src/util.mjs';
export const cookieHeader=()=>'';
export const throttle=async()=>{};
export const credentials=async()=>fail('LOCAL_ONLY','本地演示无需登录，也不创建其他账户。',400);
export const session=async db=>{const u=await one(db,"SELECT id,name,role FROM users WHERE id='local'");return u?{user_id:u.id,name:u.name,role:u.role,csrf:'local-demo',token:'local-demo'}:null;};
export function requireWrite(request,s){if(!s||new URL(request.url).origin!=='https://local.zhidou.invalid'||request.headers.get('x-csrf-token')!=='local-demo')fail('LOCAL_ORIGIN','请从客户端页面操作。',403);}

