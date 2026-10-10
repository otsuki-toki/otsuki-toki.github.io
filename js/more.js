var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {threshold:.12});
document.querySelectorAll('.sr').forEach(function(el, i){ el.style.transitionDelay = (i % 5) * 0.08 + 's'; io.observe(el); });
