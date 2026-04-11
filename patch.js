// patch.js - pagination top+bottom + scrollable repair-list
(function(){
window._repPage=window._repPage||1;window._repPrevFilter=window._repPrevFilter||'';
function toDisp(s){if(!s)return'';var p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;}
function addMonths(ds,m){if(!ds||!m)return null;var d=new Date(ds);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10);}
function injectCSS(){
  if(document.getElementById('_patchCSS'))return;
  var s=document.createElement('style');s.id='_patchCSS';
  s.textContent='body:has(#pg-repair.on){overflow:hidden}#pg-repair.on{display:flex!important;flex-direction:column;height:calc(100vh - var(--_navH,87px));overflow:hidden;box-sizing:border-box}#pg-repair.on #repair-list{flex:1;min-height:0;overflow-y:auto;padding-bottom:10px}#rsf-select{width:auto!important;min-width:120px;max-width:160px}';
  document.head.appendChild(s);
}
function setNavH(){var n=document.querySelector('nav');if(n)document.documentElement.style.setProperty('--_navH',n.offsetHeight+'px');}
window._showPN=function(s){return s==='Đang sửa'||s==='Chờ linh kiện'||s==='Hoàn thành';};
window.saveProcessNote=function(id,val){
  if(!window.DB||!DB.repairs)return;
  var idx=DB.repairs.findIndex(function(x){return x&&x.id===id;});
  if(idx<0)return;
  DB.repairs[idx].processNote=val||null;
  try{firebase.database().ref('repairs/'+idx+'/processNote').set(val||null);}catch(e){}
};

window._showPNDisplay=function(id,val){
  window._pnEdit=window._pnEdit||{};
  window._pnEdit[id]=false;
  window.saveProcessNote(id,val);
  var ta=document.getElementById('_pn_'+id);
  if(!ta)return;
  var dv=document.createElement('div');
  dv.style.cssText='display:block;width:100%;margin-top:6px;padding:8px 10px;border-radius:6px;border:1.5px solid var(--pr,#5c6bc0);font-size:13px;min-height:60px;background:var(--bg,#fff);color:var(--tx,#222);white-space:pre-wrap;cursor:text;box-sizing:border-box';
  dv.textContent=val;
  dv.onclick=function(){window._pnEdit[id]=true;setTimeout(function(){window.renderRepairs&&window.renderRepairs();},0);};
  if(ta.parentNode)ta.parentNode.replaceChild(dv,ta);
};
window._origSRS=window.setRepairStatus;
window.setRepairStatus=function(id,status){
  if(status==='Hoàn thành'){
    var idx=DB.repairs?DB.repairs.findIndex(function(x){return x&&x.id===id;}):-1;
    if(idx>=0){
      DB.repairs[idx].status='Hoàn thành';
      try{firebase.database().ref('repairs/'+idx+'/status').set('Hoàn thành');}catch(e){}
    }
  }else if(window._origSRS){
    try{window._origSRS(id,status);}catch(e){
      var idx2=DB.repairs?DB.repairs.findIndex(function(x){return x&&x.id===id;}):-1;
      if(idx2>=0){
        DB.repairs[idx2].status=status;
        if(status==='\u0110\u00e3 giao'&&!DB.repairs[idx2].deliveredDate)DB.repairs[idx2].deliveredDate=new Date().toISOString().slice(0,10);
        try{firebase.database().ref('repairs/'+idx2+'/status').set(status);}catch(e2){}
      }
    }
  }
  window._pnEdit=window._pnEdit||{};window._pnEdit[id]=true;setTimeout(function(){document.querySelectorAll('textarea[id^="_pn_"]').forEach(function(ta){var rid=ta.id.slice(4);if(ta.value!==(ta.dataset.orig||'')){window.saveProcessNote(rid,ta.value);ta.dataset.orig=ta.value;}});window.renderRepairs&&window.renderRepairs();},30);
};
window._pnEdit=window._pnEdit||{};
window.renderRepairs=function(){
  setNavH();
  var q=(document.getElementById('rep-search')||{value:''}).value.toLowerCase();
  var sf=(document.getElementById('rep-filter')||{value:''}).value;
  var rsf=(document.getElementById('rsf-select')||{value:''}).value;
  var fKey=q+'|'+sf+'|'+rsf;
  if(fKey!==_repPrevFilter){window._repPage=1;window._repPrevFilter=fKey;}
  var todayStr=new Date().toISOString().slice(0,10);
  function inRange(ds){
    if(!rsf)return true;if(!ds)return false;
    if(rsf==='day')return ds===todayStr;
    if(rsf==='month')return ds.slice(0,7)===todayStr.slice(0,7);
    if(rsf==='year')return ds.slice(0,4)===todayStr.slice(0,4);
    if(rsf==='week'){var d=new Date(ds),t=new Date(todayStr),diff=(t-d)/86400000,dow=t.getDay()===0?6:t.getDay()-1;return diff>=0&&diff<=dow;}
    return true;
  }
  var reps=(DB.repairs||[]).filter(function(r){
    if(!r)return false;
    var mq=!q||(r.customerName||'').toLowerCase().indexOf(q)>=0||(r.device||'').toLowerCase().indexOf(q)>=0||(r.id||'').toLowerCase().indexOf(q)>=0||(r.phone||'').indexOf(q)>=0;
    return mq&&(!sf||r.status===sf)&&inRange(r.receivedDate);
  });
  reps.sort(function(a,b){return(a.receivedDate||'')<(b.receivedDate||'')?1:-1;});
  var total=reps.length;
  var PAGE_SIZE=50;
  var totalPages=Math.max(1,Math.ceil(total/PAGE_SIZE));
  var page=Math.max(1,Math.min(window._repPage,totalPages));
  window._repPage=page;
  var pageReps=reps.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  var list=document.getElementById('repair-list');
  if(!list)return;
  if(!total){list.innerHTML='<div style="text-align:center;padding:40px;color:var(--gy)"><div style="font-size:36px">&#128295;</div><div>Kh&#244;ng c&#243; phi&#7871;u n&#224;o</div></div>';return;}
  var cardsHTML=pageReps.map(function(r){
    var _STAT=['Mới nhận','Đang kiểm tra','Đang sửa','Chờ linh kiện','Hoàn thành','Đã giao'];
    var _SCLS={'Mới nhận':'b-bl','Đang kiểm tra':'b-or','Đang sửa':'b-pu','Chờ linh kiện':'b-rd','Hoàn thành':'b-gn','Đã giao':'b-gy'};
    var stCls=(window.ST_CLASS||_SCLS)[r.status]||'b-gy';
    var repCost=r.deliveryItems?r.deliveryItems.reduce(function(s,it){return s+it.qty*it.price;},0):(r.cost||0);
    var remaining=Math.max(0,repCost-(r.deposit||0)-(r.deliveryPaid||0));
    var canDeliver=r.status!=='&#272;&#227; giao';
    var isAdmin=window.currentUser&&window.currentUser.role==='admin';
    var locked=!isAdmin&&r.status==='&#272;&#227; giao';
    var wDate=addMonths(r.deliveredDate,r.warrantyMonths);
    var delivRow=r.deliveredDate?'<div><b>&#128198;</b> Giao: '+toDisp(r.deliveredDate)+(wDate?' &#8226; &#128737;&#65039; BH &#273;&#7871;n '+toDisp(wDate):'')+' </div>':'';
    var noteShow=window._showPN(r.status)?'block':'none';
    var statusSel='<select onchange="setRepairStatus(\''+r.id+'\',this.value);" style="margin-top:10px;width:100%;padding:9px 14px;border-radius:8px;border:2px solid var(--pr,#5c6bc0);background:var(--bg,#fff);color:var(--tx,#222);font-size:14px;font-weight:600;cursor:pointer">'
      +(window.STATUSES||_STAT).map(function(s){return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>';}).join('')
      +'</select>'
      +(window._showPN(r.status)&&r.processNote&&!window._pnEdit[r.id]
  ?'<div style="display:block;width:100%;margin-top:6px;padding:8px 10px;border-radius:6px;border:1.5px solid var(--pr,#5c6bc0);font-size:13px;min-height:60px;background:var(--bg,#fff);color:var(--tx,#222);white-space:pre-wrap;cursor:text;box-sizing:border-box" onclick="window._pnEdit[\''+r.id+'\']= true;setTimeout(function(){window.renderRepairs&&window.renderRepairs();},0);">' +r.processNote.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'
  :'<textarea id="_pn_'+r.id+'" data-orig="'+(r.processNote||'')+'" style="display:'+noteShow+';width:100%;margin-top:6px;padding:8px 10px;border-radius:6px;border:1.5px solid var(--pr,#5c6bc0);font-size:13px;resize:vertical;min-height:60px;background:var(--bg,#fff);color:var(--tx,#222);box-sizing:border-box" placeholder="M\u00f4 t\u1ea3 x\u1eed l\u00fd..." onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();var v=this.value;window._showPNDisplay(\''+r.id+'\',v);}" onblur="if(this.value!==(this.dataset.orig||\'\')){window.saveProcessNote(\''+r.id+'\',this.value);this.dataset.orig=this.value;}">'+(r.processNote||'')+'</textarea>');
    return '<div class="card" style="border-left:4px solid '+(r.status==='&#272;&#227; giao'?'var(--ok)':'var(--pr)')+'">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">'
      +'<div><span class="bx b-bl">'+r.id+'</span>'+(locked?'<span class="bx b-gy" style="margin-left:4px">&#128274; &#272;&#227; kh&#243;a</span>':'')+' </div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +(!locked?'<button class="btn bg2 bsm" onclick="openRepairModal(\''+r.id+'\')">' + '&#9999;&#65039;</button>':'')
      +'<button class="btn bpu bsm" onclick="printRepairBill(DB.repairs.find(function(x){return x&&x.id===\''+r.id+'\';}))">&#128424;&#65039; In</button>'
      +(!locked?'<button class="btn bd2 bsm" onclick="deleteRepair(\''+r.id+'\')">' + '&#128465;&#65039;</button>':'')
      +'</div></div>'
      +'<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'
      +'<div><b>&#128100;</b> '+r.customerName+' &#8211; '+r.phone+'</div>'
      +'<div><b>&#128187;</b> '+r.device+(r.serial?' ('+r.serial+')':'')+' </div>'
      +'<div><b>&#128296;</b> '+r.issue+'</div>'
      +'<div><b>&#128197;</b> Nh&#7853;n: '+toDisp(r.receivedDate)+'</div>'
      +delivRow
      +'<div><b>&#128176;</b> Ph&#237;: '+fmtN(repCost)+' &#273; | C&#7885;c: '+fmtN(r.deposit||0)+' &#273; | C&#242;n: <strong style="color:'+(remaining>0?'var(--er)':'var(--ok)')+'">'+fmtN(remaining)+' &#273;</strong></div>'
      +(r.techName?'<div><b>&#128104;&#8205;&#128295;</b> KTV: '+r.techName+'</div>':'')
      +(r.deliveryItems&&r.deliveryItems.length?'<div style="grid-column:1/-1"><b>&#128203;</b> '+r.deliveryItems.length+' h&#7841;ng m&#7909;c</div>':'')
      +(r.processNote&&!window._showPN(r.status)?'<div style="grid-column:1/-1"><b>&#128296;</b> '+r.processNote+'</div>':'')
      +'</div>'
      +(!locked?statusSel:'')
      +'</div>';
  }).join('');
  function mkPagin(top){
    var rl="";
    if(totalPages<=1)return '<div style="text-align:center;padding:'+(top?'6':'10')+'px 0;font-size:13px;color:var(--gy)"><b>'+total+'</b> phi&#7871;u</div>';
    return '<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:'+(top?'6':'18')+'px 0;flex-wrap:wrap">'
      +'<button class="btn bp" style="padding:7px 16px;opacity:'+(page<=1?.4:1)+'" '+(page<=1?'disabled':'')+' onclick="window._repPage='+(page-1)+';renderRepairs();'+rl+'">&#9664; Tr&#432;&#7899;c</button>'
      +'<span style="font-size:13px;color:var(--gy)">Trang <b>'+page+'</b> / '+totalPages+' &nbsp;&#183;&nbsp; <b>'+total+'</b> phi&#7871;u</span>'
      +'<button class="btn bp" style="padding:7px 16px;opacity:'+(page>=totalPages?.4:1)+'" '+(page>=totalPages?'disabled':'')+' onclick="window._repPage='+(page+1)+';renderRepairs();'+rl+'">Sau &#9654;</button>'
      +'</div>';
  }
  list.innerHTML=mkPagin(true)+cardsHTML+mkPagin(false);
};
// Override printRepairBill to inject processNote
(function(){
  var _origPRB=window.printRepairBill;
  window.printRepairBill=function(rep){
    if(!rep||!rep.processNote){return _origPRB(rep);}
    var _origDP=window.doPrint;
    window.doPrint=function(html){
      var marker='<div class="tk"';
      var inject='<div class="ir"><span>Mô tả xử lý:</span><span style="white-space:pre-wrap">'+rep.processNote+'</span></div>';
      html=html.indexOf(marker)>=0?html.replace(marker,inject+marker):html+inject;
      _origDP(html);
      window.doPrint=_origDP;
    };
    _origPRB(rep);
  };
})();
function addScrollBtns(){
  if(document.getElementById('_btnTop'))return;
  var t=document.createElement('button'),b=document.createElement('button');
  t.id='_btnTop';t.innerHTML='&#8593;';t.title='L&#234;n &#273;&#7847;u';
  b.id='_btnBot';b.innerHTML='&#8595;';b.title='Xu&#7889;ng cu&#7889;i';
  var base='position:fixed;right:18px;z-index:9999;width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:var(--pr,#5c6bc0);color:#fff;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,.25)';
  t.style.cssText=base+';bottom:80px;display:none';
  b.style.cssText=base+';bottom:28px';
  function getList(){return document.getElementById('repair-list');}
  t.onclick=function(){var l=getList();if(l)l.scrollTo({top:0,behavior:'smooth'});else window.scrollTo({top:0,behavior:'smooth'});};
  b.onclick=function(){var l=getList();if(l)l.scrollTo({top:l.scrollHeight,behavior:'smooth'});else window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});};
  document.body.appendChild(t);document.body.appendChild(b);
  function onScr(){
    var l=getList();
    var sT=l?l.scrollTop:window.scrollY;
    var sH=l?l.scrollHeight:document.body.scrollHeight;
    var cH=l?l.clientHeight:window.innerHeight;
    t.style.display=sT>200?'block':'none';
    b.style.display=(sT+cH)>=sH-50?'none':'block';
  }
  document.addEventListener('scroll',onScr,{passive:true,capture:true});
  var rl=getList();if(rl)rl.addEventListener('scroll',onScr,{passive:true});
}
injectCSS();
addScrollBtns();
var attempts=0;
var iv=setInterval(function(){
  attempts++;
  var dbOk=false;try{dbOk=typeof DB!=='undefined'&&!!DB;}catch(e){}
  if(dbOk&&window.renderRepairs&&attempts<60){
    clearInterval(iv);
    if(document.getElementById('repair-list')&&document.getElementById('repair-list').children.length>0)
      renderRepairs();
  }else if(attempts>=60)clearInterval(iv);
},500);
})();

(function(){var _origORM=window.openRepairModal;if(!_origORM)return;window.openRepairModal=function(id){var orig=DB.repairs;var safe=(DB.repairs||[]).filter(function(x){return x;});var rep=safe.find(function(x){return x.id===id;});if(!rep)return;DB.repairs=safe;try{_origORM(id);}finally{DB.repairs=orig;};};})();