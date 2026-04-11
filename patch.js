// patch.js - pagination + dropdown trang thai noi bat
(function(){
var _STS=['Má»i nháº­n','Äang kiá»m tra','Äang sá»­a','Chá» linh kiá»n','HoÃ n thÃ nh','ÄÃ£ giao'];
var _SC={'Má»i nháº­n':'#7c3aed','Äang kiá»m tra':'#1a56db','Äang sá»­a':'#e67e22','Chá» linh kiá»n':'#6b7280','HoÃ n thÃ nh':'#10b981','ÄÃ£ giao':'#10b981'};
window._repPage=window._repPage||1;
window._repPF=window._repPF||'';
// Fix chieu rong filter selects
(function(){
  var s=document.getElementById('_pSty');
  if(!s){s=document.createElement('style');s.id='_pSty';document.head.appendChild(s);}
  s.textContent='#rsf-select{width:auto!important;max-width:140px;min-width:100px}#rep-filter{width:auto!important;max-width:160px}';
})();
function _gDB(){try{return typeof DB!=='undefined'?DB:null;}catch(e){return null;}}
function _gCU(){try{return typeof currentUser!=='undefined'?currentUser:null;}catch(e){return null;}}
function _gSTS(){try{return typeof STATUSES!=='undefined'?STATUSES:_STS;}catch(e){return _STS;}}
function _toD(s){if(!s)return'';var p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;}
function _aM(ds,m){if(!ds||!m)return null;var d=new Date(ds);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10);}
function _fN(n){return(n||0).toLocaleString('vi-VN');}
window.renderRepairs=function(){
  var db=_gDB();if(!db)return;
  var q=(document.getElementById('rep-search')||{value:''}).value.toLowerCase();
  var sf=(document.getElementById('rep-filter')||{value:''}).value;
  var rsf=(document.getElementById('rsf-select')||{value:''}).value;
  var fKey=q+'|'+sf+'|'+rsf;
  if(fKey!==window._repPF){window._repPage=1;window._repPF=fKey;}
  var today=new Date().toISOString().slice(0,10);
  function inR(ds){if(!rsf)return true;if(!ds)return false;if(rsf==='day')return ds===today;if(rsf==='month')return ds.slice(0,7)===today.slice(0,7);if(rsf==='year')return ds.slice(0,4)===today.slice(0,4);if(rsf==='week'){var d=new Date(ds),t=new Date(today),df=(t-d)/86400000,dw=t.getDay()===0?6:t.getDay()-1;return df>=0&&df<=dw;}return true;}
  var reps=(db.repairs||[]).filter(function(r){if(!r)return false;var mq=!q||(r.customerName||'').toLowerCase().indexOf(q)>=0||(r.device||'').toLowerCase().indexOf(q)>=0||(r.id||'').toLowerCase().indexOf(q)>=0||(r.phone||'').indexOf(q)>=0;return mq&&(!sf||r.status===sf)&&inR(r.receivedDate);});
  reps.sort(function(a,b){return(a.receivedDate||'')<(b.receivedDate||'')?1:-1;});
  var tot=reps.length,PS=50,tp=Math.max(1,Math.ceil(tot/PS));
  var pg=Math.max(1,Math.min(window._repPage||1,tp));window._repPage=pg;
  var rows=reps.slice((pg-1)*PS,pg*PS);
  var list=document.getElementById('repair-list');if(!list)return;
  if(!tot){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--gy)"><div style="font-size:36px">&#128295;</div><div>Kh&#244;ng c&#243; phi&#7871;u n&#224;o</div></div>';return;}
  var sts=_gSTS(),cu=_gCU(),isAdmin=cu&&cu.role==='admin';
  var html=rows.map(function(r){
    var cost=r.deliveryItems?r.deliveryItems.reduce(function(s,it){return s+it.qty*it.price;},0):(r.cost||0);
    var rem=Math.max(0,cost-(r.deposit||0)-(r.deliveryPaid||0));
    var dg=r.status==='ÄÃ£ giao',locked=!isAdmin&&dg;
    var wd=_aM(r.deliveredDate,r.warrantyMonths);
    var dRow=r.deliveredDate?'<div><b>&#128198;</b> Giao: '+_toD(r.deliveredDate)+(wd?' &bull; &#128737;&#65039; BH &#273;&#7871;n '+_toD(wd):'')+' </div>':'';
    var sc=_SC[r.status]||'#6b7280';
    var opts=sts.map(function(s){return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>';}).join('');
    var sel=!locked?'<div style="margin-top:10px"><select style="width:100%;padding:5px 10px;border-radius:6px;border:2px solid '+sc+';font-size:13px;font-weight:700;color:'+sc+';background:#fff;cursor:pointer" onchange="setRepairStatus(\''+r.id+'\',this.value)">'+opts+'</select></div>':'';
    return '<div class="card" style="border-left:4px solid '+(dg?'var(--ok)':'var(--pr)')+'">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">'+
    '<div><span class="bx b-bl">'+r.id+'</span>'+(locked?'<span class="bx b-gy" style="margin-left:4px">&#128274; &#272;&#227; kh&#243;a</span>':'')+' </div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
    (!locked&&!dg?'<button class="btn bs bsm" title="Giao m&#225;y" onclick="openDeliverModal(\''+r.id+'\')" >&#128640;</button>':'')+
    (!locked?'<button class="btn bg2 bsm" onclick="openRepairModal(\''+r.id+'\')" >&#9999;&#65039;</button>':'')+
    '<button class="btn bpu bsm" onclick="printRepairBill(DB.repairs.find(function(x){return x&&x.id===\''+r.id+'\';}))">&#128424;&#65039;</button>'+
    (!locked?'<button class="btn bd2 bsm" onclick="deleteRepair(\''+r.id+'\')" >&#128465;&#65039;</button>':'')+
    '</div></div>'+
    '<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'+
    '<div><b>&#128100;</b> '+r.customerName+' &ndash; '+r.phone+'</div>'+
    '<div><b>&#128187;</b> '+r.device+(r.serial?' ('+r.serial+')':'')+' </div>'+
    '<div><b>&#128296;</b> '+r.issue+'</div>'+
    '<div><b>&#128197;</b> Nh&#7853;n: '+_toD(r.receivedDate)+'</div>'+
    dRow+
    '<div><b>&#128176;</b> Ph&#237;: '+_fN(cost)+' &#273; | C&#7885;c: '+_fN(r.deposit||0)+' &#273; | C&#242;n: <strong style="color:'+(rem>0?'var(--er)':'var(--ok)')+'" >'+_fN(rem)+' &#273;</strong></div>'+
    (r.techName?'<div><b>&#128104;&#8205;&#128295;</b> KTV: '+r.techName+'</div>':'')+
    (r.deliveryItems&&r.deliveryItems.length?'<div style="grid-column:1/-1"><b>&#128203;</b> '+r.deliveryItems.length+' h&#7841;ng m&#7909;c</div>':'')+
    (r.processNote?'<div style="grid-column:1/-1"><b>&#128296;</b> '+r.processNote+'</div>':'')+
    '</div>'+sel+'</div>';
  }).join('');
  var nav=tp>1?'<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:18px 0;flex-wrap:wrap"><button class="btn bp" style="padding:7px 16px;opacity:'+(pg<=1?.4:1)+'" '+(pg<=1?'disabled':'')+' onclick="window._repPage='+(pg-1)+';renderRepairs();window.scrollTo(0,0)">&#9664; Tr&#432;&#7899;c</button><span style="font-size:13px;color:var(--gy)">Trang <b>'+pg+'</b> / '+tp+' &nbsp;&middot;&nbsp; <b>'+tot+'</b> phi&#7871;u</span><button class="btn bp" style="padding:7px 16px;opacity:'+(pg>=tp?.4:1)+'" '+(pg>=tp?'disabled':'')+' onclick="window._repPage='+(pg+1)+';renderRepairs();window.scrollTo(0,0)">Sau &#9654;</button></div>':'<div style="text-align:center;padding:10px 0;font-size:13px;color:var(--gy)"><b>'+tot+'</b> phi&#7871;u</div>';
  list.innerHTML=html+nav;
};
function _addBtns(){
  if(document.getElementById('_btnTop'))return;
  var t=document.createElement('button'),b=document.createElement('button');
  t.id='_btnTop';t.innerHTML='&#8593;';b.id='_btnBot';b.innerHTML='&#8595;';
  var bs='position:fixed;right:18px;z-index:9999;width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:var(--pr,#1a56db);color:#fff;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,.25);display:none';
  t.style.cssText=bs+';bottom:80px';b.style.cssText=bs+';bottom:28px';
  t.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
  b.onclick=function(){window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});};
  document.body.appendChild(t);document.body.appendChild(b);
  window.addEventListener('scroll',function(){t.style.display=window.scrollY>200?'block':'none';b.style.display=(window.innerHeight+window.scrollY)>=document.body.scrollHeight-50?'none':'block';},{passive:true});
  setTimeout(function(){if(document.body.scrollHeight>window.innerHeight)b.style.display='block';},300);
}
function _act(){var db=_gDB();if(!db)return false;window._patchActivated=true;_addBtns();var l=document.getElementById('repair-list');if(l&&l.children.length>0)window.renderRepairs();return true;}
if(!_act()){var _a=0,_iv=setInterval(function(){_a++;if(_act()||_a>=120)clearInterval(_iv);},500);}
})();
