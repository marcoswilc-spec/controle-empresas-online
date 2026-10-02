(function(){
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function injectCss(){
    if(document.getElementById('contaiLoginFixCss')) return;
    var css = document.createElement('style');
    css.id = 'contaiLoginFixCss';
    css.textContent = '#contaiLoginFixBtn{position:fixed;right:22px;bottom:22px;z-index:2147483647;border:0;border-radius:999px;background:#0078d4;color:#fff;padding:14px 20px;font-family:Segoe UI,Arial,sans-serif;font-size:14px;font-weight:800;box-shadow:0 18px 45px rgba(0,0,0,.28);cursor:pointer}';
    document.head.appendChild(css);
  }

  function showLogin(sourceEl){
    try {
      if(typeof window.abrirLoginPopup === 'function') {
        window.abrirLoginPopup(sourceEl || null);
      }
    } catch(e) {}

    var ids = ['loginPopup','loginModal','modalLogin'];
    var popup = null;
    for(var i=0;i<ids.length;i++){
      popup = document.getElementById(ids[i]);
      if(popup) break;
    }
    if(!popup){
      alert('Modal de login não localizado no HTML publicado. Precisamos corrigir o bloco de login no index.html.');
      return;
    }

    popup.classList.remove('closing','hidden','hide');
    popup.classList.add('open','active','show');
    popup.setAttribute('aria-hidden','false');
    popup.style.display = 'flex';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
    popup.style.pointerEvents = 'auto';
    popup.style.zIndex = '2147483646';
    document.body.classList.add('login-modal-open');

    setTimeout(function(){
      var fields = popup.querySelectorAll('input');
      if(fields && fields.length) fields[0].focus();
    },100);
  }

  ready(function(){
    injectCss();
    if(!document.getElementById('contaiLoginFixBtn')){
      var b = document.createElement('button');
      b.id = 'contaiLoginFixBtn';
      b.type = 'button';
      b.textContent = 'Entrar';
      b.addEventListener('click', function(){ showLogin(b); });
      document.body.appendChild(b);
    }

    document.addEventListener('click', function(ev){
      var el = ev.target && ev.target.closest ? ev.target.closest('button,a') : null;
      if(!el || el.id === 'contaiLoginFixBtn') return;
      var txt = (el.textContent || '').toLowerCase();
      if(txt.indexOf('login') >= 0 || txt.indexOf('entrar') >= 0){
        ev.preventDefault();
        ev.stopPropagation();
        showLogin(el);
      }
    }, true);
  });
})();
