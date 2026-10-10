var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.08});
document.querySelectorAll('.sr').forEach(function(el, i){ el.style.transitionDelay = (i % 4) * 0.06 + 's'; io.observe(el); });
(function(){
  var lb = document.getElementById('lb'), im = lb.querySelector('img'), ct = lb.querySelector('.ct');
  var btns = [].slice.call(document.querySelectorAll('#gallery button')), cur = 0, opener = null;
  function show(i){ cur = (i + btns.length) % btns.length; im.src = btns[cur].querySelector('img').src; ct.textContent = (cur+1) + ' / ' + btns.length; }
  function open(i){ opener = btns[i]; show(i); lb.classList.add('on'); lb.querySelector('.x').focus(); }
  function close(){ lb.classList.remove('on'); if (opener) opener.focus(); }
  btns.forEach(function(b, i){ b.onclick = function(){ open(i); }; });
  lb.querySelector('.x').onclick = close;
  lb.querySelector('.pv').onclick = function(){ show(cur - 1); };
  lb.querySelector('.nx').onclick = function(){ show(cur + 1); };
  lb.onclick = function(e){ if (e.target === lb) close(); };
  addEventListener('keydown', function(e){ if (!lb.classList.contains('on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
})();
