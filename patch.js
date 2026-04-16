// patch.js - v7: pagination + Giao may button + payment type + ban kem + auto Da giao
(function(){
  window._repPage=window._repPage||1;window._repPrevFilter=window._repPrevFilter||'';
  function toDisp(s){if(!s)return'';var p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;}
  function addMonths(ds,m){if(!ds||!m)return null;var d=new Date(ds);d.setMonth(d.getMonth()+m);return d.toISOString().slice(0,10);}
  function injectCSS(){
    if(document.getElementById('_patchCSS'))return;
    var s=document.createElement('style');s.id='_patchCSS';
    s.textContent='body:has(#pg-repair.on){overflow:hidden}#pg-repair.on{display:flex!important;flex-direction:column;height:calc(100vh - var(--_navH,87px));overflow:hidden;box-sizing:border-box}#pg-repair.on #repair-list{flex:1;min-height:0;overflow-y:auto;padding-bottom:10px}#rsf-select{width:auto!important;min-width:120px;max-width:160px}#mo-bill-edit .be-row{display:grid;grid-template-columns:1fr 64px 110px 34px;gap:5px;margin-bottom:5px}#mo-bill-edit .be-row input{width:100%;padding:7px 8px;border:1px solid var(--pr,#5c6bc0);border-radius:7px;background:var(--bg,#fff);color:var(--tx,#222);font-size:13px;box-sizing:border-box}#mo-bill-edit label{color:#111!important;font-size:13px!important;font-weight:700!important;}';
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
    var _STAT=['M&#7899;i nh&#7853;n','&#272;ang ki&#7875;m tra','&#272;ang s&#7917;a','Ch&#7901; linh ki&#7879;n','Ho&#224;n th&#224;nh','&#272;&#227; giao'];
    var _SCLS={'Mới nhận':'b-bl','Đang kiểm tra':'b-or','Đang sửa':'b-pu','Chờ linh kiện':'b-rd','Hoàn thành':'b-gn','Đã giao':'b-gy'};
    var cardsHTML=pageReps.map(function(r){
      var repCost=r.deliveryItems&&r.deliveryItems.length?r.deliveryItems.reduce(function(s,it){return s+(it&&it.qty&&it.price?it.qty*it.price:0);},0):(r.cost||0);
      var bkCost=r.banKemItems&&r.banKemItems.length?r.banKemItems.reduce(function(s,it){return s+(it&&it.qty&&it.price?it.qty*it.price:0);},0):0;
      var remaining=Math.max(0,repCost+bkCost-(r.deposit||0)-(r.deliveryPaid||0));
      var isNV=window.currentUser&&window.currentUser.role==='nhanvien';
      var isAdmin=!isNV;
      var locked=isNV&&r.status==='Đã giao';
      var canDeliver=r.status!=='Đã giao';
      var wDate=addMonths(r.deliveredDate,r.warrantyMonths);
      var delivRow=r.deliveredDate?'<div><b>&#128198;</b> Giao: '+toDisp(r.deliveredDate)+(wDate?' &#8226; &#128737;&#65039; BH đến '+toDisp(wDate):'')+' </div>':'';
      var billItems=r.deliveryItems&&r.deliveryItems.length?'<div style="grid-column:1/-1;font-size:12px;color:var(--gy)">&#128203; '+r.deliveryItems.filter(function(it){return it&&it.name;}).map(function(it){return it.name+(it.qty>1?' x'+it.qty:'')+(it.price?' ('+fmtN(it.price)+'đ)':'');}).join(' | ')+'</div>':'';
      var banKemRow=r.banKemItems&&r.banKemItems.length?'<div style="grid-column:1/-1;font-size:12px;color:var(--gy)">🛒 Bán kèm: '+r.banKemItems.map(function(it){return it.name+(it.qty>1?' x'+it.qty:'')+(it.price?' ('+fmtN(it.price)+'đ)':'');}).join(' | ')+'</div>':'';
      var payBadge=r.paymentType&&r.status==='Đã giao'?'<span class="bx b-gn" style="margin-left:4px;font-size:10px">'+r.paymentType+'</span>':'';
      var statusSel='<select onchange="setRepairStatus(\u0027'+r.id+'\u0027,this.value)" style="margin-top:10px;width:100%;padding:9px 14px;border-radius:8px;border:2px solid var(--pr,#5c6bc0);background:var(--bg,#fff);color:var(--tx,#222);font-size:14px;font-weight:600;cursor:pointer">'+(window.STATUSES||_STAT).map(function(s){return'<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>';}).join('')+'</select>';
      return '<div class="card" style="border-left:4px solid '+(r.status==='Đã giao'?'var(--ok)':'var(--pr)')+'">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">'
        +'<div><span class="bx b-bl">'+r.id+'</span>'+payBadge+(locked?'<span class="bx b-gy" style="margin-left:4px">&#128274; Đã khóa</span>':'')+' </div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
        +(canDeliver&&!locked?'<button class="btn bs bsm" onclick="openDeliverModal(this.dataset.id)" data-id="'+r.id+'">&#128230; Giao máy</button>':'')
        +(locked?'':'<button class="btn bg2 bsm" onclick="openRepairModal(this.dataset.id)" data-id="'+r.id+'" title="Sửa phiếu">&#9999;&#65039;</button>')
        +(isAdmin?'<button class="btn bk bsm" onclick="printRepairBill(DB.repairs.find(function(x){return x&&x.id===this.dataset.id;}.bind(this)))" data-id="'+r.id+'" title="In bill">&#128444;&#65039;</button>':'')
        +(isAdmin?'<button class="btn br bsm" onclick="deleteRepair(this.dataset.id)" data-id="'+r.id+'" title="Xóa">&#128465;&#65039;</button>':'')
        +'</div></div>'
        +'<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px">'
        +'<div><b>&#128100;</b> '+r.customerName+' &#8211; '+(r.phone||'')+'</div>'
        +'<div><b>&#128187;</b> '+r.device+(r.serial?' ('+r.serial+')':'')+' </div>'
        +'<div><b>&#128296;</b> '+(r.issue||'')+'</div>'
        +'<div><b>&#128197;</b> Nhận: '+toDisp(r.receivedDate)+'</div>'
        +delivRow
        +'<div><b>&#128176;</b> Phí: '+fmtN(repCost)+' đ'+(bkCost?' | Bán kèm: '+fmtN(bkCost)+' đ':'')+' | Cọc: '+fmtN(r.deposit||0)+' đ | Còn: <strong style="color:'+(remaining>0?'var(--er)':'var(--ok)')+'">'+fmtN(remaining)+' đ</strong></div>'
        +(r.techName?'<div><b>&#128104;&#8205;&#128295;</b> KTV: '+r.techName+'</div>':'')
        +billItems+banKemRow
        +(r.processNote?'<div style="grid-column:1/-1"><b>&#128296;</b> '+r.processNote+'</div>':'')
        +'</div>'
        +(locked?'':statusSel)
        +'</div>';
    }).join('');
    function mkPagin(top){
      if(totalPages<=1)return'<div style="text-align:center;padding:'+(top?'6':'10')+'px 0;font-size:13px;color:var(--gy)"><b>'+total+'</b> phiếu</div>';
      return'<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:'+(top?'6':'18')+'px 0;flex-wrap:wrap">'
        +'<button class="btn bp" style="padding:7px 16px;opacity:'+(page<=1?.4:1)+'" '+(page<=1?'disabled':'')+' onclick="window._repPage='+(page-1)+';renderRepairs();">&#9664; Trước</button>'
        +'<span style="font-size:13px;color:var(--gy)">Trang <b>'+page+'</b> / '+totalPages+' &nbsp;&#183;&nbsp; <b>'+total+'</b> phiếu</span>'
        +'<button class="btn bp" style="padding:7px 16px;opacity:'+(page>=totalPages?.4:1)+'" '+(page>=totalPages?'disabled':'')+' onclick="window._repPage='+(page+1)+';renderRepairs();">Sau &#9654;</button>'
        +'<select onchange="window._repPage=+this.value;renderRepairs()" style="padding:6px 10px;border-radius:8px;border:1px solid var(--pr);background:var(--bg);color:var(--tx)">'
        +Array.from({length:totalPages},function(_,i){return'<option value="'+(i+1)+'"'+(i+1===page?' selected':'')+'>T.'+(i+1)+'</option>';}).join('')
        +'</select></div>';
    }
    list.innerHTML=mkPagin(true)+cardsHTML+mkPagin(false);
  };
  setTimeout(function(){
    if(typeof window.openRepairModal==='function'&&!window._ormPatched){
      window._ormPatched=true;
      var _orig=window.openRepairModal;
      window.openRepairModal=function(id){
        if(!id){try{_orig();}catch(e){}return;}
        if(DB._d&&Array.isArray(DB._d['repairs'])){DB._d['repairs']=DB._d['repairs'].filter(function(x){return x!=null;});}
        try{_orig(id);}catch(e){
          console.warn('openRepairModal err:',e);
          try{
            window.editRepairId=id;
            var r=(DB.g('repairs')||[]).find(function(x){return x&&x.id===id;});
            if(r){var fm={'rm-name':r.customerName,'rm-phone':r.phone,'rm-device':r.device,'rm-serial':r.serial,'rm-issue':r.issue,'rm-addr':r.address,'rm-pass':r.password,'rm-acc':r.accessories,'rm-in':r.receivedDate,'rm-cost':r.cost,'rm-dep':r.deposit,'rm-capital':r.capital,'rm-tech':r.techName,'rm-note':r.note};for(var k in fm){var el=document.getElementById(k);if(el)el.value=fm[k]||'';}var wEl=document.getElementById('rm-warranty');if(wEl)wEl.value=r.warrantyMonths||'0';}
            if(typeof openMo==='function')openMo('mo-repair');
          }catch(e2){console.warn('ORM fallback err:',e2);}
        }
      };
    }
  },1000);
  setTimeout(function(){
    if(typeof window.saveRepair==='function'&&!window._srPatched){
      window._srPatched=true;
      var _origSR=window.saveRepair;
      window.saveRepair=function(){
        var name=(document.getElementById('rm-name')||{value:''}).value.trim();
        var device=(document.getElementById('rm-device')||{value:''}).value.trim();
        if(!name||!device){typeof toast==='function'&&toast('Nhập tên KH và thiết bị!','er');return;}
        if(window.DB&&DB._d&&Array.isArray(DB._d['repairs'])){DB._d['repairs']=DB._d['repairs'].filter(function(x){return x!=null;});}
        try{_origSR();}catch(e){console.warn('saveRepair err:',e);if(typeof closeMo==='function')closeMo('mo-repair');setTimeout(function(){try{if(typeof renderRepairs==='function')renderRepairs();}catch(e2){}if(typeof toast==='function')toast('✅ Đã lưu phiếu','ok');},200);}
      };
    }
  },1000);
  function getBkItems(){
    var rows=document.querySelectorAll('#dv-bk-items .dv-bk-row');
    var items=[];
    rows.forEach(function(row){
      var name=(row.querySelector('.bk-name')||{value:''}).value.trim();
      var qty=+(row.querySelector('.bk-qty')||{value:1}).value||1;
      var price=+(row.querySelector('.bk-price')||{value:0}).value||0;
      if(name)items.push({name:name,qty:qty,price:price});
    });
    return items;
  }
  window.calcBkTotal=function(){
    var rows=document.querySelectorAll('#dv-bk-items .dv-bk-row');
    var total=0;
    rows.forEach(function(row){
      var qty=+(row.querySelector('.bk-qty')||{value:1}).value||1;
      var price=+(row.querySelector('.bk-price')||{value:0}).value||0;
      var tot=qty*price;total+=tot;
      var el=row.querySelector('.bk-tot');if(el)el.textContent=fmtN(tot)+'đ';
    });
    var el=document.getElementById('dv-bk-total');if(el)el.textContent=fmtN(total)+' đ';
    return total;
  };
  function addBanKemRow(name,qty,price){
    var list=document.getElementById('dv-bk-items');if(!list)return;
    var row=document.createElement('div');row.className='dv-bk-row di';row.style.marginBottom='4px';
    row.innerHTML='<input type="text" class="bk-name" value="'+name+'" placeholder="Tên sản phẩm" style="padding:5px 7px;border:1px solid var(--pr);border-radius:6px;font-size:12px;width:100%">'
      +'<input type="number" class="bk-qty" value="'+qty+'" min="1" style="padding:5px 7px;border:1px solid var(--pr);border-radius:6px;font-size:12px;width:100%" oninput="calcBkTotal()">'
      +'<input type="number" class="bk-price" value="'+price+'" min="0" style="padding:5px 7px;border:1px solid var(--pr);border-radius:6px;font-size:12px;width:100%" oninput="calcBkTotal()">'
      +'<span class="bk-tot" style="text-align:right;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:flex-end">'+fmtN(qty*price)+'đ</span>'
      +'<button onclick="this.closest(\u0027.dv-bk-row\u0027).remove();calcBkTotal();" style="background:var(--er);color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;flex-shrink:0">✕</button>';
    list.appendChild(row);
  }
  window.addBanKemItem=function(prodId){
    if(!prodId)return;
    var prod=(window.DB&&DB.products||[]).find(function(p){return p.id===prodId;});
    if(!prod)return;
    addBanKemRow(prod.name,1,prod.price);
    var sel=document.getElementById('dv-bk-pick');if(sel)sel.value='';
    calcBkTotal();
  };
  window.addBanKemManual=function(){addBanKemRow('',1,0);};
  function populateBkPick(){
    var sel=document.getElementById('dv-bk-pick');if(!sel)return;
    var prods=(window.DB&&DB.products)||[];
    sel.innerHTML='<option value="">-- Chọn SP bán kèm --</option>'+prods.map(function(p){return'<option value="'+p.id+'">'+p.name+' - '+fmtN(p.price)+'đ</option>';}).join('');
  }
  function injectDeliverExtras(){
    var mo=document.getElementById('mo-deliver');if(!mo||mo.dataset.pv2)return;mo.dataset.pv2='1';
    var dvProdPick=document.getElementById('dv-prod-pick');
    if(dvProdPick){
      var wrapper=dvProdPick.closest('.fg')?dvProdPick.closest('.fg').parentElement:dvProdPick.parentElement;
      wrapper.insertAdjacentHTML('afterend','<div id="dv-bk-section" style="margin-bottom:14px"><div style="font-size:12px;font-weight:700;color:var(--pr-d);margin-bottom:6px;padding-top:10px;border-top:1px dashed var(--bd)">🛒 Sản phẩm bán kèm (tuỳ chọn):</div><div class="di" style="font-size:10px;font-weight:700;color:var(--gy);text-transform:uppercase;margin-bottom:3px"><span>Sản phẩm</span><span>SL</span><span>Đơn giá (đ)</span><span>Thành tiền</span><span></span></div><div id="dv-bk-items"></div><div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:6px"><select id="dv-bk-pick" onchange="addBanKemItem(this.value)" style="width:100%;padding:8px;border:1px solid var(--pr);border-radius:8px;background:var(--bg);color:var(--tx);font-size:13px"><option value="">-- Chọn SP bán kèm --</option></select><button class="btn bg2 bsm" onclick="addBanKemManual()" style="white-space:nowrap">+ Tự nhập</button></div><div class="tot"><span>Tổng bán kèm</span><strong id="dv-bk-total">0 đ</strong></div></div>');
    }
    var dvPaid=document.getElementById('dv-paid');
    if(dvPaid){
      var paidTot=dvPaid.closest('.tot')||dvPaid.parentElement;
      paidTot.insertAdjacentHTML('beforebegin','<div class="tot" style="padding-top:10px;border-top:1px solid var(--bd)"><span style="font-weight:700">Hình thức thanh toán</span><select id="dv-paytype" style="padding:7px 14px;border:1px solid var(--pr);border-radius:8px;background:var(--bg);color:var(--tx);font-size:14px;font-weight:600"><option value="Tiền mặt">💵 Tiền mặt</option><option value="Chuyển khoản">🏦 Chuyển khoản</option><option value="Công nợ">📋 Công nợ</option></select></div>');
    }
  }
  setTimeout(function(){
    if(typeof window.openDeliverModal==='function'&&!window._odmPatched){
      window._odmPatched=true;
      var _orig=window.openDeliverModal;
      window.openDeliverModal=function(id){
        injectDeliverExtras();
        _orig(id);
        var bkList=document.getElementById('dv-bk-items');if(bkList)bkList.innerHTML='';
        var bkTot=document.getElementById('dv-bk-total');if(bkTot)bkTot.textContent='0 đ';
        var payType=document.getElementById('dv-paytype');if(payType)payType.value='Tiền mặt';
        populateBkPick();
      };
    }
  },1500);
  setTimeout(function(){
    if(typeof window.saveDeliver==='function'&&!window._sdPatched){
      window._sdPatched=true;
      var _origSD=window.saveDeliver;
      window.saveDeliver=function(){
        var repId=(document.getElementById('dv-repid')||{value:''}).value;
        var payType=(document.getElementById('dv-paytype')||{value:'Tiền mặt'}).value;
        var bkItems=getBkItems();
        try{_origSD();}catch(e){console.warn('saveDeliver err:',e);}
        setTimeout(function(){
          var reps=DB.repairs;
          var rep=reps.find(function(r){return r&&r.id===repId;});
          if(!rep)return;
          rep.status='Đã giao';
          rep.paymentType=payType;
          if(bkItems.length)rep.banKemItems=bkItems;
          DB.repairs=reps;
          if(payType==='Công nợ'){
            var repCost=rep.deliveryItems&&rep.deliveryItems.length?rep.deliveryItems.reduce(function(s,it){return s+(it&&it.qty&&it.price?it.qty*it.price:0);},0):(+rep.cost||0);
            var bkTotal=bkItems.reduce(function(s,it){return s+it.qty*it.price;},0);
            var dep=+rep.deposit||0,dvPd=+rep.deliveryPaid||0;
            var debtAmt=repCost+bkTotal-dep-dvPd;
            if(debtAmt>0){
              var debts=DB.debts;
              debts.unshift({id:genId('CN'),customerName:rep.customerName,phone:rep.phone||'',amount:debtAmt,paid:0,remaining:debtAmt,description:'Sửa '+rep.id+(rep.device?' - '+rep.device:''),date:rep.deliveredDate||todayISO(),status:'Còn nợ'});
              DB.debts=debts;
              toast('📋 Đã tạo công nợ '+fmtN(debtAmt)+'đ cho '+rep.customerName,'ok');
            }
          }
          if(typeof renderRepairs==='function')renderRepairs();
        },600);
      };
    }
  },1500);
  function injectBillEditModal(){
    if(document.getElementById('mo-bill-edit'))return;
    var inp='style="padding:7px 10px;border:1px solid var(--pr,#5c6bc0);border-radius:7px;background:var(--bg,#fff);color:var(--tx,#222);font-size:13px;width:100%;box-sizing:border-box"';
    var ta=inp.replace('border-box"','border-box;resize:vertical"');
    var lbl='style="display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600;color:#111"';
    var r2='style="display:grid;grid-template-columns:1fr 1fr;gap:10px"';
    var mo=document.createElement('div');mo.id='mo-bill-edit';mo.className='mo';
    mo.innerHTML='<div class="mo-box" style="max-width:520px;width:96%"><div class="mo-hd" style="display:flex;justify-content:space-between;align-items:center"><span>✏️ Nội dung bill in khách</span><button class="cls" onclick="closeMo(\u0027mo-bill-edit\u0027)" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--tx)">×</button></div><div class="mo-bd" style="max-height:65vh;overflow-y:auto;display:grid;gap:10px"><label '+lbl+'><span>🏠 Tên cửa hàng</span><input id="set-shopname" type="text" '+inp+' placeholder="CỬA HÀNG LAPTOP 24H"></label><label '+lbl+'><span>💬 Slogan</span><input id="set-slogan" type="text" '+inp+' placeholder="Chuyên: Mua bán, sửa chữa Laptop..."></label><label '+lbl+'><span>📍 Địa chỉ</span><input id="set-addr" type="text" '+inp+' placeholder="Vĩnh Long"></label><div '+r2+'><label '+lbl+'><span>📞 ĐT</span><input id="set-phone" type="text" '+inp+' placeholder="0xxx.xxx.xxx"></label><label '+lbl+'><span>📱 FB/Zalo</span><input id="set-social" type="text" '+inp+' placeholder="fb.com/..."></label></div><div '+r2+'><label '+lbl+'><span>🌐 Website</span><input id="set-web" type="text" '+inp+' placeholder="laptop24h.vn"></label><label '+lbl+'><span>🖼 Logo (emoji)</span><input id="set-logo" type="text" '+inp+' placeholder="💻" maxlength="4"></label></div><hr style="border:none;border-top:1px solid var(--br,#e0e0e0)"><label '+lbl+'><span>📝 Lời cảm ơn bill bán hàng</span><textarea id="set-footer-sale" rows="2" '+ta+' placeholder="Cảm ơn quý khách đã tin tưởng..."></textarea></label><label '+lbl+'><span>📝 Lời cảm ơn bill sửa chữa</span><textarea id="set-footer-repair" rows="2" '+ta+' placeholder="Cảm ơn quý khách đã tin tưởng..."></textarea></label><label '+lbl+'><span>📋 ĐK bảo hành (bán hàng)</span><textarea id="set-wterm-sale" rows="2" '+ta+' placeholder="Sản phẩm được bảo hành..."></textarea></label><label '+lbl+'><span>📋 ĐK bảo hành (sửa chữa)</span><textarea id="set-wterm-repair" rows="2" '+ta+' placeholder="Linh kiện được bảo hành..."></textarea></label><div style="display:grid;grid-template-columns:1fr 90px 110px;gap:10px"><label '+lbl+'><span>🔤 Font</span><select id="set-font" style="padding:7px 8px;border:1px solid var(--pr);border-radius:7px;background:var(--bg);color:var(--tx);font-size:13px;width:100%"><option value="Arial, sans-serif">Arial</option><option value="Times New Roman, serif">Times New Roman</option><option value="Roboto, sans-serif">Roboto</option><option value="Courier New, monospace">Courier</option></select></label><label '+lbl+'><span>📏 Cỡ chữ</span><input id="set-fontsize" type="text" '+inp+' value="11px"></label><label '+lbl+'><span>🎨 Màu TH</span><input id="set-billcolor" type="color" value="#1e3a8a" style="width:100%;height:38px;padding:3px 6px;border:1px solid var(--pr);border-radius:7px;cursor:pointer"></label></div></div><div class="mo-ft" style="display:flex;gap:8px;justify-content:flex-end;padding-top:12px"><button class="btn" onclick="closeMo(\u0027mo-bill-edit\u0027)" style="padding:8px 20px">Hủy</button><button class="btn bp" onclick="if(typeof saveBillSettings===\u0027function\u0027){saveBillSettings();closeMo(\u0027mo-bill-edit\u0027);if(typeof toast===\u0027function\u0027)toast(\u0027✅ Đã lưu cài đặt bill\u0027,\u0027ok\u0027);}" style="padding:8px 20px">💾 Lưu</button></div></div>';
    document.body.appendChild(mo);
  }
  function openBillEdit(){injectBillEditModal();if(typeof loadBillSettings==='function')loadBillSettings();if(typeof openMo==='function')openMo('mo-bill-edit');}
  function injectBillEditBtn(){
    var rp=document.getElementById('pg-repair');
    if(rp&&!document.getElementById('btn-bill-edit')){
      var eb=Array.from(rp.querySelectorAll('button')).find(function(b){return b.textContent.includes('Excel');});
      if(eb){var btn=document.createElement('button');btn.id='btn-bill-edit';btn.className='btn bk bsm';btn.innerHTML='✏️ Nội dung bill';btn.onclick=openBillEdit;eb.insertAdjacentElement('afterend',btn);}
    }
  }
  injectCSS();setTimeout(injectBillEditBtn,1500);
  var attempts=0,iv=setInterval(function(){
    attempts++;var dbOk=false;try{dbOk=typeof DB!=='undefined'&&!!DB;}catch(e){}
    if(dbOk&&window.renderRepairs&&attempts<60){clearInterval(iv);if(document.getElementById('repair-list')&&document.getElementById('repair-list').children.length>0)renderRepairs();}
    else if(attempts>=60)clearInterval(iv);
  },500);
})();

