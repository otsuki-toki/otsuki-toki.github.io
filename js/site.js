// =====================================================================
//  設定（ここを直すと動きが変わる）
// =====================================================================
var LINES   = ['……はじめまして。','大月 ときです。','歌って踊って、たまに人生について考えてます。'];
var THANKS  = '見つけてくれてありがとう。';   // ペンライトの後、手を振りながら言う言葉
var TYPE_MS = 45;          // 1文字あたり
var CHEER_MS = 1600;       // 観客のペンライトが灯っていく長さ
var FRAME_MS = 170;        // 手を振る・お辞儀の1コマ
var WAVE_SEQ = [0,1,2,3,2,3,2,3,4];     // ときキャラ.jpg「手を振る」の ①〜⑤（0始まり）
var BOW_SEQ  = [0,1,2,3];               // 「お辞儀」の ①〜④。そのあと ⑤ に戻る
var BOW_HOLD = 800;        // 頭を下げたまま止まる長さ

// ---------------------------------------------------------------------
//  スプライトシート（images/toki-sheet.png）：5列×2行。1行目=手を振る、2行目=お辞儀
// ---------------------------------------------------------------------
var CW = 54, CH = 113, ANCHOR_X = 30;     // 1コマの大きさと、足元の中心の位置
var sheet = new Image(); sheet.src = 'images/toki-sheet.png';
function drawFrame(c, row, col, x, y, rows){           // rows: 下から何行ぶん描くか（登場演出用）
  var n = rows == null ? CH : rows; if (n <= 0) return;
  c.drawImage(sheet, col*CW, row*CH + (CH-n), CW, n, x, y + (CH-n), CW, n);
}

// ---------------------------------------------------------------------
//  ステージ（240x180 のドットで描いて、拡大して表示）
// ---------------------------------------------------------------------
var SW = 240, SH = 180, FLOOR = 140, CX = 120;
var DEBUG_STILL = /still/.test(location.search);   // 確認用：ループを止めてコマ送りで描画する
var cv = document.getElementById('scene'), ctx = cv.getContext('2d');
cv.width = SW; cv.height = SH;
function fitScene(){
  var s = Math.min(innerWidth / SW, innerHeight * 0.80 / SH);
  if (s >= 2) s = Math.floor(s);
  cv.style.width = (SW*s) + 'px'; cv.style.height = (SH*s) + 'px';
}
function rnd(seed){ var a = seed; return function(){ a = (a*9301 + 49297) % 233280; return a / 233280; }; }

var stars = []; (function(){ var r = rnd(7); for (var i=0;i<60;i++) stars.push([r()*SW|0, r()*100|0, i%3]); })();

// 観客席（後ろ姿のシルエット）
var crowd = [], pens = [];
(function(){
  var r = rnd(21);
  [[160, 7, 5, '#2b2352', 19], [178, 10, 7, '#110c26', 30]].forEach(function(row){   // [頭の高さ, 頭の幅, 頭の高さ, 色, 間隔]
    for (var x = 4 + r()*8; x < SW; x += row[4] + r()*7) crowd.push({x:x|0, y:row[0], w:row[1], h:row[2], col:row[3]});
  });
  var cols = ['#b9a9ff','#b9a9ff','#b9a9ff','#ff9fc0','#ffffff','#7fe0ff','#ffd56a','#b9a9ff'];
  crowd.forEach(function(p, i){
    pens.push({p:p, col:cols[(r()*cols.length)|0], base:(r()-.5)*0.7, ph:r()*6.28, order:r()});
  });
  pens.sort(function(a,b){return a.order-b.order;});
})();

