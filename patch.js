// patch.js - pagination + dropdown uppercase centered + note box
(function(){
var _STS=['M\u1edbi nh\u1eadn','\u0110ang ki\u1ec3m tra','\u0110ang s\u1eeda','Ch\u1edd linh ki\u1ec7n','Ho\u00e0n th\u00e0nh','\u0110\u00e3 giao'];
var _SC={'M\u1edbi nh\u1eadn':'#7c3aed','\u0110ang ki\u1ec3m tra':'#1a56db','\u0110ang s\u1eeda':'#e67e22','Ch\u1edd linh ki\u1ec7n':'#6b7280','Ho\u00e0n th\u00e0nh':'#10b981','\u0110\u00e3 giao':'#10b981'};
window._repPage=window._repPage||1;
window._repPF=window._repPF||'';
(function(){var s=document.getElementById('_pSty');if(!s){s=document.createElement('style');s.id='_pSty';document.head.appendChild(s);}s.textContent='#rsf-select{width:auto!important;max-width:140px;min-width:100px}#rep-filter{width:auto!important;max-width:160px}';})();
function _gDB(){try{return typeof DB!=='undefined'?DB:null;}catch(e){return null;}}
function _gCU(){try{return typeof currentUser!=='undefined'?currentUser:null;}catch(e){return null;}}
function _gSTS(){try{return typeof STATUSES!=='undefined'?STATUSES:_STS;}catch(e){return _STS;}}
function _toD(s){if(!s)return'';var p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;}
function _aM(ds,m){if(!ds||!m)return null;var d=new Date(ds);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10);}
function _fN(n){return(n||0).toLocaleString('vi-VN');}
window._onStChange=function(id,sel){
  var ns=sel.value;
  if(typeof setRepairStatus==='function')setRepairStatus(id,ns);
  var w=sel.parentNode;
  var ex=w.querySelector('._nb');if(ex)ex.remove();
  var db=_gDB();
  var rep=db?(db.repairs||[]).find(function(r){return r&&r.id===id;}):null;
  var cur=(rep&&rep.processNote)?rep.processNote:'';
  var nb=document.createElement('div');nb.className='_nb';nb.style.cssText='margin-top:8px';
  nb.innerHTML='<textarea id="_nt_'+id+'" placeholder="M\u00f4 t\u1ea3 x\u1eed l\u00fd..." style="width:100%;padding:8px;border:1.5px solid #bbb;border-radius:6px;font-size:13px;resize:vertical;min-height:64px;box-sizing:border-box;font-family:inherit">'+cur+'</textarea>'+'<button onclick="window._saveNote(\''+id+'\')" style="margin-top:5px;padding:5px 18px;background:var(--pr,#1a56db);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">L\u01b0u ghi ch\u00fa</button>';
  w.appendChild(nb);
  setTimeout(function(){var ta=document.getElementById('_nt_'+id);if(ta)ta.focus();},50);
};
window._saveNote=function(id){
  var ta=document.getElementById('_nt_'+id);if(!ta)return;
  var note=ta.value.trim();
  function _done(){
    var db=_gDB();
    if(db){var rep=(db.repairs||[]).find(function(r){return r&&r.id===id;});if(rep)rep.processNote=note;}
    var nb=ta.closest('._nb');if(nb)nb.remove();
    if(typeof renderRepairs==='function')renderRepairs();
  }
  try{
    firebase.database().ref('repairs').orderByChild('id').equalTo(id).once('value',function(snap){
      snap.forEach(function(child){child.ref.update({processNote:note});});
      _done();
    });
  }catch(e){_done();}
};
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
  if(!tot){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--gy)"><div style="font-size:36px">&#128295;</div><div>Kh\u00f4ng c\u00f3 phi\u1ebfu n\u00e0o</div></div>';return;}
  var sts=_gSTS(),cu=_gCU(),isAdmin=cu&&cu.role==='admin';
  var html=rows.map(function(r){
    var cost=r.deliveryItems?r.deliveryItems.reduce(function(s,it){return s+it.qty*it.price;},0):(r.cost||0);
    var rem=Math.max(0,cost-(r.deposit||0)-(r.deliveryPaid||0));
    var dg=r.status==='\u0110\u00e3 giao',ocked=!isAdmin&&dg;
    var wd=_aM(r.deliveredDate,r.warrantyMonths);
    var dRow=r.deliveredDate?'<div><b>&#128198;</b> Giao: '+_toD(r.deliveredDate)+(wd?' &bull; &#128737;&#65039; BH \u0111\u1ebfn '+_toD(wd):'')+' </div>':'';
    var sc=_SC[r.status]||'#6b7280';
    var opts=sts.map(function(s){return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>';}).join('');
    var sel=!locked?'<div style="margin-top:10px"><select style="width:100%;padding:6px 10px;border-radius:6px;border:2polid '+sc+';font-size:13px;font-weight:700;color:'+sc+';background:#fff;cursor:pointer;text-align:center;text-align-last:center;text-transform:uppercase" onchange="window._onStChange(\''+r.id+'\',this)">'+opts+'</select></div>':'';
    return '<div class="card" style="border-left:4px solid '+(dg?'var(--ok)':'var(--pr(')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">'+
      '<div><span class="bx b-bl">'+r.id+'</span>'+locked?'<span class="bx b-gy" style="margin-left:4px">&#128274; \u0110\u00f3a-kh\u00f3a</span>':'')+' </div>'+
      '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
      (!locked&&!dg?'<button class="btn bs bsm" title="Giao m\u00e1y" onclick="openDeliverModal(\''+r.id+'\')" >&#128640;</button>':'')+
      (!locked?'<button class="btn bg2 bsm" onclick="openRepairModal(\''+r.id+'\')" >&#9999;&#65039;</button>':'')+
      '<button class="btn bpu bsm" onclick="printRepairBill(DB.repairs.find(function(x){return x&&x.id===\''+r.id+'\';}))">&#128424;&#65039;</button>'+
      (!locked?'<button class="btn bd2 bsm" onclick="deleteRepair(\''+r.id+'\')" >&#128465;&#65039;</button>':'')+
      '</div></div>'+
      '<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'+
      '<div><b>&#128100;</b> '+r.customerName+' \u2013 '+r.phone+'</div>'+
      '<div><b>&#128187;</b> '+r.device+(r.serial?' ('+r.serial+')':'')+' </div>'+
      '<div><b>&#128296;</b> '+r.issue+'</div>'+
      '<div><b>&#128197;</b> Nh\u1eadn: '+_toD(r.receivedDate)+'</div>'+
      dRow+
      '<div><b>&#128176; </b> Ph\u00ed: '+_fN(cost)+' \u0111 | C\u1ecdc: '+_fN(r.deposit||0)+' \u0111 | C\u00f2n: <strong style="color:'+(rem>0?'var(--er)':'var(--ok)')+'">'+_fN(rem)+' \u0111</strong></div>'+
      (r.techName?'<div><b>&#128104;&#8205;&#128295;</b> KTV: '+r.techName+'</div>':'')+
      (r.deliveryItems&&r.deliveryItems.length?'<div style="grid-column:1/-1"><b>&#128203;</b> '+r.deliveryItems.length+' h\u1ea1ng m\u1ee5c</div>':'')+
      (r.processNote?'<div style="grid-column:1/-1;background:#f0f7ff;border-radius:6px;padding:6px 8px"><b>\ud83d\udcdd</b> '+r.processNote+'</div>':'')+
      '</div>'+sel+'</div>';
  }).join('');
  var nav=tp>1?'<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:18px 0;flex-wrap:wrap"><button class="btn bp" style="padding:7px 16px;opacity:'+(pg<=1?.4:1)+'" '+(pg<=1?'disabled':'')+' onclick="window._repPage='+(pg-1)+';renderRepairs();window.scrollTo(0,0)">&#9664; Tr\u01b0\u1edbc</button><span style="font-size:13px;color:var(--gy)">Trang <b>'+pg+'</b> / '+tp+' &nbsp;&middot;&nbsp; <b>'+tot+'</b> phi\u1ebfu</span><button class="btn bp" style="padding:7px 16px;opacity:'+(pg>=tp?.4:1)+'" '+(pg>=tp?'disabled':'')+' onclick="window._repPage='+(pg+1)+';renderRepairs();window.scrollTo(0,0)">Sau &#9654;</button></div>':'<div style="text-align:center;padding:10px 0;font-size:13px;color:var(--gy)"><b>'+tot+'</b> phi\u1ebfu</div>';
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