// v21: Sale product picker uses NAME not code; bill edit modal robustness
(function(){
  // ── SALE PAGE: product picker searches/shows by product name ────────────
  var _ou = window.updCode;
  if(_ou) window.updCode = function(i, v){
    var ps = (window.DB && DB.products)||[];
    if(v && ps.length){
      var p = ps.find(function(p){ return p.name.toLowerCase()===v.toLowerCase(); });
      if(p) return _ou(i, p.id);
    }
    return _ou(i, v);
  };

  function patchSalePicker(){
    var w = document.getElementById('bill-items');
    if(!w) return;
    var ps = (window.DB && DB.products)||[];
    if(!ps.length) return;
    var opts = ps.map(function(p){ return '<option value="'+p.name+'">'+p.id+'</option>'; }).join('');
    w.querySelectorAll('.bi').forEach(function(r){
      var ci = r.querySelector('input[type=text]:not(.ro-inp)');
      var ni = r.querySelector('input.ro-inp');
      var dl = r.querySelector('datalist');
      if(!ci||!dl) return;
      dl.innerHTML = opts;
      ci.placeholder = 'Tên SP';
      if(ci.value){
        var byCode = ps.find(function(p){ return p.id===ci.value; });
        if(byCode) ci.value = byCode.name;
      }
      if(ni){
        ni.placeholder = 'Mã SP';
        var byName = ps.find(function(p){ return p.name.toLowerCase()===ci.value.toLowerCase(); });
        ni.value = byName ? byName.id : '';
      }
    });
    var hdr = w.previousElementSibling;
    if(hdr && !hdr.dataset.v21hdr){
      hdr.dataset.v21hdr = '1';
      var spans = hdr.querySelectorAll('span');
      if(spans[0] && spans[0].textContent.trim()==='Mã SP') spans[0].textContent = 'Tên SP';
      if(spans[1] && spans[1].textContent.trim()==='Tên SP') spans[1].textContent = 'Mã SP';
    }
  }

  var _ori = window.renderItems;
  if(_ori) window.renderItems = function(){ _ori(); patchSalePicker(); };
  setTimeout(patchSalePicker, 2000);

  // ── BILL EDIT MODAL: global save handler + ensure overlay on open ───────
  window._saveBillEdit = function(){
    if(typeof saveBillSettings==='function') saveBillSettings();
    var mo = document.getElementById('mo-bill-edit');
    if(mo) mo.classList.remove('on');
  };
  var _bt = setInterval(function(){
    var btn = document.getElementById('btn-bill-edit');
    if(btn && !btn._v21){
      btn._v21 = true;
      btn.addEventListener('click', function(){
        setTimeout(function(){
          var mo = document.getElementById('mo-bill-edit');
          if(mo){
            mo.classList.add('on');
            var sb = mo.querySelector('button.btn.bp');
            if(sb && !sb._v21){ sb._v21=true; sb.onclick = window._saveBillEdit; }
          }
        }, 80);
      });
    }
  }, 500);
  setTimeout(function(){ clearInterval(_bt); }, 15000);
})();

