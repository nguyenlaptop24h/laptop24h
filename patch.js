(function(){
  /* ====== patch.js — Laptop24H repair tab enhancements ====== */

  /* ---- helpers: access consts that are not on window ---- */
  function _gDB(){try{return typeof DB\!=='undefined'?DB:null;}catch(e){return null;}}
  function _gSTS(){
    try{if(typeof STATUSES\!=='undefined')return STATUSES;}catch(e){}
    return ['Mới nhận','Đang kiểm tra','Đang sửa','Chờ linh kiện','Hoàn thành','Đã giao'];
  }
  function _gSTC(){
    try{if(typeof ST_CLASS\!=='undefined')return ST_CLASS;}catch(e){}
    return {
      'Mới nhận':'badge-new','Đang kiểm tra':'badge-check',
      'Đang sửa':'badge-fix','Chờ linh kiện':'badge-wait',
      'Hoàn thành':'badge-done','Đã giao':'badge-delivered'
    };
  }
  function _gCU(){try{return typeof currentUser\!=='undefined'?currentUser:null;}catch(e){return null;}}

  /* ---- inject CSS: compact filters + scroll-btn styles ---- */
  if(\!document.getElementById('_pSty')){
    var sty=document.createElement('style');
    sty.id='_pSty';
    sty.textContent=[
      '#rsf-select{width:auto\!important;max-width:160px}',
      '.rep-filter{width:auto\!important;max-width:160px}',
      '#_btnTop,#_btnBot{position:fixed;right:18px;width:40px;height:40px;border-radius:50%;',
        'border:none;background:var(--pr,#1976d2);color:#fff;font-size:20px;cursor:pointer;',
        'box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:9999;display:none;',
        'align-items:center;justify-content:center;transition:opacity .2s}',
      '#_btnTop{bottom:72px}',
      '#_btnBot{bottom:22px}'
    ].join('');
    document.head.appendChild(sty);
  }

  /* ---- pagination state ---- */
  var PAGE_SIZE = 50;
  window._repPage = window._repPage || 1;
  window._repPF   = window._repPF   || {q:'',status:'',date:''};

  /* ---- scroll buttons ---- */
  function addScrollBtns(){
    if(document.getElementById('_btnTop')) return;
    var t=document.createElement('button');
    t.id='_btnTop'; t.innerHTML='&#8679;'; t.title='Lên đầu';
    t.style.cssText='display:none;position:fixed;right:18px;bottom:72px;width:40px;height:40px;border-radius:50%;border:none;background:var(--pr,#1976d2);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:9999;align-items:center;justify-content:center';
    t.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};

    var b=document.createElement('button');
    b.id='_btnBot'; b.innerHTML='&#8681;'; b.title='Xuống cuối';
    b.style.cssText='display:none;position:fixed;right:18px;bottom:22px;width:40px;height:40px;border-radius:50%;border:none;background:var(--pr,#1976d2);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:9999;align-items:center;justify-content:center';
    b.onclick=function(){window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});};

    document.body.appendChild(t);
    document.body.appendChild(b);

    window.addEventListener('scroll',function(){
      var y=window.scrollY||document.documentElement.scrollTop;
      var max=document.documentElement.scrollHeight-window.innerHeight;
      t.style.display= y>200 ? 'flex' : 'none';
      b.style.display= y<max-200 ? 'flex' : 'none';
    },{passive:true});
  }

  /* ---- renderRepairs override ---- */
  function installRender(){
    var db=_gDB();
    if(\!db) return false;

    window._rpRender = function(){
      var container=document.getElementById('repair-list');
      if(\!container) return;

      var sts  = _gSTS();
      var stc  = _gSTC();
      var cu   = _gCU();
      var isAdmin = cu && cu.role==='admin';

      /* read filter bar values */
      var qEl  = document.getElementById('repair-search');
      var stEl = document.getElementById('rsf-select');
      var dtEl = document.querySelector('.rep-filter');  /* date filter */
      var q    = (qEl?qEl.value:'').toLowerCase().trim();
      var sfSt = stEl?stEl.value:'';
      var sfDt = dtEl?dtEl.value:'';

      /* compare with last filter state to reset page */
      var pfKey = q+'|'+sfSt+'|'+sfDt;
      if(window._repPF._key \!== pfKey){
        window._repPage = 1;
        window._repPF._key = pfKey;
      }

      db.ref('/repairs').once('value').then(function(snap){
        var all = [];
        snap.forEach(function(c){ var v=c.val(); v._key=c.key; all.push(v); });

        /* sort newest first */
        all.sort(function(a,b){
          return ((b.createdAt||b.timestamp||0)-(a.createdAt||a.timestamp||0));
        });

        /* filter */
        var filtered = all.filter(function(r){
          if(sfSt && r.status\!==sfSt) return false;
          if(sfDt){
            var d=new Date(r.createdAt||r.timestamp||0);
            var rd=[d.getFullYear(),('0'+(d.getMonth()+1)).slice(-2),('0'+d.getDate()).slice(-2)].join('-');
            if(rd\!==sfDt) return false;
          }
          if(q){
            var hay=(r.id||'')+(r.customerName||'')+(r.deviceName||'')+(r.phone||'')+(r.status||'');
            if(hay.toLowerCase().indexOf(q)<0) return false;
          }
          return true;
        });

        /* pagination */
        var pg = window._repPage;
        var totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
        if(pg > totalPages) pg = window._repPage = totalPages;
        var slice = filtered.slice((pg-1)*PAGE_SIZE, pg*PAGE_SIZE);

        /* build cards */
        var grid = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';
        if(slice.length===0){
          grid += '<p style="color:#888;padding:24px 0">Không có phiếu nào.</p>';
        }
        slice.forEach(function(r){
          var cls = stc[r.status]||'badge-new';
          var locked = (r.status==='Đã giao') && \!isAdmin;
          var opts = sts.map(function(s){
            return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s.toUpperCase()+'</option>';
          }).join('');
          var sel = \!locked
            ? '<div style="margin-top:14px;display:flex;justify-content:center">'+
              '<select style="width:auto;padding:7px 14px;border:1.5px solid var(--bd,#ddd);border-radius:var(--rs,6px);font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;font-family:inherit;cursor:pointer;background:#fff;color:var(--pr-d,#333)" onchange="setRepairStatus(\''+r._key+'\',this.value)">'+
              opts+'</select></div>'
            : '<div style="margin-top:14px;text-align:center;font-size:11px;color:#999">Đã khóa</div>';

          grid += '<div class="rep-card" style="background:#fff;border-radius:12px;padding:16px;box-shadow:0 1px 6px rgba(0,0,0,.08)">';
          grid += '<div style="display:flex;justify-content:space-between;align-items:center">';
          grid += '<span class="bx b-bl" style="font-size:13px;font-weight:700">#'+r.id+'</span>';
          grid += '<span class="badge '+cls+'" style="font-size:11px;padding:2px 8px;border-radius:20px">'+r.status+'</span>';
          grid += '</div>';
          grid += '<div style="margin:8px 0;font-size:14px;font-weight:600">'+( r.customerName||'')+'</div>';
          grid += '<div style="font-size:12px;color:#666">'+( r.deviceName||'')+'</div>';
          if(r.phone) grid+='<div style="font-size:12px;color:#666">&#128222; '+ r.phone+'</div>';
          if(r.issue) grid+='<div style="font-size:12px;color:#555;margin-top:4px">'+r.issue+'</div>';
          grid += '<div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end">';
          if(\!locked){
            grid += '<button onclick="editRepair(\''+r._key+'\')" style="background:none;border:1.5px solid var(--bd,#ddd);border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px" title="Sửa">&#9998;</button>';
            if(isAdmin) grid += '<button onclick="deleteRepair(\''+r._key+'\')" style="background:none;border:1.5px solid #f44;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;color:#f44" title="Xóa">&#128465;</button>';
            if(r.status==='Hoàn thành'){
              grid += '<button onclick="markDelivered(\''+r._key+'\')" style="background:var(--pr,#1976d2);border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:13px;color:#fff" title="Giao máy">&#128640;</button>';
            }
          }
          grid += '</div>';
          grid += sel;
          grid += '</div>';
        });
        grid += '</div>';

        /* pagination nav */
        var btnSty = 'padding:6px 16px;border:1.5px solid var(--bd,#ddd);border-radius:6px;background:#fff;cursor:pointer;font-size:13px';
        var nav = '<div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:20px 0;font-size:13px">';
        nav += '<button style="'+btnSty+'"'+(pg<=1?' disabled':'')+' onclick="window._repPage=Math.max(1,window._repPage-1);window._rpRender()">◀ Trước</button>';
        nav += '<span>Trang <b>'+pg+'/'+totalPages+'</b> &middot; <b>'+filtered.length+'</b> phiếu</span>';
        nav += '<button style="'+btnSty+'"'+(pg>=totalPages?' disabled':'')+' onclick="window._repPage=Math.min('+totalPages+',window._repPage+1);window._rpRender()">Sau ▶</button>';
        nav += '</div>';

        container.innerHTML = grid + nav;
      }).catch(function(e){ console.error('_rpRender:',e); });
    };

    /* hook filter inputs to re-render */
    function hookFilter(el){
      if(\!el||el._rpHooked) return;
      el._rpHooked=true;
      el.addEventListener('input',  function(){ window._repPage=1; window._rpRender(); });
      el.addEventListener('change', function(){ window._repPage=1; window._rpRender(); });
    }
    hookFilter(document.getElementById('repair-search'));
    hookFilter(document.getElementById('rsf-select'));
    hookFilter(document.querySelector('.rep-filter'));

    /* override original renderRepairs if present */
    if(typeof renderRepairs==='function'){
      try{ window.renderRepairs = window._rpRender; }catch(e){}
    }

    addScrollBtns();
    window._rpRender();
    return true;
  }

  /* ---- activation: poll until repair page is ready ---- */
  function tryActivate(){
    if(window._patchActive) return;
    var container=document.getElementById('repair-list');
    if(\!container) return;
    var db=_gDB();
    if(\!db) return;
    if(installRender()){
      window._patchActive=true;
      console.log('[patch] activated');
    }
  }

  /* watch for page navigation (SPA) and re-activate */
  var _lastPg='';
  setInterval(function(){
    var pg = window.location.href + (document.getElementById('repair-list')?'1':'0');
    if(pg\!==_lastPg){
      _lastPg=pg;
      window._patchActive=false;
      setTimeout(tryActivate,300);
    }
    if(\!window._patchActive) tryActivate();
  }, 800);

  tryActivate();
})();
