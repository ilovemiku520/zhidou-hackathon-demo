'use strict';
(()=>{const $=id=>document.getElementById(id),dialog=$('redeem-dialog');let busy=false;
 $('redeem-open').addEventListener('click',()=>{if(!dialog.open)dialog.showModal();});$('redeem-close').addEventListener('click',()=>dialog.close());
 $('redeem-form').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;$('redeem-submit').disabled=true;$('redeem-message').textContent='正在核对兑换码…';try{const h=window.Zhidou;if(!h.getState()&&!await h.refresh())throw new Error('请先登录账户。');const r=await h.api('/api/redeem',{code:$('redeem-code').value});$('redeem-message').textContent=r.replayed?'本账户已兑换过，不会重复发放。':`兑换成功！${r.fish} 小鱼干已到账。`;$('redeem-code').value='';await h.refresh();}catch(e){$('redeem-message').textContent=e.code?e.message:'结果暂未确认，请重试核对；同一账户不会重复领取。';}finally{busy=false;$('redeem-submit').disabled=false;}});
})();