// v22: Fix bill edit modal - fill from getBillSettings() + sync on save
(function(){
  function fillBillForm(){
    var mo=document.getElementById('mo-bill-edit');
    if(!mo||typeof getBillSettings!=='function') return;
    var s=getBillSettings(); if(!s) return;
    var map={
      'set-shopname':s.shopname||'','set-slogan':s.slogan||'','set-addr':s.addr||'',
      'set-phone':s.phone||'','set-social':s.social||'','set-web':s.web||'',
      'set-logo':s.logo||'','set-footer-sale':s.footerSale||'',
      'set-footer-repair':s.footerRepair||'','set-wterm-sale':s.wtermSale||'',
      'set-wterm-repair':s.wtermRepair||'','set-fontsize':s.fontsize||'',
      'set-billcolor':s.billcolor||''
    };
    Object.keys(map).forEach(function(id){
      var el=mo.querySelector('#'+id); if(el) el.value=map[id];
    });
  }
  function syncAndSave(){
    var mo=document.getElementById('mo-bill-edit');
    if(mo){
      ['set-shopname','set-slogan','set-addr','set-phone','set-social','set-web',
       'set-logo','set-footer-sale','set-footer-repair','set-wterm-sale',
       'set-wterm-repair','set-fontsize','set-billcolor'].forEach(function(id){
        var mEl=mo.querySelector('#'+id),dEl=document.getElementById(id);
        if(mEl&&dEl&&dEl!==mEl) dEl.value=mEl.value;
      });
    }
    if(typeof saveBillSettings==='function') saveBillSettings();
    if(mo) mo.classList.remove('on');
  }
  window._saveBillEdit=syncAndSave;
  var _bt2=setInterval(function(){
    var btn=document.getElementById('btn-bill-edit');
    if(btn&&!btn._v22){
      btn._v22=true;
      btn.addEventListener('click',function(){ setTimeout(fillBillForm,200); });
    }
  },500);
  setTimeout(function(){ clearInterval(_bt2); },15000);
})();

