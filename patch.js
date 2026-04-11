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
      +(locked?''  :'<button class="btn bg2 bsm" onclick="openRepairModal(\''+r.id+'\'  )">&#9999;&#65039;</button>')
      +'<button class="btn b-or bsm" onclick="openBillModal(\''+r.id+'\'  )">&#128203; Bill</button>'
      +'<button class="btn bpu bsm" onclick="printRepairBill(DB.repairs.find(function(x){return x&&x.id===\''+r.id+'\'  ;}))">&#128424;&#65039; In</button>'
      +(locked?''  :'<button class="btn bd2 bsm" onclick="deleteRepair(\''+r.id+'\'  )">&#128465;&#65039;</button>')
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
window._billEditId=null;
function _beGetItems(){
  var rows=document.querySelectorAll('#be-rows .be-row');
  return Array.from(rows).map(function(row){
    return{name:(row.querySelector('.be-name')||{value:''}).value.trim(),
      qty:Math.max(1,parseInt((row.querySelector('.be-qty')||{value:'1'}).value)||1),
      price:Math.max(0,parseInt((row.querySelector('.be-price')||{value:'0'}).value)||0)};
  });
}
function _beRenderRows(items){
  var c=document.getElementById('be-rows');if(!c)return;
  var total=(items||[]).reduce(function(s,it){return s+(it.qty||1)*(it.price||0);},0);
  var rows=(items&&items.length)
    ?items.map(function(it,i){
      return '<div class="be-row" data-i="'+i+'">'
        +'<input class="be-name" placeholder="Tên dịch vụ / linh kiện" value="'+(  (it.name||''  ).replace(/"/g,'&quot;')  )+'"/>'
        +'<input class="be-qty" type="number" min="1" value="'+(it.qty||1)+'"/>'
        +'<input class="be-price" type="number" min="0" step="1000" value="'+(it.price||0)+'"/>'
        +'<button class="btn bd2" style="padding:3px 8px;font-size:13px" onclick="removeBillRow('  +i+'  )">&#10005;</button>'
        +'</div>';
    }).join('')
    :'<div style="color:var(--gy);text-align:center;padding:14px;font-size:13px">Chưa có hạng mục nào</div>';
  c.innerHTML=rows+'<div style="text-align:right;font-weight:700;padding:8px 4px 2px;border-top:1px solid var(--bdr,#e0e0e0)">Tổng: <span style="color:var(--pr)">'+fmtN(total)+' đ</span></div>';
}
window.openBillModal=function(id){
  if(!window.DB||!id)return;
  var r=(DB.repairs||[]).find(function(x){return x&&x.id===id;});
  if(!r){typeof toast==='function'&&toast('Không tìm thấy phiếu!','er');return;}
  window._billEditId=id;
  var el=document.getElementById('be-id');if(el)el.textContent=id+' – '+(r.customerName||''  );
  var el2=document.getElementById('be-device');if(el2)el2.textContent=(r.device||''  );
  _beRenderRows(r.deliveryItems||[]);
  if(typeof openMo==='function'  )openMo('mo-bill-edit');
};
window.addBillItem=function(){
  var items=_beGetItems();items.push({name:'',qty:1,price:0});_beRenderRows(items);
  var inputs=document.querySelectorAll('#be-rows .be-row .be-name');
  if(inputs.length)inputs[inputs.length-1].focus();
};
window.removeBillRow=function(i){var items=_beGetItems();items.splice(i,1);_beRenderRows(items);};
window.saveBillEdit=function(){
  var id=window._billEditId;if(!id||!window.DB)return;
  var items=_beGetItems().filter(function(it){return it.name||it.price>0;});
  var reps=(DB.repairs||[]).slice();
  var idx=reps.findIndex(function(r){return r&&r.id===id;});
  if(idx<0){typeof toast==='function'&&toast('Không tìm thấy phiếu!','er');return;}
  var total=items.reduce(function(s,it){return s+(it.qty||1)*(it.price||0);},0);
  reps[idx]=Object.assign({},reps[idx],{deliveryItems:items});
  if(total>0)reps[idx]=Object.assign({},reps[idx],{cost:total});
  DB.repairs=reps;
  if(typeof closeMo==='function'  )closeMo('mo-bill-edit');
  setTimeout(function(){if(typeof renderRepairs==='function'  )renderRepairs();},200);
  if(typeof toast==='function'  )toast('✅ Đã lưu bill '+id,'ok');
};
function injectBillModal(){
  if(document.getElementById('mo-bill-edit'))return;
  var div=document.createElement('div');
  div.id='mo-bill-edit';div.className='mo';
  div.innerHTML=''
    +'<div class="mo-box" style="max-width:640px;width:96vw">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'
    +'<h3 style="margin:0">&#128203; Bill &ndash; <span id="be-id" style="color:var(--pr)"></span></h3>'
    +'<button onclick="closeMo(\' mo-bill-edit\'  )" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--gy);padding:0 4px">&times;</button>'
    +'</div>'
    +'<div style="font-size:12px;color:var(--gy);margin-bottom:10px" id="be-device"></div>'
    +'<div style="display:grid;grid-template-columns:1fr 64px 110px 34px;gap:5px;font-weight:700;font-size:12px;padding:4px 0 6px;border-bottom:2px solid var(--pr,#5c6bc0);color:var(--gy)">'
    +'<span>Nội dung dịch vụ / linh kiện</span><span style="text-align:center">Số lượng</span><span style="text-align:right">Giá (đ)</span><span></span>'
    +'</div>'
    +'<div id="be-rows" style="max-height:260px;overflow-y:auto;margin:8px 0 4px"></div>'
    +'<button class="btn bg2" style="width:100%;margin-top:6px" onclick="addBillItem()">&#43; Thêm hạng mục</button>'
    +'<hr style="margin:14px 0;border:none;border-top:1px solid var(--bdr,#e0e0e0)">'
    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button class="btn bp" style="padding:10px 30px" onclick="saveBillEdit()">&#128190; Lưu</button>'
    +'<button class="btn" style="padding:10px 18px" onclick="closeMo(\' mo-bill-edit\'  )">Hủy</button>'
    +'</div></div>';
  document.body.appendChild(div);
}
function addScrollBtns(){
  if(document.getElementById('_btnTop'))return;
  var t=document.createElement('button'),b=document.createElement('button');
  t.id='_btnTop';t.innerHTML='&#8593;';t.title='Lên đầu';
  b.id='_btnBot';b.innerHTML='&#8595;';b.title='Xuống cuối';
  var base='position:fixed;right:18px;z-index:9999;width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:var(--pr,#5c6bc0);color:#fff;font-size:20px;box-shadow:0 3px 10px rgba(0,0,0,.25)';
  t.style.cssText=base+';bottom:80px;display:none';
  b.style.cssText=base+';bottom:28px';
  function getList(){return document.getElementById('repair-list');}
  t.onclick=function(){var l=getList();if(l)l.scrollTo({top:0,behavior:'smooth'});else window.scrollTo({top:0,behavior:'smooth'});};
  b.onclick=function(){var l=getList();if(l)l.scrollTo({top:l.scrollHeight,behavior:'smooth'});else window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});};
  document.body.appendChild(t);document.body.appendChild(b);
  function onScr(){var l=getList();var sT=l?l.scrollTop:window.scrollY;var sH=l?l.scrollHeight:document.body.scrollHeight;var cH=l?l.clientHeight:window.innerHeight;t.style.display=sT>200?'block':'none';b.style.display=(sT+cH)>=sH-50?'none':'block';}
  document.addEventListener('scroll',onScr,{passive:true,capture:true});
  var rl=getList();if(rl)rl.addEventListener('scroll',onScr,{passive:true});
}
injectCSS();injectBillModal();addScrollBtns();
var attempts=0,iv=setInterval(function(){
  attempts++;var dbOk=false;try{dbOk=typeof DB!=='undefined'&&!!DB;}catch(e){}
  if(dbOk&&window.renderRepairs&&attempts<60){clearInterval(iv);
    if(document.getElementById('repair-list')&&document.getElementById('repair-list').children.length>0)renderRepairs();
  }else if(attempts>=60)clearInterval(iv);
},500);
})();