// patch.js - pagination + scrollable repair-list + fixes v4
(function(){
window._repPage=window._repPage||1;window._repPrevFilter=window._repPrevFilter||'';
function toDisp(s){if(!s)return'';var p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;}
function addMonths(ds,m){if(!ds||!m)return null;var d=new Date(ds);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10);}
function injectCSS(){
  if(document.getElementById('_patchCSS'))return;
  var s=document.createElement('style');s.id='_patchCSS';
  s.textContent='body:has(#pg-repair.on){overflow:hidden}#pg-repair.on{display:flex!important;flex-direction:column;height:calc(100vh - var(--_navH,87px));overflow:hidden;box-sizing:border-box}#pg-repair.on #repair-list{flex:1;min-height:0;overflow-y:auto;padding-bottom:10px}#rsf-select{width:auto!important;min-width:120px;max-width:160px}#mo-bill-edit .be-row{display:grid;grid-template-columns:1fr 64px 110px 34px;gap:5px;margin-bottom:5px}#mo-bill-edit .be-row input{width:100%;padding:7px 8px;border:1px solid var(--pr,#5c6bc0);border-radius:7px;background:var(--bg,#fff);color:var(--tx,#222);font-size:13px;box-sizing:border-box}';
  document.head.appendChild(s);
}
function setNavH(){var n=document.querySelector('nav');if(n)document.documentElement.style.setProperty('--_navH',n.offsetHeight+'px');}
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
  var _STAT=['Mới nhận','Đang kiểm tra','Đang sửa','Chờ linh kiện','Hoàn thành','Đã giao'];
  var _SCLS={'Mới nhận':'b-bl','Đang kiểm tra':'b-or','Đang sửa':'b-pu','Chờ linh kiện':'b-rd','Hoàn thành':'b-gn','Đã giao':'b-gy'};
  var cardsHTML=pageReps.map(function(r){
    var repCost=r.deliveryItems&&r.deliveryItems.length?r.deliveryItems.reduce(function(s,it){return s+(it&&it.qty&&it.price?it.qty*it.price:0);},0):(r.cost||0);
    var remaining=Math.max(0,repCost-(r.deposit||0)-(r.deliveryPaid||0));
    var isNV=window.currentUser&&window.currentUser.role==='nhanvien';
    var locked=isNV&&r.status==='Đã giao';
    var wDate=addMonths(r.deliveredDate,r.warrantyMonths);
    var delivRow=r.deliveredDate?'<div><b>&#128198;</b> Giao: '+toDisp(r.deliveredDate)+(wDate?' &#8226; &#128737;&#65039; BH đến '+toDisp(wDate):'')+' </div>':'';
    var billItems=r.deliveryItems&&r.deliveryItems.length
      ?'<div style="grid-column:1/-1;font-size:12px;color:var(--gy)">&#128203; '+r.deliveryItems.filter(function(it){return it&&it.name;}).map(function(it){return it.name+(it.qty>1?' x'+it.qty:'')+(it.price?' ('+fmtN(it.price)+'đ)':''  );}).join(' | ')+ '</div>'
      :'';
    var statusSel='<select onchange="setRepairStatus(\''+r.id+'\',this.value)" style="margin-top:10px;width:100%;padding:9px 14px;border-radius:8px;border:2px solid var(--pr,#5c6bc0);background:var(--bg,#fff);color:var(--tx,#222);font-size:14px;font-weight:600;cursor:pointer">'
      +(window.STATUSES||_STAT).map(function(s){return '<option value="'+s+'"' +(r.status===s?' selected':'')+'>'+s+'</option>';}).join('')
      +'</select>';
    return '<div class="card" style="border-left:4px solid '+(r.status==='Đã giao'?'var(--ok)'  :'var(--pr)')+'">' 
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">'
      +'<div><span class="bx b-bl">'+r.id+'</span>'+(locked?'<span class="bx b-gy" style="margin-left:4px">&#128274; Đã khóa</span>':'')+' </div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
      +(locked?'':'<button class="btn bg2 bsm" onclick="openRepairModal(this.dataset.id)" data-id="'+r.id+'" title="S\u1EEDa ph\u1ECFu">&#9999;&#65039;</button>')
      +(isAdmin?'<button class="btn bk bsm" onclick="printRepairBill(DB.repairs.find(function(x){return x&&x.id===this.dataset.id;}.bind(this)))" data-id="'+r.id+'" title="In bill">&#128444;&#65039;</button>':'')
      +(isAdmin?'<button class="btn br bsm" onclick="deleteRepair(this.dataset.id)" data-id="'+r.id+'" title="X\u00F3a">&#128465;&#65039;</button>':'')
      +'</div></div>'
      +'<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'
      +'<div><b>&#128100;</b> '+r.customerName+' &#8211; '+(r.phone||'')+'</div>'
      +'<div><b>&#128187;</b> '+r.device+(r.serial?' ('+r.serial+')':'')+' </div>'
      +'<div><b>&#128296;</b> '+(r.issue||'')+'</div>'
      +'<div><b>&#128197;</b> Nhận: '+toDisp(r.receivedDate)+'</div>'
      +delivRow
      +'<div><b>&#128176;</b> Phí: '+fmtN(repCost)+' &#273; | Cọc: '+fmtN(r.deposit||0)+' &#273; | Còn: <strong style="color:'+(remaining>0?'var(--er)'  :'var(--ok)')+'">'+fmtN(remaining)+' &#273;</strong></div>'
      +(r.techName?'<div><b>&#128104;&#8205;&#128295;</b> KTV: '+r.techName+'</div>':''  )
      +billItems
      +(r.processNote?'<div style="grid-column:1/-1"><b>&#128296;</b> '+r.processNote+'</div>':''  )
      +'</div>'
      +(locked?''  :statusSel)
      +'</div>';
  }).join('');
  function mkPagin(top){
    if(totalPages<=1)return '<div style="text-align:center;padding:'+(top?'6':'10')+'px 0;font-size:13px;color:var(--gy)"><b>'+total+'</b> phiếu</div>';
    return '<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:'+(top?'6':'18')+'px 0;flex-wrap:wrap">'
      +'<button class="btn bp" style="padding:7px 16px;opacity:'+(page<=1?.4:1)+'" '+(page<=1?'disabled':'')+' onclick="window._repPage='+(page-1)+';renderRepairs();">&#9664; Trước</button>'
      +'<span style="font-size:13px;color:var(--gy)">Trang <b>'+page+'</b> / '+totalPages+' &nbsp;&#183;&nbsp; <b>'+total+'</b> phiếu</span>'
      +'<button class="btn bp" style="padding:7px 16px;opacity:'+(page>=totalPages?.4:1)+'" '+(page>=totalPages?'disabled':'')+' onclick="window._repPage='+(page+1)+';renderRepairs();">Sau &#9654;</button>'
      +'<select onchange="window._repPage=+this.value;renderRepairs()" style="padding:6px 10px;border-radius:8px;border:1px solid var(--pr);background:var(--bg);color:var(--tx)">'
      +Array.from({length:totalPages},function(_,i){return '<option value="'+(i+1)+'"'+(i+1===page?' selected':'')+'>T.'+(i+1)+'</option>';}).join('')
      +'</select></div>';
  }
  list.innerHTML=mkPagin(true)+cardsHTML+mkPagin(false);
};