// v23: Fix repair status UI not updating after setRepairStatus()
(function(){
  var _pending={};
  function applyStatus(){
    var ids=Object.keys(_pending);
    if(!ids.length) return;
    ids.forEach(function(id){
      var p=_pending[id];
      if(Date.now()-p.t>10000){delete _pending[id];return;}
      document.querySelectorAll('#repair-list .card').forEach(function(c){
        if(c.querySelector('button[data-id="'+id+'"]')){
          var sel=c.querySelector('select');
          if(sel){
            sel.value=p.s;
            sel.style.color=p.s==='Đã giao'?'#c0392b':'var(--tx,#222)';
            sel.style.fontWeight=p.s==='Đã giao'?'700':'600';
          }
        }
      });
    });
  }
  if(typeof setRepairStatus==='function'&&!setRepairStatus._v23){
    var _oriSRS=setRepairStatus;
    window.setRepairStatus=function(id,status){
      _pending[id]={s:status,t:Date.now()};
      var r=_oriSRS.apply(this,arguments);
      setTimeout(applyStatus,100);
      return r;
    };
    window.setRepairStatus._v23=true;
    window.setRepairStatus._ori=_oriSRS;
  }
  if(typeof renderRepairs==='function'&&!renderRepairs._v23){
    var _oriRR=renderRepairs;
    window.renderRepairs=function(){
      var r=_oriRR.apply(this,arguments);
      setTimeout(applyStatus,80);
      return r;
    };
    window.renderRepairs._v23=true;
    window.renderRepairs._ori=_oriRR;
  }
})();