var S = {show:false, reveal:CH, row:0, col:0, bounce:0, t:0, spot:0, crowd:0};
function blob(c, cx, cy, w, h){ for (var dy=-h; dy<=h; dy++){ var ww = Math.round(Math.sqrt(1-(dy/h)*(dy/h))*w); c.fillRect(cx-ww, cy+dy, ww*2, 1); } }
function drawCrowd(c){
  crowd.forEach(function(p){                       // 肩と頭
    c.fillStyle = p.col; blob(c, p.x, p.y, p.w, p.h); c.fillRect(p.x-p.w*1.9|0, p.y+p.h-1, p.w*3.8|0, SH);
    c.fillStyle = 'rgba(190,170,255,.45)'; c.fillRect(p.x-p.w+3, p.y-p.h, p.w*2-6, 1);   // 頭の上のふち
  });
  var lit = Math.floor(S.crowd * pens.length);
  for (var i=0; i<lit; i++){                       // ペンライト（腕＋棒）
    var q = pens[i], p = q.p, sway = Math.sin(S.t/(240+i%5*35) + q.ph)*0.6;
    var ang = -Math.PI/2 + q.base + sway, sx = p.x + p.w*1.2, sy = p.y + p.h - 2, LEN = 30;
    for (var k=0; k<LEN; k++){
      var x = Math.round(sx + Math.cos(ang)*k), y = Math.round(sy + Math.sin(ang)*k);
      c.fillStyle = k < 7 ? p.col : (k >= LEN-5 ? '#ffffff' : q.col); c.fillRect(x, y, 2, k < 7 ? 2 : 1);
      if (k === LEN-1){                                    // 先の光（十字）
        c.fillStyle = q.col; c.globalAlpha = .35; c.fillRect(x-1, y-3, 4, 8); c.fillRect(x-3, y-1, 8, 4); c.globalAlpha = 1;
      }
    }
  }
}
function drawScene(){
  var c = ctx; c.clearRect(0,0,SW,SH);
  if (S.crowdTarget != null) S.crowd += (S.crowdTarget - S.crowd) * (DEBUG_STILL ? 0.12 : 0.04);   // 観客のペンライトがだんだん灯る
  var bands = ['#0b0818','#0f0b24','#140f2e','#191338','#1e1742','#231b4c','#281f56'];       // 夜空
  var bh = Math.ceil(FLOOR / bands.length);
  for (var i=0;i<bands.length;i++){ c.fillStyle = bands[i]; c.fillRect(0, i*bh, SW, bh); }
  stars.forEach(function(s){ var tw = ((S.t/450|0)+s[2]) % 3 === 0; c.fillStyle = tw ? '#ffffff' : '#8d86c7'; c.fillRect(s[0], s[1], 1, 1); });
  var a = S.spot;
  if (a > 0){                                                                                  // スポットライト
    for (var y=0; y<FLOOR; y++){ var w = 26 + y*0.55; c.fillStyle = 'rgba(255,240,255,'+((0.05+0.14*y/FLOOR)*a)+')'; c.fillRect(Math.round(CX-w/2), y, Math.round(w), 1); }
    c.fillStyle = 'rgba(255,240,255,'+(0.22*a)+')'; c.fillRect(CX-60, FLOOR-1, 120, 1);
  }
  c.fillStyle = '#2b2150'; c.fillRect(0, FLOOR, SW, SH-FLOOR);                               // 床
  c.fillStyle = '#8a78e0'; c.fillRect(0, FLOOR, SW, 1);
  c.fillStyle = '#352a63'; for (var x=0; x<SW; x+=24) c.fillRect(x, FLOOR+1, 1, SH-FLOOR);
  c.fillStyle = '#231a45'; c.fillRect(0, FLOOR+13, SW, 1);
  if (S.show){                                                                                 // ときキャラ
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(CX-22, FLOOR+1, 44, 4);
    drawFrame(c, S.row, S.col, CX-ANCHOR_X, FLOOR+3-CH-(S.bounce?1:0), S.reveal);
  }
  drawCrowd(c);                                                                                // 観客（手前）
}
(function loop(now){
  S.t = now;
  drawScene(); if (!DEBUG_STILL) requestAnimationFrame(loop);
})(0);

// ---------------------------------------------------------------------
//  進行（登場 → しゃべる → 観客のペンライト → ありがとう＋手を振る → お辞儀 → 幕 → ページ）
// ---------------------------------------------------------------------
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var dlg = document.getElementById('dlg'), txt = document.getElementById('txt'), nx = document.getElementById('nx');
var page = document.getElementById('page'), curtain = document.getElementById('curtain'), stage = document.getElementById('stage');
var ctrlEl = document.querySelector('.ctrl'), skipBtn = document.getElementById('skip'), replayBtn = document.getElementById('replay');
var run = 0, skipped = false;
function sleep(ms){ return new Promise(function(r){ setTimeout(function(){ if (DEBUG_STILL){ S.t = performance.now(); drawScene(); } r(); }, skipped ? 0 : ms); }); }
function alive(my){ return my === run && !skipped; }