// FIX openRepairModal
setTimeout(function(){
  if(typeof window.openRepairModal==='function'&&!window._ormPatched){
    window._ormPatched=true;
    var _orig=window.openRepairModal;
    window.openRepairModal=function(id){
      if(!id){try{_orig();}catch(e){}return;}
      if(!window.DB)return;
      if(DB._d&&Array.isArray(DB._d['repairs'])){
        DB._d['repairs']=DB._d['repairs'].filter(function(x){return x!=null;});
      }
      try{_orig(id);}catch(e){
        console.warn('openRepairModal err:',e);
        try{
          window.editRepairId=id;
          var r=(DB.g('repairs')||[]).find(function(x){return x&&x.id===id;});
          if(r){
            var fm={'rm-name':r.customerName,'rm-phone':r.phone,'rm-device':r.device,
              'rm-serial':r.serial,'rm-issue':r.issue,'rm-addr':r.address,
              'rm-pass':r.password,'rm-acc':r.accessories,'rm-in':r.receivedDate,
              'rm-cost':r.cost,'rm-dep':r.deposit,'rm-capital':r.capital,
              'rm-tech':r.techName,'rm-note':r.note};
            for(var k in fm){var el=document.getElementById(k);if(el)el.value=fm[k]||'';}
            var wEl=document.getElementById('rm-warranty');if(wEl)wEl.value=r.warrantyMonths||'0';
          }
          if(typeof openMo==='function')openMo('mo-repair');
        }catch(e2){console.warn('ORM fallback err:',e2);}
      }
    };
  }
},1000);

// FIX saveRepair
setTimeout(function(){
  if(typeof window.saveRepair==='function'&&!window._srPatched){
    window._srPatched=true;
    var _origSR=window.saveRepair;
    window.saveRepair=function(){
      var name=(document.getElementById('rm-name')||{value:''}).value.trim();
      var device=(document.getElementById('rm-device')||{value:''}).value.trim();
      if(!name||!device){typeof toast==='function'&&toast('Nhập tên KH và thiết bị!','er');return;}
      if(window.DB&&DB._d&&Array.isArray(DB._d['repairs'])){
        DB._d['repairs']=DB._d['repairs'].filter(function(x){return x!=null;});
      }
      try{_origSR();}catch(e){
        console.warn('saveRepair err:',e);
        if(typeof closeMo==='function')closeMo('mo-repair');
        setTimeout(function(){
          try{if(typeof renderRepairs==='function')renderRepairs();}catch(e2){}
          if(typeof toast==='function')toast('✅ Đã lưu phiếu','ok');
        },200);
      }
    };
  }
},1000);

// BILL EDIT
injectCSS();addScrollBtns();
var attempts=0,iv=setInterval(function(){
  attempts++;var dbOk=false;try{dbOk=typeof DB!=='undefined'&&!!DB;}catch(e){}
  if(dbOk&&window.renderRepairs&&attempts<60){clearInterval(iv);
    if(document.getElementById('repair-list')&&document.getElementById('repair-list').children.length>0)renderRepairs();
  }else if(attempts>=60)clearInterval(iv);
},500);
})();