// v24: Fix repair profit - dung max(capital, catalogCost) tranh double-count
(function(){
  function toV(n){
    return Math.round(n).toLocaleString('vi-VN')+' \u0111';
  }
  function calcProfit(period){
    var repairs=(window.DB&&window.DB.repairs)?window.DB.repairs:[];
    var products=(window.DB&&window.DB.products)?window.DB.products:[];
    var now=new Date();
    var todayStr=now.toISOString().slice(0,10);
    var monthStr=now.toISOString().slice(0,7);
    var weekAgo=new Date(now.getTime()-6*86400000).toISOString().slice(0,10);
    var list=repairs.filter(function(r){
      if(r.status!=='\u0110\u00e3 giao'||!r.deliveredDate) return false;
      var d=r.deliveredDate.slice(0,10);
      if(period==='day') return d===todayStr;
      if(period==='week') return d>=weekAgo&&d<=todayStr;
      if(period==='month') return d.slice(0,7)===monthStr;
      return false;
    });
    var loi=0;
    list.forEach(function(r){
      var itemsTotal=(r.deliveryItems||[]).reduce(function(s,it){return s+(it.qty||1)*(it.price||0);},0);
      var thu=(r.deliveryItems&&r.deliveryItems.length>0)?itemsTotal:(r.cost||0);
      var catCost=(r.deliveryItems||[]).reduce(function(s,it){
        var p=products.find(function(p){return p.name===it.desc;});
        return s+(p?(p.cost||0)*(it.qty||1):0);
      },0);
      loi+=thu-Math.max(r.capital||0,catCost);
    });
    return loi;
  }
  function patchUI(period){
    var correct=calcProfit(period);
    document.querySelectorAll('div,span').forEach(function(el){
      if(el.children.length===0&&el.textContent.trim()==='\u004c\u1ee3i nhu\u1eadn'){
        var par=el.parentElement;
        if(par){
          var numEl=Array.from(par.children).find(function(c){
            return c!==el&&/[\d]/.test(c.textContent)&&c.textContent.includes('\u0111');
          });
          if(numEl) numEl.textContent=toV(correct);
        }
      }
    });
  }
  if(typeof showRepairProfit==='function'&&!showRepairProfit._v24){
    var _ori=showRepairProfit;
    window.showRepairProfit=function(period){
      window._srpP=period||window._srpP||'day';
      var r=_ori.apply(this,arguments);
      setTimeout(function(){patchUI(window._srpP);},200);
      return r;
    };
    window.showRepairProfit._v24=true;
    window.showRepairProfit._ori=_ori;
    setTimeout(function(){patchUI(window._srpP||'day');},500);
  }
})();

// v25: fix calcProfit to read from localStorage (window.DB does not exist)
(function(){
  function toV(n){
    return Math.round(n).toLocaleString('vi-VN')+' đ';
  }
  function calcProfit(period){
    var repairs=JSON.parse(localStorage.getItem('l24_repairs')||'[]');
    var products=JSON.parse(localStorage.getItem('l24_products')||'[]');
    var now=new Date();
    var todayStr=now.toISOString().slice(0,10);
    var monthStr=now.toISOString().slice(0,7);
    var weekAgo=new Date(now.getTime()-6*86400000).toISOString().slice(0,10);
    var list=repairs.filter(function(r){
      if(r.status!=='Đã giao'||!r.deliveredDate) return false;
      var d=r.deliveredDate.slice(0,10);
      if(period==='day') return d===todayStr;
      if(period==='week') return d>=weekAgo&&d<=todayStr;
      if(period==='month') return d.slice(0,7)===monthStr;
      return false;
    });
    var loi=0;
    list.forEach(function(r){
      var itemsTotal=(r.deliveryItems||[]).reduce(function(s,it){return s+(it.qty||1)*(it.price||0);},0);
      var thu=(r.deliveryItems&&r.deliveryItems.length>0)?itemsTotal:(r.cost||0);
      var catCost=(r.deliveryItems||[]).reduce(function(s,it){
        var p=products.find(function(pp){return pp.name===it.desc;});
        return s+(p?(p.cost||0)*(it.qty||1):0);
      },0);
      loi+=thu-Math.max(r.capital||0,catCost);
    });
    return loi;
  }
  function patchUI(period){
    var correct=calcProfit(period);
    document.querySelectorAll('div,span').forEach(function(el){
      if(el.children.length===0&&el.textContent.trim()==='Lợi nhuận'){
        var par=el.parentElement;
        if(par){
          var numEl=Array.from(par.children).find(function(c){
            return c!==el&&/[d]/.test(c.textContent)&&c.textContent.includes('đ');
          });
          if(numEl) numEl.textContent=toV(correct);
        }
      }
    });
  }
  if(typeof showRepairProfit==='function'&&!showRepairProfit._v25){
    var _ori=(showRepairProfit._ori||showRepairProfit);
    window.showRepairProfit=function(period){
      window._srpP=period||window._srpP||'day';
      var r=_ori.apply(this,arguments);
      setTimeout(function(){patchUI(window._srpP);},200);
      return r;
    };
    window.showRepairProfit._v25=true;
    window.showRepairProfit._v24=true;
    window.showRepairProfit._ori=_ori;
    setTimeout(function(){patchUI(window._srpP||'day');},500);
  }
})();