async function type(my, line){
  txt.textContent = ''; nx.hidden = true;
  for (var i=1; i<=line.length; i++){
    if (!alive(my)) return; txt.textContent = line.slice(0, i);
    S.bounce = (i % 5 === 0); await sleep(TYPE_MS);
  }
  S.bounce = false; nx.hidden = false;
}
async function frames(my, row, seq){
  for (var i=0; i<seq.length; i++){ if (!alive(my)) return; S.row = row; S.col = seq[i]; await sleep(FRAME_MS); }
}
function resetState(){
  S.show = false; S.reveal = CH; S.row = 0; S.col = 0; S.bounce = 0; S.spot = 0; S.crowd = 0; S.crowdTarget = null;
}
async function play(phase){
  var my = ++run; skipped = false;
  siteMode(false); clearFlow(); page.classList.remove('on','reveal'); stage.style.display = ''; curtain.className = 'curtain';
  replayBtn.hidden = true; skipBtn.hidden = false; ctrlEl.classList.remove('end'); dlg.classList.remove('on'); txt.textContent = '';
  resetState();
  if (reduce || phase === 'page'){ showPage(); return; }
  if (phase && phase !== 'full'){ preview(phase); return; }

  // ① 暗がりでスポットライトがつき、ときが下から現れる
  await sleep(350);
  for (var a=1; a<=4 && alive(my); a++){ S.spot = a/4; await sleep(110); }
  S.show = true;
  for (var r=8; r<=CH+8 && alive(my); r+=8){ S.reveal = Math.min(CH, r); await sleep(28); }
  S.reveal = CH; await sleep(250);
  // ② しゃべる（最後の1行のあいだに、観客のペンライトが灯っていく）
  dlg.classList.add('on');
  await type(my, LINES[0]); await sleep(380);
  await type(my, LINES[1]); await sleep(380);
  S.crowdTarget = 1;
  await type(my, LINES[2]); await sleep(Math.max(300, CHEER_MS - LINES[2].length*TYPE_MS));
  // ③ 「ありがとう」を言いながら手を振る
  await Promise.all([ type(my, THANKS), frames(my, 0, WAVE_SEQ) ]);
  S.row = 0; S.col = 0; await sleep(300);
  dlg.classList.remove('on');
  // ④ お辞儀
  await frames(my, 1, BOW_SEQ); await sleep(BOW_HOLD);
  S.row = 1; S.col = 4; await sleep(350);
  if (!alive(my)){ if (skipped) showPage(); return; }
  // ⑤ 幕が降りて、上がると本編のページ
  curtain.className = 'curtain drop'; await sleep(720);
  if (!alive(my)){ if (skipped) showPage(); return; }
  stage.style.display = 'none'; page.classList.add('on','reveal'); siteMode(true); skipBtn.hidden = true;   // 幕の裏で本編を用意
  await sleep(150);
  page.classList.add('reveal');                                                            // 光が流れ始めると同時に、下で写真と文字が浮かぶ
  await lightFlow();
  curtain.className = 'curtain'; finishUI();
}
function preview(phase){                       // 確認用：?phase=cheer / wave / bow で、その場面だけ静止表示
  S.spot = 1; S.show = true; S.crowd = 1; S.crowdTarget = 1;
  if (phase === 'wave'){ S.row = 0; S.col = 3; dlg.classList.add('on'); txt.textContent = THANKS; }
  if (phase === 'bow'){ S.row = 1; S.col = 3; }
  if (phase === 'cheer'){ dlg.classList.add('on'); txt.textContent = LINES[2]; }
  if (DEBUG_STILL){ S.t = performance.now(); drawScene(); }
}
function clearFlow(){ document.querySelectorAll('.flow').forEach(function(n){ n.remove(); }); curtain.style.visibility = ''; }
function lightFlow(){                           // 幕の縦じまを24本に分け、中央から外へ、下から上へ光になって消えていく
  var N = innerWidth < 600 ? 12 : 24, wrap = document.createElement('div'), cols = [];
  wrap.className = 'flow';
  for (var i=0; i<N; i++){
    var col = document.createElement('div'), fab = document.createElement('div');
    col.className = 'col'; col.style.left = (i*100/N) + 'vw'; col.style.width = 'calc(' + (100/N) + 'vw + 1px)';
    fab.className = 'fabric'; fab.style.left = (-i*100/N) + 'vw'; fab.style.width = '100vw';
    col.appendChild(fab); wrap.appendChild(col); cols.push(col);
  }
  document.body.appendChild(wrap); curtain.style.visibility = 'hidden';
  wrap.animate([{filter:'brightness(1)'},{filter:'brightness(1.8) saturate(1.3)'}], {duration:380, fill:'forwards', easing:'ease-out'});   // まず幕が光る
  cols.forEach(function(col, i){
    var d = 260 + Math.abs(i-(N-1)/2) * (520/(N/2));
    col.animate([{height:'112vh'},{height:'0px'}], {duration:900, delay:d, easing:'cubic-bezier(.6,0,.3,1)', fill:'forwards'});
  });
  return sleep(260 + 520 + 900 + 100).then(clearFlow);
}
function siteMode(on){ document.documentElement.classList.toggle('site', on); if (!on) scrollTo(0, 0); }
function jump(el){ if (el) scrollTo({top: el.getBoundingClientRect().top + scrollY, behavior: 'instant'}); }
function showPage(){ siteMode(true); clearFlow(); run++; stage.style.display = 'none'; dlg.classList.remove('on'); curtain.className = 'curtain'; page.classList.add('on'); setTimeout(function(){ page.classList.add('reveal'); }, 60); finishUI(); }
function finishUI(){ try { sessionStorage.setItem('introSeen','1'); } catch(e){} skipBtn.hidden = true; replayBtn.hidden = true; ctrlEl.classList.add('end'); }

