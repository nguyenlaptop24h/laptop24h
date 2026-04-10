(function(){
  if(window._patch2Active) return;

  /* ---- CSS injection ---- */
  if(!document.getElementById('_pSty')){
    var sty=document.createElement('style');
    sty.id='_pSty';
    sty.textContent=
      '#rsf-select{width:auto!important;max-width:160px}'+
      '.rep-filter{width:auto!important;max-width:160px}'+
      '#_btnTop,#_btnBot{position:fixed;right:18px;width:40px;height:40px;'+
        'border-radius:50%;border:none;background:var(--pr,#1976d2);color:#fff;'+
        'font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);'+
        'z-index:9999;display:none;align-items:center;justify-content:center}'+
      '#_btnTop{bottom:72px}#_btnBot{bottom:22px}';
    document.head.appendChild(sty);
  }

  var PAGE = 50;
  window._repPage = window._repPage || 1;

  /* ---- pagination over existing cards ---- */
  window._rpPaginate = function(){
    var wrap = document.getElementById('repair-list');
    if(!wrap) return;

    var cards = [];
    for(var i=0;i<wrap.children.length;i++){
      var el = wrap.children[i];
      if(el.id !== '_rpNav') cards.push(el);
    }
    if(cards.length === 0) return;

    var total = cards.length;
    var totalPages = Math.max(1, Math.ceil(total/PAGE));
    var pg = window._repPage;
    if(pg < 1) pg = window._repPage = 1;
    if(pg > totalPages) pg = window._repPage = totalPages;
    var start = (pg-1)*PAGE, end = pg*PAGE;

    for(var j=0;j<cards.length;j++){
      cards[j].style.display = (j>=start && j<end) ? '' : 'none';
    }

    var nav = document.getElementById('_rpNav');
    if(!nav){ nav=document.createElement('div'); nav.id='_rpNav'; wrap.appendChild(nav); }
    var bs='padding:6px 16px;border:1.5px solid var(--bd,#ccc);border-radius:6px;background:#fff;cursor:pointer;font-size:13px';
    nav.style.cssText='display:flex;align-items:center;justify-content:center;gap:14px;padding:18px 0;font-size:13px';
    nav.innerHTML=
      '<button style="'+bs+'"'+(pg<=1?' disabled':'')+
        ' onclick="window._repPage=Math.max(1,(window._repPage||1)-1);window._rpPaginate()">&#9664; Tr\u01b0\u1edbc</button>'+
      '<span>Trang <b>'+pg+' / '+totalPages+'</b> &nbsp;&middot;&nbsp; <b>'+total+'</b> phi\u1ebfu</span>'+
      '<button style="'+bs+'"'+(pg>=totalPages?' disabled':'')+
        ' onclick="window._repPage=Math.min('+totalPages+',(window._repPage||1)+1);window._rpPaginate()">Sau &#9654;</button>';
  };

  /* ---- scroll buttons ---- */
  function addScrollBtns(){
    if(document.getElementById('_btnTop')) return;
    var t=document.createElement('button');
    t.id='_btnTop'; t.innerHTML='&#8679;'; t.title='L\xean \u0111\u1ea7u';
    t.style.cssText='display:none;position:fixed;right:18px;bottom:72px;width:40px;height:40px;border-radius:50%;border:none;background:var(--pr,#1976d2);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:9999;align-items:center;justify-content:center';
    t.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
    var b=document.createElement('button');
    b.id='_btnBot'; b.innerHTML='&#8681;'; b.title='Xu\u1ed1ng cu\u1ed1i';
    b.style.cssText='display:none;position:fixed;right:18px;bottom:22px;width:40px;height:40px;border-radius:50%;border:none;background:var(--pr,#1976d2);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);z-index:9999;align-items:center;justify-content:center';
    b.onclick=function(){window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});};
    document.body.appendChild(t);
    document.body.appendChild(b);
    window.addEventListener('scroll',function(){
      var y=window.scrollY||document.documentElement.scrollTop;
      var max=document.documentElement.scrollHeight-window.innerHeight;
      t.style.display=y>200?'flex':'none';
      b.style.display=y<max-200?'flex':'none';
    },{passive:true});
  }

  /* ---- MutationObserver: re-paginate after each app render ---- */
  var _obs = null;
  var _timer = null;
  function onMutation(){
    clearTimeout(_timer);
    _timer = setTimeout(function(){
      var wrap = document.getElementById('repair-list');
      if(!wrap) return;
      var count = 0;
      for(var i=0;i<wrap.children.length;i++){
        if(wrap.children[i].id !== '_rpNav') count++;
      }
      if(count > 5) window._rpPaginate();
    }, 400);
  }

  function startObs(){
    if(_obs) return;
    var wrap = document.getElementById('repair-list');
    if(!wrap) return;
    _obs = new MutationObserver(onMutation);
    _obs.observe(wrap, {childList:true, subtree:false});
    addScrollBtns();
    window._patch2Active = true;
    if(wrap.children.length > 5) onMutation();
    console.log('[patch2] active');
  }

  var _lastHref = '';
  setInterval(function(){
    var h = location.href;
    if(h !== _lastHref){
      _lastHref = h;
      _obs = null;
      window._patch2Active = false;
      setTimeout(startObs, 600);
    }
    if(!_obs) startObs();
  }, 800);

  startObs();
})();
