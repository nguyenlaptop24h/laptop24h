// patch.js - pagination + dropdown trang thai cho Sua Chua
(function(){
var _repPage=1,_repPrevFilter='';
var _STS=['Mới nhận','Đang kiểm tra','Đang sửa','Chờ linh kiện','Hoàn thành','Đã giao'];
function toDisp(s){if(!s)return'';var p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;}
function addMonths(ds,m){if(!ds||!m)return null;var d=new Date(ds);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10);}
function fmtN(n){return(n||0).toLocaleString('vi-VN');}
function getDB(){try{return typeof DB!=='undefined'?DB:null;}catch(e){return null;}}
function getStatus(r){try{return(typeof ST_CLASS!=='undefined'?ST_CLASS:{})[r.status]||'b-gy';}catch(e){return'b-gy';}}
function getStatuses(){try{return typeof STATUSES!=='undefined'?STATUSES:_STS;}catch(e){return _STS;}}
window.renderRepairs=function(){
  var dbObj=getDB();if(!dbObj)return;
  var q=(document.getElementById('rep-search')||{value:''}).value.toLowerCase();
  var sf=(document.getElementById('rep-filter')||{value:''}).value;
  var rsf=(document.getElementById('rsf-select')||{value:''}).value;
  var fKey=q+'|'+sf+'|'+rsf;
  if(fKey!==_repPrevFilter){_repPage=1;_repPrevFilter=fKey;}
  var todayStr=new Date().toISOString().slice(0,10);
  function inRange(ds){
    if(!rsf)return true;if(!ds)return false;
    if(rsf==='day')return ds===todayStr;
    if(rsf==='month')return ds.slice(0,7)===todayStr.slice(0,7);
    if(rsf==='year')return ds.slice(0,4)===todayStr.slice(0,4);
    if(rsf==='week'){var d=new Date(ds),t=new Date(todayStr),diff=(t-d)/86400000,dow=t.getDay()===0?6:t.getDay()-1;return diff>=0&&diff<=dow;}
    return true;
  }
  var reps=(dbObj.repairs||[]).filter(function(r){
    if(!r)return false;
    var mq=!q||(r.customerName||'').toLowerCase().indexOf(q)>=0||(r.device||'').toLowerCase().indexOf(q)>=0||(r.id||'').toLowerCase().indexOf(q)>=0||(r.phone||'').indexOf(q)>=0;
    return mq&&(!sf||r.status===sf)&&inRange(r.receivedDate);
  });
  reps.sort(function(a,b){return(a.receivedDate||'')<(b.receivedDate||'')?1:-1;});
  var total=reps.length,PAGE_SIZE=50,totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  var page=Math.max(1,Math.min(_repPage,totalPages));_repPage=page;
  var pageReps=reps.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  var list=document.getElementById('repair-list');if(!list)return;
  if(!total){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--gy)"><div style="font-size:36px">&#128295;</div><div>Kh&#244;ng c&#243; phi&#7871;u n&#224;o</div></div>';return;}
  var sts=getStatuses();
  var cardsHTML=pageReps.map(function(r){
    var stCls=getStatus(r);
    var repCost=r.deliveryItems?r.deliveryItems.reduce(function(s,it){return s+it.qty*it.price;},0):(r.cost||0);
    var remaining=Math.max(0,repCost-(r.deposit||0)-(r.deliveryPaid||0));
    var isDaGiao=r.status==='Đã giao';
    var isAdmin=window.currentUser&&window.currentUser.role==='admin';
    var locked=!isAdmin&&isDaGiao;
    var wDate=addMonths(r.deliveredDate,r.warrantyMonths);
    var delivRow=r.deliveredDate?'<div><b>&#128198;</b> Giao: '+toDisp(r.deliveredDate)+(wDate?' &bull; &#128737;&#65039; BH &#273;&#7871;n '+toDisp(wDate):'')+' </div>':'';
    var stOpts=sts.map(function(s){return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>';}).join('');
    var stRow=!locked
      ?'<div style="margin-top:10px;display:flex;align-items:center;gap:8px">'+
        '<span style="font-size:11px;font-weight:700;color:var(--gy);white-space:nowrap">Tr&#7841;ng th&#225;i:</span>'+
        '<select style="flex:1;padding:6px 10px;border-radius:6px;border:1.5px solid var(--bd);font-size:13px;font-family:inherit;cursor:pointer;background:#fff" onchange="setRepairStatus(\''+r.id+'\',this.value)">'+stOpts+'</select>'+
        '</div>'
      :'';
    return '<div class="card" style="border-left:4px solid '+(isDaGiao?'var(--ok)':'var(--pr)')+'">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">'+
    '<div><span class="bx b-bl">'+r.id+'</span><span class="bx '+stCls+'" style="margin-left:6px">'+r.status+'</span>'+(locked?'<span class="bx b-gy" style="margin-left:4px">&#128274; &#272;&#227; kh&#243;a</span>':'')+' </div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
    (!locked&&!isDaGiao?'<button class="btn bs bsm" onclick="openDeliverModal(\''+r.id+'\')" >&#128640; Giao m&#225;y</button>':'')+
    (!locked?'<button class="btn bg2 bsm" onclick="openRepairModal(\''+r.id+'\')" >&#9999;&#65039;</button>':'')+
    '<button class="btn bpu bsm" onclick="printRepairBill(getDB().repairs.find(function(x){return x&&x.id===\''+r.id+'\';}))">&#128424;&#65039; In</button>'+
    (!locked?'<button class="btn bd2 bsm" onclick="deleteRepair(\''+r.id+'\')" >&#128465;&#65039;</button>':'')+
    '</div></div>'+
    '<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'+
    '<div><b>&#128100;</b> '+r.customerName+' &ndash; '+r.phone+'</div>'+
    '<div><b>&#128187;</b> '+r.device+(r.serial?' ('+r.serial+')':'')+' </div>'+
    '<div><b>&#128296;</b> '+r.issue+'</div>'+
    '<div><b>&#128197;</b> Nh&#7853;n: '+toDisp(r.receivedDate)+'</div>'+
    delivRow+
    '<div><b>&#128176;</b> Ph&#237;: '+fmtN(repCost)+' &#273; | C&#7885;c: '+fmtN(r.deposit||0)+' &#273; | C&#242;n: <strong style="color:'+(remaining>0?'var(--er)':'var(--ok)')+'" >'+fmtN(remaining)+' &#273;</strong></div>'+
    (r.techName?'<div><b>&#128104;&#8205;&#128295;</b> KTV: '+r.techName+'</div>':'')+
    (r.deliveryItems&&r.deliveryItems.length?'<div style="grid-column:1/-1"><b>&#128203;</b> '+r.deliveryItems.length+' h&#7841;ng m&#7909;c</div>':'')+
    (r.processNote?'<div style="grid-column:1/-1"><b>&#128296;</b> '+r.processNote+'</div>':'')+
    '</div>'+stRow+'</div>';
  }).join('');
  var paginHTML=totalPages>1?
    '<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:18px 0;flex-wrap:wrap">'+
    '<button class="btn bp" style="padding:7px 16px;opacity:'+(page<=1?.4:1)+'" '+(page<=1?'disabled':'')+' onclick="_repPage='+(page-1)+';renderRepairs();window.scrollTo(0,0)">&#9664; Tr&#432;&#7899;c</button>'+
    '<span style="font-size:13px;color:var(--gy)">Trang <b>'+page+'</b> / '+totalPages+' &nbsp;&middot;&nbsp; <b>'+total+'</b> phi&#7871;u</span>'+
    '<button class="btn bp" style="padding:7px 16px;opacity:'+(page>=totalPages?.4:1)+'" '+(page>=totalPages?'disabled':'')+' onclick="_repPage='+(page+1)+';renderRepairs();window.scrollTo(0,0)">Sau &#9654;</button>'+
    '</div>'
    :'<div style="text-align:center;padding:10px 0;font-size:13px;color:var(--gy)"><b>'+total+'</b> phi&#7871;u</div>';
  list.innerHTML=cardsHTML+paginHTML;
};

function addScrollBtns(){
  if(document.getElementById('_btnTop'))return;
  var t=document.createElement('button'),b=document.createElement('button');
  t.id='_btnTop';t.innerHTML='&#8593;';t.title='Lên đầu trang';
  b.id='_btnBot';b.innerHTML='&#8595;';b.title='Xuống cuối trang';
  var base='position:fixed;right:18px;z-index:9999;width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:var(--pr,#1a56db);color:#fff;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,.25);display:none';
  t.style.cssText=base+';bottom:80px';b.style.cssText=base+';bottom:28px';
  t.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
  b.onclick=function(){window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});};
  document.body.appendChild(t);document.body.appendChild(b);
  window.addEventListener('scroll',function(){
    t.style.display=window.scrollY>200?'block':'none';
    b.style.display=(window.innerHeight+window.scrollY)>=document.body.scrollHeight-50?'none':'block';
  },{passive:true});
  setTimeout(function(){if(document.body.scrollHeight>window.innerHeight)b.style.display='block';},300);
}

function tryActivate(){
  var dbObj=getDB();if(!dbObj)return false;
  window._patchActivated=true;addScrollBtns();
  var list=document.getElementById('repair-list');
  if(list&&list.children.length>0)window.renderRepairs();
  return true;
}
if(!tryActivate()){var _att=0,_iv=setInterval(function(){_att++;if(tryActivate()||_att>=120)clearInterval(_iv);},500);}
})();