skipBtn.onclick = function(){ skipped = true; showPage(); };
replayBtn.onclick = function(){ play(); };
document.getElementById('replay2').onclick = function(){ play('full'); };
// 背景の星空（ゆっくり瞬き、スクロールで少しずれる。ときどき流れ星）
(function(){
  var cv = document.getElementById('cosmos'), c = cv.getContext('2d'), W = 0, H = 0, dpr = 1, stars = [], shoot = null, y = 0, tick = 0;
  function seed(){
    dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    var n = Math.round(innerWidth * innerHeight / 7000), r = rnd(11); stars = [];
    for (var i = 0; i < n; i++){ var z = r(); stars.push({x:r()*W, y:r()*H, z:z, r:(0.4 + z*1.1)*dpr, ph:r()*6.28, sp:0.4 + r()*1.2, c:r() < .12 ? '#ff9fc0' : (r() < .3 ? '#b9a9ff' : '#ffffff')}); }
  }
  function draw(t){
    c.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++){
      var s = stars[i], yy = ((s.y - y * (0.04 + s.z*0.22) * dpr) % H + H) % H;
      c.globalAlpha = (reduce ? .5 : .25 + .5 * (0.5 + 0.5*Math.sin(t/1000*s.sp + s.ph))) * (0.35 + s.z*.65);
      c.fillStyle = s.c; c.beginPath(); c.arc(s.x, yy, s.r, 0, 6.283); c.fill();
    }
    if (!reduce){
      if (!shoot && Math.random() < 0.0025){ shoot = {x:Math.random()*W*0.8, y:Math.random()*H*0.4, l:0}; }
      if (shoot){ shoot.l += 14*dpr; shoot.x += 10*dpr; shoot.y += 5*dpr; var a = Math.max(0, 1 - shoot.l/(260*dpr));
        var g = c.createLinearGradient(shoot.x, shoot.y, shoot.x - 90*dpr, shoot.y - 45*dpr); g.addColorStop(0, 'rgba(255,255,255,'+a+')'); g.addColorStop(1, 'rgba(185,169,255,0)');
        c.globalAlpha = 1; c.strokeStyle = g; c.lineWidth = 1.4*dpr; c.beginPath(); c.moveTo(shoot.x, shoot.y); c.lineTo(shoot.x - 90*dpr, shoot.y - 45*dpr); c.stroke();
        if (a <= 0) shoot = null; }
    }
    c.globalAlpha = 1;
  }
  function loop(t){ if (page.classList.contains('on') && !DEBUG_STILL){ if ((tick++ & 1) === 0) draw(t); } requestAnimationFrame(loop); }
  addEventListener('scroll', function(){ y = scrollY; if (reduce) draw(0); }, {passive:true});
  addEventListener('resize', function(){ seed(); draw(0); });
  seed(); draw(0); requestAnimationFrame(loop);
  if (DEBUG_STILL) setTimeout(function(){ draw(1500); }, 300);
})();
// 固定ヘッダー・今いるセクション・写真の帯のゆっくりした動き
(function(){
  var bar = document.getElementById('bar'), band = document.getElementById('band'), bimg = band.querySelector('img');
  var links = [].slice.call(bar.querySelectorAll('nav a')), secs = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
  var ticking = false;
  function upd(){
    ticking = false;
    var y = scrollY, h = innerHeight;
    bar.classList.toggle('on', y > h * 0.7);
    var cur = -1; secs.forEach(function(s, i){ if (s && s.getBoundingClientRect().top - h * 0.4 <= 0) cur = i; });
    links.forEach(function(a, i){ a.classList.toggle('cur', i === cur); });
    if (!reduce){ var r = band.getBoundingClientRect(); if (r.bottom > 0 && r.top < h) bimg.style.transform = 'translateY(' + ((r.top + r.height/2 - h/2) * -0.12).toFixed(1) + 'px)'; }
  }
  addEventListener('scroll', function(){ if (!ticking){ ticking = true; requestAnimationFrame(upd); } }, {passive:true});
  upd();
})();
// ---- LIVE：これからの予定（data/live.js。update_live.py で更新） ----
(function(){
  var d = new Date(), pad = function(n){ return (n < 10 ? '0' : '') + n; };
  var today = d.getFullYear() + '.' + pad(d.getMonth()+1) + '.' + pad(d.getDate());
  var list = (window.LIVE || []).filter(function(e){ return e.date >= today; }).slice(0, 3);     // 今日以降の先頭3件（日付が過ぎたものは自動で消える）
  var ol = document.getElementById('nextShows'), note = document.querySelector('.live-note');
  if (!list.length){ if (note) note.textContent = '最新の予定は「ALL SCHEDULE」から見られます。'; ol.remove(); return; }
  list.forEach(function(e, i){
    var li = document.createElement('li'); li.className = 'gig';
    var d = document.createElement('div'); d.className = 'd';
    var b = document.createElement('b'); b.textContent = e.date.slice(5);
    var sp = document.createElement('span'); sp.textContent = e.date.slice(0, 4) + ' · ' + e.dow;
    d.append(b, sp);
    var t = document.createElement('div');
    if (i === 0){ var nx = document.createElement('em'); nx.className = 'nx'; nx.textContent = 'NEXT'; t.appendChild(nx); }
    var h = document.createElement('h3'); h.textContent = e.title; t.appendChild(h);
    if (e.place){ var v = document.createElement('p'); v.textContent = e.place; t.appendChild(v); }
    li.append(d, t); ol.appendChild(li);
  });
})();
// ---- DIARY：noteの最新記事（data/notes.js。update_notes.py で更新） ----
(function(){
  var ok = function(u, host){ try { var x = new URL(u); return x.protocol === 'https:' && x.hostname === host; } catch(e){ return false; } };
  var list = (window.NOTES || []).filter(function(e){ return ok(e.url, 'note.com'); }).slice(0, 3), ol = document.getElementById('posts');
  if (!list.length){ document.querySelector('#diary .lead').textContent = '記事はnoteでご覧ください。'; ol.remove(); return; }
  list.forEach(function(e, i){
    var li = document.createElement('li'); li.className = 'post sr ' + (i === 0 ? 'f' : 's');
    var a = document.createElement('a'); a.href = e.url; a.target = '_blank'; a.rel = 'noopener';
    if (e.img && ok(e.img, 'assets.st-note.com')){ var th = document.createElement('div'); th.className = 'th'; var im = document.createElement('img'); im.src = e.img; im.alt = ''; im.loading = 'lazy'; th.appendChild(im); a.appendChild(th); }
    var tm = document.createElement('time'); tm.textContent = e.date;
    var h = document.createElement('h3'); h.textContent = e.title;
    var tx = document.createElement('div'); tx.append(tm, h); a.appendChild(tx); li.appendChild(a); ol.appendChild(li);
  });
})();
// ---- PHOTO：拡大表示 ----
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
addEventListener('resize', fitScene);
var srObs = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); srObs.unobserve(e.target); } }); }, {threshold:.15});
document.querySelectorAll('.sr').forEach(function(el, i){ el.style.transitionDelay = (i % 4) * 0.08 + 's'; srObs.observe(el); });
var sc = (location.search.match(/scroll=(\w+)/)||[])[1];
if (sc) addEventListener('load', function(){ setTimeout(function(){ jump(document.getElementById(sc)); }, 400); });
fitScene();
var q = (location.search.match(/phase=(\w+)/)||[])[1];
var ready = new Promise(function(r){ if (sheet.complete) r(); else sheet.onload = sheet.onerror = r; });
var seen = false; try { seen = !!sessionStorage.getItem('introSeen'); } catch(e){}
if (!q && (seen || location.hash)) q = 'page';          // 2回目以降、または別ページから戻ってきたときは、オープニングを飛ばす
Promise.race([ Promise.all([ready, document.fonts && document.fonts.ready || Promise.resolve()]), new Promise(function(r){ setTimeout(r, 1500); }) ]).then(function(){
  play(q);
  var tgt = location.hash && document.getElementById(location.hash.slice(1)); if (tgt) setTimeout(function(){ jump(tgt); }, 150);
});