// v26: fix status selects always showing Mới nhận - read real status from localStorage
(function(){
  function applyAllStatuses(){
    var repairs=JSON.parse(localStorage.getItem('l24_repairs')||'[]');
    var rMap={};
    repairs.forEach(function(r){rMap[r.id]=r;});
    document.querySelectorAll('select').forEach(function(sel){
      var oc=sel.getAttribute('onchange')||'';
      var m=oc.match(/setRepairStatus\(['"]([^'"]+)['"]/);
      if(!m) return;
      var rid=m[1];
      var rep=rMap[rid];
      if(!rep) return;
      var st=(window._pendingStatus&&window._pendingStatus[rid])?window._pendingStatus[rid]:rep.status;
      if(sel.value!==st) sel.value=st;
      if(st==='Đã giao'){sel.style.color='red';sel.style.fontWeight='bold';}
      else{sel.style.color='';sel.style.fontWeight='';}
    });
  }
  if(typeof renderRepairs==='function'&&!renderRepairs._v26){
    var _oriRR=renderRepairs._ori||renderRepairs;
    window.renderRepairs=function(){
      var r=_oriRR.apply(this,arguments);
      setTimeout(applyAllStatuses,120);
      return r;
    };
    window.renderRepairs._v26=true;window.renderRepairs._v23=true;window.renderRepairs._ori=_oriRR;
  }
  if(typeof setRepairStatus==='function'&&!setRepairStatus._v26){
    var _oriSRS=setRepairStatus._ori||setRepairStatus;
    window.setRepairStatus=function(id,status){
      if(!window._pendingStatus)window._pendingStatus={};
      window._pendingStatus[id]=status;
      try{
        var repairs=JSON.parse(localStorage.getItem('l24_repairs')||'[]');
        var i=repairs.findIndex(function(r){return r.id===id;});
        if(i>=0){
          repairs[i].status=status;
          if(status==='Đã giao'&&!repairs[i].deliveredDate)
            repairs[i].deliveredDate=new Date().toISOString().slice(0,10);
          localStorage.setItem('l24_repairs',JSON.stringify(repairs));
        }
      }catch(e){}
      return _oriSRS.apply(this,arguments);
    };
    window.setRepairStatus._v26=true;window.setRepairStatus._v23=true;window.setRepairStatus._ori=_oriSRS;
  }
  window._applyAllStatuses=applyAllStatuses;
  setTimeout(applyAllStatuses,600);
})();

// v27: lock status select + edit button for staff when status = Đã giao
(function(){
  function isStaff(){
    try{ var s=JSON.parse(localStorage.getItem('l24_session')||'{}'); return s.role==='staff'; }
    catch(e){ return false; }
  }
  function lockDelivered(){
    if(!isStaff()) return;
    var repairs=JSON.parse(localStorage.getItem('l24_repairs')||'[]');
    var rMap={};
    repairs.forEach(function(r){ rMap[r.id]=r; });
    document.querySelectorAll('select').forEach(function(sel){
      var oc=sel.getAttribute('onchange')||'';
      var m=oc.match(/setRepairStatus\(['"]([^'"]+)['"]/);
      if(!m) return;
      var rid=m[1];
      var rep=rMap[rid];
      if(!rep) return;
      var pst=window._pendingStatus&&window._pendingStatus[rid];
      var st=pst||rep.status;
      if(st==='Đã giao'){
        sel.disabled=true;
        sel.style.opacity='0.65';
        sel.style.cursor='not-allowed';
        var editBtn=document.querySelector('button.btn.bg2[data-id="'+rid+'"]');
        if(editBtn){
          editBtn.disabled=true;
          editBtn.style.opacity='0.4';
          editBtn.style.cursor='not-allowed';
          editBtn.title='Phiếu đã giao – không thể sửa';
        }
      }
    });
  }
  var _rr27=window.renderRepairs;
  if(_rr27) window.renderRepairs=function(){
    _rr27.apply(this,arguments);
    setTimeout(lockDelivered,200);
  };
  window._lockDelivered=lockDelivered;
  setTimeout(lockDelivered,900);
})();

// v28: lock delete button for staff on all repairs
(function(){
  function lockDelete(){
    try{ var s=JSON.parse(localStorage.getItem('l24_session')||'{}'); if(s.role!=='staff') return; }
    catch(e){ return; }
    document.querySelectorAll('button.btn.br.bsm[data-id]').forEach(function(btn){
      btn.disabled=true;
      btn.style.opacity='0.3';
      btn.style.cursor='not-allowed';
      btn.title='Không có quyền xóa phiếu';
    });
  }
  var _rr28=window.renderRepairs;
  if(_rr28) window.renderRepairs=function(){
    _rr28.apply(this,arguments);
    setTimeout(lockDelete,250);
  };
  window._lockDelete=lockDelete;
  setTimeout(lockDelete,1000);
})();

// v29: search sale product by name (Ten SP) instead of code (Ma SP)
(function(){
  function getProds(){ return JSON.parse(localStorage.getItem('l24_products')||'[]'); }

  function transformRow(row){
    if(row.dataset.v29) return;
    row.dataset.v29='1';
    var prods=getProds();
    var codeInp=row.querySelector('input[placeholder="Mã SP"]');
    var nameInp=row.querySelector('input[placeholder="Tên SP"]');
    if(!codeInp||!nameInp) return;

    // Chuyển datalist sang dùng tên sản phẩm làm value
    var dlId=codeInp.getAttribute('list');
    var dl=dlId?document.getElementById(dlId):null;
    if(dl){
      dl.innerHTML=prods.map(function(p){
        return '<option value="'+p.name.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"></option>';
      }).join('');
      nameInp.setAttribute('list',dlId);
      codeInp.removeAttribute('list');
    }

    // Mã SP -> readonly, nhỏ lại
    codeInp.readOnly=true;
    codeInp.removeAttribute('oninput');
    codeInp.placeholder='Mã';
    codeInp.style.color='#999';
    codeInp.style.fontSize='11px';
    codeInp.style.cursor='default';

    // Tên SP -> editable, là ô chính
    nameInp.readOnly=false;
    nameInp.removeAttribute('readonly');
    nameInp.className='';

    function doSelect(){
      var val=nameInp.value.trim().toLowerCase();
      var p=prods.find(function(x){ return x.name.toLowerCase()===val; });
      if(!p) return;
      var rows=document.querySelectorAll('#bill-items .bi');
      var idx=Array.from(rows).indexOf(row);
      if(idx<0) return;
      codeInp.value=p.id;
      if(window.updCode) window.updCode(idx,p.id);
      // Giữ lại tên sau khi updCode chạy
      setTimeout(function(){ if(nameInp.value===''||nameInp.readOnly) nameInp.value=p.name; },30);
    }

    nameInp.addEventListener('input', doSelect);
    nameInp.addEventListener('change', doSelect);

    // Xóa tên thì xóa mã
    nameInp.addEventListener('input', function(){
      if(!this.value.trim()) codeInp.value='';
    });
  }

  function transformAll(){
    document.querySelectorAll('#bill-items .bi').forEach(transformRow);
  }

  // Watch rows mới thêm vào
  var container=document.getElementById('bill-items');
  if(container){
    new MutationObserver(function(muts){
      muts.forEach(function(m){
        m.addedNodes.forEach(function(n){
          if(n.nodeType===1&&n.classList&&n.classList.contains('bi')){
            setTimeout(function(){ transformRow(n); },30);
          }
        });
      });
    }).observe(container,{childList:true});
  }

  // Chạy khi vào tab Bán Hàng
  document.querySelectorAll('.tb').forEach(function(btn){
    btn.addEventListener('click',function(){ setTimeout(transformAll,200); });
  });

  setTimeout(transformAll,500);
})();


// v30: Fix SC ID collision – intercept localStorage.setItem
(function(){
  if(window._v30LSHook) return;
  window._v30LSHook = true;
  var _ori = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key, value){
    if(key === 'l24_repairs'){
      try {
        var arr = JSON.parse(value);
        if(!Array.isArray(arr) || !arr.length) return _ori(key, value);
        // Compute max sequential SC ID and count-based next ID
        var maxSeq = 0;
        arr.forEach(function(r){
          if(!r || typeof r.id !== 'string') return;
          var m = r.id.match(/^SC(\d{1,5})$/);
          if(m){ var n=parseInt(m[1]); if(n>maxSeq) maxSeq=n; }
        });
        var countId = 'SC' + (arr.length + 1);
        // Only act if there is an ID gap (maxSeq >= arr.length+1 means countId already taken)
        if(maxSeq >= arr.length + 1){
          // Case 1: replace – fresh entry exists at collision position (anywhere in array)
          for(var i=0; i<arr.length; i++){
            var r = arr[i];
            if(r && r.id === countId && r.ts && (Date.now()-r.ts) < 15000){
              // This entry was just created with the colliding ID → fix it
              var safeId = 'SC' + (maxSeq + 1);
              var fixed = arr.slice();
              var entry = Object.assign({}, r, {id: safeId});
              fixed.splice(i, 1);   // remove from collision spot
              fixed.push(entry);     // append at end with safe ID
              value = JSON.stringify(fixed);
              break;
            }
          }
        }
        // Case 2: append – last element has duplicate ID anywhere earlier
        var arr2 = JSON.parse(value);
        var last = arr2[arr2.length-1];
        if(last && last.id && /^SC\d{1,5}$/.test(last.id)){
          for(var j=0; j<arr2.length-1; j++){
            if(arr2[j] && arr2[j].id === last.id){
              var ms=0;
              for(var k=0; k<arr2.length-1; k++){
                var mm=arr2[k]&&arr2[k].id&&arr2[k].id.match(/^SC(\d{1,5})$/);
                if(mm){var nn=parseInt(mm[1]);if(nn>ms)ms=nn;}
              }
              arr2[arr2.length-1]=Object.assign({},last,{id:'SC'+(ms+1)});
              value=JSON.stringify(arr2);
              break;
            }
          }
        }
      } catch(e){}
    }
    return _ori(key, value);
  };
})();
// v33: Fix SC ID collision – saveRepair coord + DB.s restore (replaces v31)
(function(){
  if(window._v33ColFix) return;
  window._v33ColFix = true;

  // ── A. Wrap saveRepair: detect collision trước khi original chạy ────────
  var _tiSR = setInterval(function(){
    try{ if(typeof saveRepair==='undefined') return; }catch(e){ return; }
    clearInterval(_tiSR);
    var _origSR = window.saveRepair;
    window.saveRepair = function(){
      window._patchNextId = null;
      window._patchSavedEntry = null;
      var editId = window.editRepairId || '';
      if(!editId){
        try{
          var arr = DB.repairs || [];
          var count = arr.filter(function(r){return r;}).length;
          var maxSeq = 0;
          arr.forEach(function(r){
            if(!r||typeof r.id!=='string') return;
            var m=r.id.match(/^SC(\d{1,5})$/);
            if(m){var n=parseInt(m[1]);if(n>maxSeq)maxSeq=n;}
          });
          if(maxSeq >= count + 1){
            var colId = 'SC' + (count + 1);
            var victim = arr.find(function(r){return r&&r.id===colId;});
            if(victim){
              window._patchSavedEntry = JSON.parse(JSON.stringify(victim));
              window._patchNextId = 'SC' + (maxSeq + 1);
            }
          }
        }catch(e){ console.warn('[v33] saveRepair hook err:',e); }
      }
      return _origSR.apply(this, arguments);
    };
    window.saveRepair._v33c = true;
  }, 200);

  // ── B. Wrap DB.s: dùng _patchNextId để fix ID + restore entry bị xóa ─
  var _tiDB = setInterval(function(){
    try{ if(typeof DB==='undefined'||typeof DB.s!=='function') return; }catch(e){ return; }
    clearInterval(_tiDB);
    var _origDBS = DB.s.bind(DB);
    DB.s = function(key, val){
      if(key==='repairs' && Array.isArray(val) && window._patchNextId){
        var fixId = window._patchNextId;
        var saved = window._patchSavedEntry;
        window._patchNextId = null;
        window._patchSavedEntry = null;
        var now = Date.now();
        val = val.slice();
        for(var i=0; i<val.length; i++){
          var r=val[i];
          if(!r||!r.ts||(now-r.ts)>30000) continue;
          val[i] = Object.assign({},r,{id:fixId});
          if(saved && !val.some(function(x){return x&&x.id===saved.id;})){
            val.push(saved);
          }
          break;
        }
      }
      return _origDBS(key, val);
    };
    window.DB.s = DB.s;
  }, 200);
})();

// v32: Thêm dòng giảm giá vào modal giao máy + bill in + card
(function(){
  if(window._v32Discount) return;
  window._v32Discount = true;
  function fN(n){ return Math.round(n||0).toLocaleString('vi-VN'); }

  // ── 1. Inject ô Giảm giá vào modal giao máy ──────────────────────────
  function injectDiscountField(){
    var mo = document.getElementById('mo-deliver');
    if(!mo || mo.dataset.v32d) return;
    mo.dataset.v32d = '1';
    var dvPaid = document.getElementById('dv-paid');
    if(!dvPaid) return;
    var paidRow = dvPaid.closest('.tot') || dvPaid.parentElement;
    paidRow.insertAdjacentHTML('beforebegin',
      '<div class="tot" style="padding-top:8px;border-top:1px dashed var(--bd)">' +
      '<span style="font-weight:700;color:#e53935">🎁 Giảm giá (đ)</span>' +
      '<input id="dv-discount" type="number" min="0" value="0" ' +
      'style="width:130px;padding:6px 10px;border:1px solid #e53935;border-radius:8px;' +
      'background:var(--bg);color:#e53935;font-size:14px;font-weight:700;text-align:right">' +
      '</div>'
    );
  }

  // ── 2. Patch openDeliverModal: reset + điền lại giảm giá ─────────────
  var _tiODM = setInterval(function(){
    if(!window.openDeliverModal || openDeliverModal._v32d) return;
    clearInterval(_tiODM);
    var _orig = window.openDeliverModal;
    window.openDeliverModal = function(id){
      _orig(id);
      setTimeout(function(){
        injectDiscountField();
        var el = document.getElementById('dv-discount');
        if(el){
          var reps = JSON.parse(localStorage.getItem('l24_repairs')||'[]');
          var rep = reps.find(function(r){ return r&&r.id===id; });
          el.value = (rep && rep.discount) ? rep.discount : 0;
        }
      }, 350);
    };
    window.openDeliverModal._v32d = true;
  }, 300);

  // ── 3. Patch saveDeliver: đọc giảm giá và lưu vào Firebase ──────────
  var _tiSD = setInterval(function(){
    if(!window.saveDeliver || saveDeliver._v32d) return;
    clearInterval(_tiSD);
    var _orig = window.saveDeliver;
    window.saveDeliver = function(){
      var discEl = document.getElementById('dv-discount');
      var discount = discEl ? (+(discEl.value)||0) : 0;
      var repId = (document.getElementById('dv-repid')||{value:''}).value;
      _orig.apply(this, arguments);
      if(repId){
        setTimeout(function(){
          var reps = DB.repairs;
          var rep = reps.find(function(r){ return r&&r.id===repId; });
          if(rep){
            rep.discount = discount;
            DB.repairs = reps;
          }
        }, 750);
      }
    };
    window.saveDeliver._v32d = true;
  }, 300);

  // ── 4. Patch printRepairBill: chèn dòng giảm giá vào bill in ─────────
  var _tiPRB = setInterval(function(){
    if(!window.printRepairBill || printRepairBill._v32d) return;
    clearInterval(_tiPRB);
    var _orig = window.printRepairBill;
    window.printRepairBill = function(rep){
      var discount = (rep && rep.discount) ? +rep.discount : 0;
      if(!discount) return _orig(rep);
      // Chặn window.open tạm thời để can thiệp document.write
      var _origOpen = window.open;
      window.open = function(){
        var win = _origOpen.apply(window, arguments);
        if(win){
          var chunks = [];
          var _dw = win.document.write.bind(win.document);
          var _dc = win.document.close.bind(win.document);
          win.document.write = function(html){ chunks.push(html||''); };
          win.document.close = function(){
            var full = chunks.join('');
            var discRow =
              '<tr style="color:#e53935"><td colspan="3" style="padding:3px 8px;text-align:right;font-weight:700">🎁 Giảm giá</td>' +
              '<td style="padding:3px 8px;text-align:right;font-weight:700">-' + fN(discount) + '&nbsp;đ</td></tr>';
            // Chèn trước dòng "Còn lại"
            var re = /(<tr(?:[^>]*)>(?:(?!<\/tr>)[\s\S])*?[Cc]òn\s*l[ạa]i(?:(?!<\/tr>)[\s\S])*?<\/tr>)/;
            if(re.test(full)){
              full = full.replace(re, discRow + '$1');
            } else {
              // Fallback: chèn trước </table> cuối cùng
              var lastTable = full.lastIndexOf('</table>');
              if(lastTable >= 0) full = full.slice(0, lastTable) + discRow + full.slice(lastTable);
            }
            win.document.write = _dw;
            win.document.close = _dc;
            _dw(full);
            _dc();
          };
        }
        window.open = _origOpen;
        return win;
      };
      return _orig(rep);
    };
    window.printRepairBill._v32d = true;
  }, 300);

  // ── 5. Patch renderRepairs: hiển thị giảm giá trong card ─────────────
  var _tiRR = setInterval(function(){
    if(!window.renderRepairs || renderRepairs._v32d) return;
    clearInterval(_tiRR);
    var _orig = window.renderRepairs;
    window.renderRepairs = function(){
      _orig.apply(this, arguments);
      setTimeout(function(){
        var repairs = JSON.parse(localStorage.getItem('l24_repairs')||'[]');
        var rMap = {};
        repairs.forEach(function(r){ if(r) rMap[r.id]=r; });
        document.querySelectorAll('#repair-list .card').forEach(function(card){
          var btn = card.querySelector('button[data-id]');
          if(!btn) return;
          var rid = btn.dataset.id;
          var rep = rMap[rid];
          if(!rep || !rep.discount || rep.discount <= 0) return;
          // Tìm dòng "Còn:" để thêm thông tin giảm giá
          var costDivs = card.querySelectorAll('div');
          costDivs.forEach(function(d){
            if(d.textContent.includes('Phí:') && d.textContent.includes('Còn:')){
              if(!d.dataset.v32d){
                d.dataset.v32d = '1';
                d.innerHTML += ' <span style="color:#e53935;font-weight:700">| 🎁 Giảm: ' + fN(rep.discount) + ' đ</span>';
              }
            }
          });
        });
      }, 150);
    };
    window.renderRepairs._v32d = true;
  }, 300);
})();


// v34: Mở khóa nhập vốn linh kiện cho nhân viên (unlock #rm-capital)
(function(){
  if(window._v34CapUnlock) return;
  window._v34CapUnlock = true;

  // CSS: force show container của #rm-capital dù có class admin-only
  var st = document.createElement('style');
  st.id = '_v34CapCSS';
  st.textContent = '.fg.admin-only:has(#rm-capital){display:flex!important}';
  document.head.appendChild(st);

  // JS: wrap applyRoleUI để re-show sau khi nó ẩn admin-only elements
  var _ti = setInterval(function(){
    try{ if(typeof applyRoleUI !== 'function') return; }catch(e){ return; }
    clearInterval(_ti);
    var _orig = window.applyRoleUI;
    window.applyRoleUI = function(){
      _orig.apply(this, arguments);
      var inp = document.getElementById('rm-capital');
      if(inp){
        var wrap = inp.closest('.admin-only') || inp.parentElement;
        if(wrap) wrap.style.display = 'flex';
        inp.removeAttribute('disabled');
        inp.removeAttribute('readonly');
      }
    };
  }, 200);
})();


// v35: Wire dv-discount vào calcDelivery + printDeliverBill
// Công thức: CÒN LẠI = tổng hạng mục - cọc - giảm giá
(function(){
  if(window._v35DiscWire) return;
  window._v35DiscWire = true;

  function getDisc(){
    var el = document.getElementById('dv-discount');
    return el ? Math.max(0, parseFloat(el.value)||0) : 0;
  }

  // ── A. Wrap calcDelivery: sau khi gốc tính remaining, trừ tiếp discount
  var _tiCalc = setInterval(function(){
    try{ if(typeof calcDelivery!=='function') return; }catch(e){ return; }
    clearInterval(_tiCalc);
    var _origCalc = window.calcDelivery;
    window.calcDelivery = function(){
      _origCalc.apply(this, arguments);
      var disc = getDisc();
      if(!disc) return;
      var remEl = document.getElementById('dv-remaining');
      if(!remEl) return;
      // Parse remaining hiện tại (đã trừ cọc bởi hàm gốc)
      var curRem = parseInt((remEl.textContent+'').replace(/[^0-9]/g,'')) || 0;
      var newRem = Math.max(0, curRem - disc);
      remEl.textContent = newRem.toLocaleString('vi-VN') + ' đ';
    };
  }, 200);

  // ── B. Wrap printDeliverBill: chèn discount vào tmp trước khi in
  var _tiPDB = setInterval(function(){
    try{ if(typeof printDeliverBill!=='function') return; }catch(e){ return; }
    clearInterval(_tiPDB);
    var _origPDB = window.printDeliverBill;
    window.printDeliverBill = function(){
      var disc = getDisc();
      if(disc > 0){
        var _curPRB = window.printRepairBill;
        window.printRepairBill = function(rep){
          window.printRepairBill = _curPRB;
          return _curPRB(Object.assign({}, rep, {discount: disc}));
        };
      }
      return _origPDB.apply(this, arguments);
    };
  }, 200);

  // ── C. Event: nhập giảm giá → cập nhật CÒN LẠI ngay lập tức
  document.addEventListener('input', function(e){
    if(e.target && e.target.id==='dv-discount'){
      try{ if(typeof calcDelivery==='function') calcDelivery(); }catch(err){}
    }
  });
})();
