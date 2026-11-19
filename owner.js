/* Owner tools: the reviewer, the suggestions inbox and the site stats.
   Students never need this file, so index.html only fetches it when one of these screens is opened:
   tap the "Formats" line at the bottom of the menu 5 times, or add #review, #inbox or #stats to the page address.
   It runs after the main script and uses its helpers (app, esc, DATA, SECS, VIEW, hpush, hback, whyHtml and so on). */

/* Back button for the inbox and stats: returns to Owner tools when opened from there, otherwise to the menu */
function ownerBackBtn(){ return FROM_SECRET ? '<button class="btn" data-act="ownerback">← Owner tools</button>' : '<button class="btn" data-act="menu">← Menu</button>'; }

/* ---------- REVIEWER ---------- */
const RV_KEY = 'whrev1';
let RV = {f:'all', hf:false, only:'all', pos:0, list:[], flagOut:''};
function rvLoad(){ try{ return JSON.parse(localStorage.getItem(RV_KEY) || '{}') || {}; }catch(e){ return {}; } }
let RVM = rvLoad();
function rvSave(){ try{ localStorage.setItem(RV_KEY, JSON.stringify(RVM)); }catch(e){} }
function rvKey(z, k){ return z.qs[k].k; }
/* One-time carry-over: older versions stored marks as "set id.question number". */
(function(){
  let changed = false;
  Object.keys(RVM).forEach(key => {
    const p = /^(\d+)\.(\d+)$/.exec(key); if(!p) return;
    const z = DATA.find(d => String(d.id) === p[1]), q = z && z.qs[+p[2] - 1];
    if(q && !RVM[q.k]) RVM[q.k] = RVM[key];
    delete RVM[key]; changed = true;
  });
  if(changed) rvSave();
})();
/* What the reviewer steps through: every set, one section ("sec:…"), one group of sets ("grp:…") or a single set (its id). */
function rvInScope(z){
  if(z.sec === 'Review') return false;
  if(RV.f === 'all') return true;
  if(RV.f.indexOf('sec:') === 0) return z.sec === RV.f.slice(4);
  if(RV.f.indexOf('grp:') === 0) return z.grp === RV.f.slice(4);
  return String(z.id) === RV.f;
}
function rvBuild(){
  const L = [];
  DATA.forEach((z, i) => {
    if(!rvInScope(z)) return;
    z.qs.forEach((q, k) => {
      if(RV.hf && q.t === 'fill') return;
      const m = RVM[rvKey(z, k)] || {};
      if(RV.only === 'flag' && !m.f) return;
      if(RV.only === 'todo' && m.c) return;
      L.push({i:i, k:k});
    });
  });
  RV.list = L;
  if(RV.pos >= L.length) RV.pos = Math.max(0, L.length - 1);
}
function renderSecret(){
  VIEW = 'secret'; FROM_SECRET = true;
  app.innerHTML = '<div class="top"><button class="btn" data-act="menu">← Menu</button><div class="ttl">Owner tools</div></div>' +
    '<button class="card" data-rv="open"><span class="num">🔍</span><span><div class="t">Reviewer</div><div class="s">Step through every question with the answer and guide line, flag or mark as checked</div></span></button>' +
    '<button class="card" data-act="inbox"><span class="num">📥</span><span><div class="t">Suggestions inbox</div><div class="s">Only you can see this</div></span></button>' +
    '<button class="card" data-act="stats"><span class="num">📊</span><span><div class="t">Site stats</div><div class="s">Visitors, and which sections and sets people open</div></span></button>';
  window.scrollTo(0, 0);
}
function renderReviewer(){
  VIEW = 'rev'; rvBuild();
  const L = RV.list, n = L.length;
  let all = 0, chk = 0, flg = 0;
  DATA.forEach(z => { if(!rvInScope(z)) return; z.qs.forEach((q, k) => { all++; const m = RVM[rvKey(z, k)] || {}; if(m.c) chk++; if(m.f) flg++; }); });
  let h = '<div class="top"><button class="btn" data-rv="exit">' + (FROM_SECRET ? '← Owner tools' : '← Menu') + '</button><div class="ttl">Reviewer</div><div class="cnt">' + (n ? RV.pos + 1 : 0) + ' / ' + n + '</div></div>';
  const live = DATA.filter(z => z.sec !== 'Review' && !z.soon), grps = [];
  live.forEach(z => { if(z.grp && grps.indexOf(z.grp) < 0) grps.push(z.grp); });
  const pick = (v, label) => '<option value="' + esc(v) + '"' + (RV.f === String(v) ? ' selected' : '') + '>' + label + '</option>';
  h += '<div class="rvbox"><label>Show <select id="rvf">' + pick('all', 'Every set') +
    SECS.map(sc => pick('sec:' + sc.key, sc.name + ' (all)')).join('') + grps.map(g => pick('grp:' + g, esc(g) + ' (all)')).join('') +
    live.map(z => pick(z.id, esc(z.lab || z.title))).join('') + '</select></label>' +
    '<label>Filter <select id="rvo"><option value="all"' + (RV.only === 'all' ? ' selected' : '') + '>All questions</option><option value="todo"' + (RV.only === 'todo' ? ' selected' : '') + '>Not yet checked</option><option value="flag"' + (RV.only === 'flag' ? ' selected' : '') + '>Flagged only</option></select></label>' +
    '<label class="rvck"><input type="checkbox" id="rvhf"' + (RV.hf ? ' checked' : '') + '> Skip fill-in (date) questions</label>' +
    '<div class="rvgo"><label>Go to # <input id="rvn" type="number" min="1" max="' + Math.max(1, n) + '" value="' + (n ? RV.pos + 1 : '') + '" inputmode="numeric"></label><button class="btn" data-rv="go">Go</button></div>' +
    '<div class="rvst">' + chk + ' checked · ' + flg + ' flagged · ' + all + ' total in this scope</div></div>';
  if(!n){
    h += '<div class="menu-note">No questions match this filter.</div>';
  } else {
    const e = L[RV.pos], z = DATA[e.i], q = z.qs[e.k], m = RVM[rvKey(z, e.k)] || {};
    h += '<div class="rvnav"><button class="btn" data-rv="m10">« 10</button><button class="btn" data-rv="prev">‹ Prev</button><button class="btn primary" data-rv="next">Next ›</button><button class="btn" data-rv="p10">10 »</button></div>';
    h += '<div class="qcard"><span class="tag">' + esc(z.lab || z.title) + ' · Q' + (e.k + 1) + ' · ' + esc(q.s) + '</span><p class="q">' + esc(q.q) + '</p>';
    if(q.img) h += mapImg(q.img, 'Map');
    if(q.items) h += '<div class="items">' + q.items.map(t => '<div>' + esc(t) + '</div>').join('') + '</div>';
    if(q.t === 'tf'){
      h += '<div class="tf2">' + [true, false].map(v => '<div class="opt tfb' + (v === q.a ? ' ok' : '') + '">' + (v ? 'True' : 'False') + '</div>').join('') + '</div>';
    } else if(q.t === 'mc'){
      h += '<div class="opts">' + q.o.map((o, k) => '<div class="opt' + (k === q.a ? ' ok' : '') + '"><span class="l">' + 'ABCDE'[k] + '</span><span>' + esc(o) + '</span></div>').join('') + '</div>';
    }
    h += '<div class="fb ok"><b>Answer</b><div class="ans">' + esc(ansText(q)) + '</div></div>' +
      whyHtml(q, null, 'Guide line') +
      '<div class="rvact"><button class="btn' + (m.c ? ' primary' : '') + '" data-rv="chk">' + (m.c ? '✓ Checked' : 'Mark checked') + '</button>' +
      '<button class="btn' + (m.f ? ' primary' : '') + '" data-rv="flag">' + (m.f ? '⚑ Flagged' : '⚑ Flag') + '</button>' +
      '<button class="btn" data-rv="nextTodo">Next unchecked »</button></div>' +
      '<textarea id="rvnote" class="rvnote" rows="2" placeholder="Note (optional)">' + esc(m.n || '') + '</textarea></div>';
  }
  h += '<div class="rvfoot"><button class="btn" data-rv="list">Show flagged list</button><button class="btn" data-rv="clear">Clear my marks</button></div>';
  if(RV.flagOut) h += '<textarea id="rvout" class="rvnote" rows="8" readonly>' + esc(RV.flagOut) + '</textarea>';
  app.innerHTML = h;
}
function rvCur(){ const e = RV.list[RV.pos]; return e ? {z:DATA[e.i], k:e.k} : null; }
function rvSaveNote(){ const t = document.getElementById('rvnote'), c = rvCur(); if(t && c){ const key = rvKey(c.z, c.k); const m = RVM[key] = RVM[key] || {}; m.n = t.value; if(!m.n && !m.c && !m.f) delete RVM[key]; rvSave(); } }
function rvMove(d){ rvSaveNote(); RV.pos = Math.min(Math.max(0, RV.pos + d), Math.max(0, RV.list.length - 1)); renderReviewer(); window.scrollTo(0, 0); }
function rvFlagList(){
  const out = [];
  DATA.forEach(z => z.qs.forEach((q, k) => { const m = RVM[rvKey(z, k)]; if(m && m.f) out.push((z.lab || z.title) + ' Q' + (k + 1) + ': ' + q.q + (m.n ? '  [note: ' + m.n + ']' : '')); }));
  return out.join('\n\n') || 'Nothing flagged yet.';
}
app.addEventListener('click', e => {
  const b = e.target.closest('[data-rv]'); if(!b) return;
  const a = b.dataset.rv;
  if(a === 'open'){ hpush('rev'); renderReviewer(); window.scrollTo(0, 0); return; }
  if(a === 'exit'){ rvSaveNote(); hback(renderMenu); return; }
  if(a === 'next') return rvMove(1);
  if(a === 'prev') return rvMove(-1);
  if(a === 'p10') return rvMove(10);
  if(a === 'm10') return rvMove(-10);
  if(a === 'go'){ const v = parseInt((document.getElementById('rvn') || {}).value, 10); if(v >= 1) { rvSaveNote(); RV.pos = Math.min(v, RV.list.length) - 1; renderReviewer(); window.scrollTo(0, 0); } return; }
  if(a === 'chk' || a === 'flag'){
    rvSaveNote(); const c = rvCur(); if(!c) return;
    const key = rvKey(c.z, c.k); const m = RVM[key] = RVM[key] || {};
    if(a === 'chk') m.c = m.c ? 0 : 1; else m.f = m.f ? 0 : 1;
    if(!m.c && !m.f && !m.n) delete RVM[key];
    rvSave(); renderReviewer(); return;
  }
  if(a === 'nextTodo'){
    rvSaveNote(); const L = RV.list;
    for(let s = 1; s <= L.length; s++){ const p = (RV.pos + s) % L.length; const m = RVM[rvKey(DATA[L[p].i], L[p].k)] || {}; if(!m.c){ RV.pos = p; break; } }
    renderReviewer(); window.scrollTo(0, 0); return;
  }
  if(a === 'list'){ rvSaveNote(); RV.flagOut = rvFlagList(); renderReviewer(); try{ if(navigator.clipboard) navigator.clipboard.writeText(RV.flagOut).catch(function(){}); }catch(er){} return; }
  if(a === 'clear'){ if(window.confirm && !window.confirm('Clear all your checked/flagged marks and notes on this device?')) return; RVM = {}; rvSave(); RV.flagOut = ''; renderReviewer(); return; }
});
app.addEventListener('change', e => {
  const t = e.target; if(!t || VIEW !== 'rev') return;
  if(t.id === 'rvf'){ rvSaveNote(); RV.f = t.value; RV.pos = 0; renderReviewer(); }
  else if(t.id === 'rvo'){ rvSaveNote(); RV.only = t.value; RV.pos = 0; renderReviewer(); }
  else if(t.id === 'rvhf'){ rvSaveNote(); RV.hf = t.checked; RV.pos = 0; renderReviewer(); }
  else if(t.id === 'rvnote') rvSaveNote();
});
document.addEventListener('keydown', e => {
  if(VIEW !== 'rev') return; const tg = (e.target && e.target.tagName) || '';
  if(tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
  if(e.key === 'ArrowRight') rvMove(1); else if(e.key === 'ArrowLeft') rvMove(-1);
});

const ARCH = 'wh1_sugg_v1';
function loadArch(){ try{ const a = JSON.parse(localStorage.getItem(ARCH) || '{}'); return {items: a.items || {}, deleted: a.deleted || {}}; }catch(e){ return {items:{}, deleted:{}}; } }
function saveArch(a){ try{ localStorage.setItem(ARCH, JSON.stringify(a)); }catch(e){} }
function fmtDate(t){ try{ return new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric'}) + ' ' + new Date(t).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}); }catch(e){ return ''; } }
async function relayFetch(){
  const res = await fetch(RELAY + '/' + encodeURIComponent(SUGGEST.relayTopic) + '/json?poll=1&since=all');
  if(!res.ok) throw {code: 'relay', message: 'HTTP ' + res.status};
  const out = [];
  (await res.text()).split('\n').forEach(l => {
    l = l.trim(); if(!l) return;
    try{ const e = JSON.parse(l); if(e.event === 'message') out.push({id: 'n_' + e.id, t: (e.time || 0) * 1000, title: e.title || 'Suggestion', text: e.message || '', done: false}); }catch(x){}
  });
  return out;
}
async function relayDiag(){
  const out = [];
  const show = () => { const el = document.getElementById('sg-diag'); if(el) el.textContent = out.join('\n'); };
  out.push('Page address: ' + location.href); out.push('Topic: ' + SUGGEST.relayTopic); show();
  try{
    const r = await fetch(RELAY, {method: 'POST', body: JSON.stringify({topic: SUGGEST.relayTopic, title: 'Connection test', tags: ['white_check_mark'], message: 'Test from the exam page at ' + new Date().toLocaleString()})});
    out.push('Send test: ' + (r.ok ? 'OK' : 'FAILED') + ' (HTTP ' + r.status + ')');
  }catch(e){
    out.push('Send test: BLOCKED (' + ((e && e.message) || e) + '). The browser could not reach ntfy.sh from this page. Usual causes: the host or a content blocker prevents outside requests.');
  }
  show();
  try{
    const items = await relayFetch();
    out.push('Read test: OK, ' + items.length + ' message(s) currently on the relay');
  }catch(e){
    out.push('Read test: FAILED (' + ((e && e.message) || e) + ')');
  }
  show();
}

/* ---------- INBOX ---------- */
let INBOX = [];
async function renderInbox(){
  VIEW = 'inb';
  const head = '<div class="top">' + ownerBackBtn() + '<div class="ttl">Suggestions inbox</div></div>';
  app.innerHTML = head + '<div class="note">Loading…</div>';
  const notes = [];
  const arch = loadArch();
  if(SUGGEST.relayTopic){
    try{
      (await relayFetch()).forEach(it => { if(!arch.deleted[it.id] && !arch.items[it.id]) arch.items[it.id] = it; });
      saveArch(arch);
    }catch(e){ notes.push('Couldn’t reach the relay just now (' + ((e && e.message) || e) + '). Showing what’s already saved on this device. Tap “Test connection” for details.'); }
  }
  let items = Object.keys(arch.items).filter(id => !arch.deleted[id]).map(id => Object.assign({}, arch.items[id], {src: 'local'}));
  items.sort((a, b) => b.t - a.t);
  INBOX = items;
  if(VIEW !== 'inb') return;
  const open = items.filter(i => !i.done), done = items.filter(i => i.done);
  const card = it => '<div class="inb' + (it.done ? ' done' : '') + '"><div class="meta"><span>' + esc(fmtDate(it.t)) + '</span><b>' + esc(titleOf(it)) + '</b></div>' +
    '<div class="txt">' + esc(it.text) + '</div>' + (it.ctx ? '<div class="cq">' + esc(it.ctx.q) + '</div>' : '') +
    '<div class="row"><button class="btn" data-act="sugdone" data-id="' + esc(it.id) + '">' + (it.done ? 'Reopen' : 'Mark done') + '</button>' +
    '<button class="btn" data-act="sugdel" data-id="' + esc(it.id) + '">Delete</button></div></div>';
  let h = head.replace('</div></div>', '</div><div class="cnt">' + open.length + ' open</div></div>') +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="inbox">Refresh</button>' + (SUGGEST.relayTopic ? '<button class="btn" data-act="sugdiag">Test connection</button>' : '') + (open.length ? '<button class="btn" data-act="sugcopyall">Copy all open</button>' : '') + '</div>' +
    '<div id="sg-status" class="status" role="status"></div>';
  if(gformSpec()) h += '<p class="note" style="margin-top:0">Suggestions also go to your Google Form, where they are kept. ' +
    (SUGGEST.googleResponses ? '<a href="' + esc(SUGGEST.googleResponses.replace(/\/edit.*$/, '/edit#responses')) + '" target="_blank" rel="noopener">Open the form responses</a>.' : 'Open the form in Google Forms and pick Responses to read them.') + '</p>';
  if(SUGGEST.relayTopic) h += '<p class="note" style="margin-top:0">The relay keeps messages for about 12 hours. Each time you open this inbox, new ones are saved on this device.</p>';
  notes.forEach(n => { h += '<p class="note" style="color:var(--bad)">' + esc(n) + '</p>'; });
  h += '<pre id="sg-diag" style="white-space:pre-wrap;word-break:break-word;font-size:13px;margin:8px 0 0"></pre>';
  if(!items.length) h += '<div class="menu-note">No suggestions yet.</div>';
  h += open.map(card).join('');
  if(done.length) h += '<h3 style="margin-top:20px;font-size:16px;color:var(--muted)">Done (' + done.length + ')</h3>' + done.map(card).join('');
  app.innerHTML = h; window.scrollTo(0, 0);
}
function editInboxItem(b, kind){
  const id = b.dataset.id, arch = loadArch();
  if(kind === 'del'){ delete arch.items[id]; arch.deleted[id] = 1; }
  else if(arch.items[id]){ arch.items[id].done = !arch.items[id].done; }
  saveArch(arch);
}

/* Time ranges. GoatCounter's public counter only understands whole days (start=YYYY-MM-DD,
   midnight UTC), so "last 24 hours" needs GoatCounter's API, which needs an
   API key. The key is pasted on the stats page and kept only in this browser's storage. It is
   never part of the page source. With a key, every range except "all time" uses the API
   (hourly precision). Without one, 7 and 30 days use the public counter in whole UTC days. */
const GC_RANGES = [['day', '24 hours', 'Last 24 hours'], ['week', '7 days', 'Last 7 days'], ['month', '30 days', 'Last 30 days'], ['all', 'All time', 'All time']];
const GC_HOURS = {day: 24, week: 168, month: 720};
let GC_RANGE = (() => { try{ const r = (localStorage.getItem('gc_range') || '').replace(/^hour$/, 'day'); return GC_RANGES.some(x => x[0] === r) ? r : 'all'; }catch(e){ return 'all'; } })();
function gcSetRange(r){ GC_RANGE = r; try{ localStorage.setItem('gc_range', r); }catch(e){} }
function gcKey(){ try{ return localStorage.getItem('gc_api_key') || ''; }catch(e){ return ''; } }
function gcSetKey(k){ try{ if(k) localStorage.setItem('gc_api_key', k); else localStorage.removeItem('gc_api_key'); }catch(e){} }
/* Start of the range, rounded down to the hour (GoatCounter stores counts per hour). */
function gcStartMs(r){ const H = 3600000; return Math.floor((Date.now() - GC_HOURS[r] * H) / H) * H; }
function gcIso(ms){ return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z'); }
/* GoatCounter caches each public counter for 4 hours, keyed on path + start + end, so a plain
   request can return hours-old numbers. Each load sends a different far-future "end" date:
   same count, new cache key, current numbers. */
let GC_END = '';
function gcFreshEnd(){ GC_END = new Date(Date.UTC(2100, 0, 1) + (Math.floor(Date.now() / 60000) % 9000) * 86400000).toISOString().slice(0, 10); }
async function gcCount(path, start){
  if(!GC_END) gcFreshEnd();
  const res = await fetch(GC_SITE + '/counter/' + encodeURIComponent(path) + '.json?end=' + GC_END + (start ? '&start=' + start : ''), {cache: 'no-store'});
  if(res.status === 404) return 0;
  if(!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  return parseInt(String(j.count != null ? j.count : j.count_unique || '0').replace(/[^0-9]/g, ''), 10) || 0;
}
/* All paths with their visitor counts in the range, from the API: {path(lowercase): count}. */
async function gcApiHits(r){
  const out = {};
  (await gcApiRaw(gcStartMs(r), Math.ceil(Date.now() / 3600000) * 3600000)).forEach(x => { out[String(x.path).toLowerCase()] = {n: x.count || 0, ev: !!x.event}; });
  return out;
}
/* ---- Hourly graph (needs the API key) ----
   GoatCounter returns, per path, a list of days with 24 hourly visitor counts. Those days
   and hours are in the timezone set in GoatCounter, so the timeline is built in that zone
   (read from /api/v0/me; falls back to this device's zone). */
let GC_VIEWMODE = (() => { try{ return localStorage.getItem('gc_view') === 'graph' ? 'graph' : 'numbers'; }catch(e){ return 'numbers'; } })();
function gcSetView(v){ GC_VIEWMODE = v; try{ localStorage.setItem('gc_view', v); }catch(e){} }
let GC_TZ = '', GC_CHART = null;
/* Which lines the graph shows (Visitors, Section & set opens); at least one stays on. */
let GC_SHOW = (() => { try{ const o = JSON.parse(localStorage.getItem('gc_series') || '{}'); const v = o.v !== false, e = o.e !== false; return (v || e) ? {v, e} : {v: true, e: true}; }catch(err){ return {v: true, e: true}; } })();
function gcSetShow(k, on){
  const next = Object.assign({}, GC_SHOW, {[k]: on});
  if(!next.v && !next.e) return false;
  GC_SHOW = next; try{ localStorage.setItem('gc_series', JSON.stringify(GC_SHOW)); }catch(err){}
  return true;
}
function gcDrawChart(s){
  const slot = document.getElementById('gc-chart-slot');
  if(!slot) return;
  slot.innerHTML = gcChartSvg(s, Math.max(260, Math.round(slot.clientWidth || 340)));
  const el = document.getElementById('gc-chart');
  el.addEventListener('pointermove', gcChartHover);
  el.addEventListener('pointerdown', gcChartHover);
  el.addEventListener('pointerleave', gcChartLeave);
}
function gcTzOk(z){ try{ new Intl.DateTimeFormat('en', {timeZone: z}); return true; }catch(e){ return false; } }
async function gcTz(){
  if(GC_TZ) return GC_TZ;
  let z = '';
  try{
    const res = await fetch(GC_SITE + '/api/v0/me', {headers: {'Authorization': 'Bearer ' + gcKey()}, cache: 'no-store'});
    if(res.ok){
      const j = await res.json(), t = j && j.user && j.user.settings && j.user.settings.timezone;
      const m = String(typeof t === 'string' ? t : JSON.stringify(t || '')).match(/(?:[A-Za-z_]+\/[A-Za-z_+\-\/]+|UTC|Etc\/[A-Za-z0-9+\-]+)/);
      if(m && gcTzOk(m[0])) z = m[0];
    }
  }catch(e){}
  if(!z){ try{ z = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }catch(e){ z = 'UTC'; } }
  return (GC_TZ = z);
}
/* "YYYY-MM-DD HH" for a UTC instant, in zone z. */
function gcZoneKey(ms, z){
  const p = {}; new Intl.DateTimeFormat('en-CA', {timeZone: z, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'}).formatToParts(new Date(ms)).forEach(x => { p[x.type] = x.value; });
  return p.year + '-' + p.month + '-' + p.day + ' ' + p.hour;
}
async function gcApiRaw(startMs, endMs){
  const out = [], seen = [];
  const base = GC_SITE + '/api/v0/stats/hits?limit=100&start=' + gcIso(startMs) + '&end=' + gcIso(endMs);
  for(let page = 0; page < 10; page++){
    const res = await fetch(base + (seen.length ? '&exclude_paths=' + seen.join(',') : ''), {headers: {'Authorization': 'Bearer ' + gcKey()}, cache: 'no-store'});
    if(res.status === 401 || res.status === 403){ const e = new Error('GoatCounter didn’t accept the API key'); e.badKey = true; throw e; }
    if(!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    (j.hits || []).forEach(x => { out.push(x); seen.push(x.path_id); });
    if(!j.more || !(j.hits || []).length) break;
  }
  return out;
}
/* Points [{t: label ms, v: visitors, e: opens}] for the range. Hourly for up to 30 days;
   "all time" is by day over the last 180 days (hourly would be thousands of points). */
async function gcSeries(r){
  const H = 3600000, now = Date.now(), endMs = Math.ceil(now / H) * H;
  const daily = r === 'all', hours = GC_HOURS[r];
  const startMs = daily ? Math.floor((now - 180 * 24 * H) / (24 * H)) * 24 * H : Math.floor((now - hours * H) / H) * H;
  const [hits, z] = await Promise.all([gcApiRaw(startMs, endMs), gcTz()]);
  const vis = {}, ev = {};
  hits.forEach(x => (x.stats || []).forEach(s => {
    const tgt = x.event ? ev : vis;
    if(daily){ tgt[s.day] = (tgt[s.day] || 0) + (s.daily || 0); return; }
    (s.hourly || []).forEach((n, h) => { if(n){ const k = s.day + ' ' + String(h).padStart(2, '0'); tgt[k] = (tgt[k] || 0) + n; } });
  }));
  const pts = [], step = daily ? 24 * H : H;
  for(let t = daily ? startMs + 12 * H : startMs; t < endMs; t += step){
    const k = daily ? gcZoneKey(t, z).slice(0, 10) : gcZoneKey(t, z);
    if(pts.length && pts[pts.length - 1].k === k) continue;
    pts.push({t, k, v: vis[k] || 0, e: ev[k] || 0});
  }
  if(daily){ const first = pts.findIndex(p => p.v || p.e); if(first > 0) pts.splice(0, Math.max(0, first - 1)); }
  return {pts, z, daily};
}
function gcFmt(ms, z, o){ try{ return new Date(ms).toLocaleString([], Object.assign({timeZone: z}, o)); }catch(e){ return new Date(ms).toLocaleString(); } }
function gcChartSvg(s, W){
  const pts = s.pts, H = 240, L = 40, R = 12, T = 12, B = 30, iw = W - L - R, ih = H - T - B, n = pts.length;
  const maxV = Math.max(1, ...pts.map(p => Math.max(GC_SHOW.v ? p.v : 0, GC_SHOW.e ? p.e : 0)));
  const mag = Math.pow(10, Math.floor(Math.log10(maxV))), nice = [1, 2, 2.5, 5, 10].map(x => x * mag).find(x => x >= maxV / 4) || mag;
  const top = Math.ceil(maxV / nice) * nice, unit = Math.max(1, Math.round(nice));
  const x = i => L + (n <= 1 ? iw / 2 : i * iw / (n - 1)), y = v => T + ih - v / top * ih;
  let g = '';
  for(let v = 0; v <= top + 1e-9; v += unit){
    g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)" stroke-width="1"' + (v ? ' stroke-dasharray="2 3"' : '') + '/>' +
      '<text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + v.toLocaleString() + '</text>';
  }
  /* About 5 time labels, on round hours/days. */
  const want = Math.max(2, Math.min(6, Math.floor(iw / 70)));
  const span = s.daily ? [1, 2, 7, 14, 30, 60] : [1, 2, 3, 6, 12, 24, 48, 72, 168];
  const every = span.find(k => n / k <= want) || span[span.length - 1];
  const lab = s.daily ? {month: 'short', day: 'numeric'} : (n > 200 ? {month: 'short', day: 'numeric'} : n > 30 ? {weekday: 'short'} : {hour: 'numeric'});
  pts.forEach((p, i) => {
    const hr = +p.k.slice(11, 13);
    const ok = s.daily ? (n - 1 - i) % every === 0 : every >= 24 ? hr === 0 && Math.round((p.t - pts[0].t) / 864e5) % (every / 24) === 0 : hr % every === 0;
    if(ok) g += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + esc(gcFmt(p.t, s.z, lab)) + '</text>';
  });
  const line = (key, col) => '<path d="' + pts.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1)).join('') + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
  GC_CHART = {s, W, H, L, R, T, ih, x, y, n};
  return '<div id="gc-chart" style="position:relative;touch-action:pan-y">' +
    '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="' + H + '" role="img" aria-label="Line graph of visitors and section and set opens over time" style="display:block;overflow:visible">' + g +
    (GC_SHOW.e ? line('e', 'var(--viz2)') : '') + (GC_SHOW.v ? line('v', 'var(--viz1)') : '') +
    '<g id="gc-hover" style="display:none"><line id="gc-hl" y1="' + T + '" y2="' + (T + ih) + '" stroke="var(--muted)" stroke-width="1"/>' +
    '<circle id="gc-d2" r="4.5" fill="var(--viz2)" stroke="var(--card)" stroke-width="2"' + (GC_SHOW.e ? '' : ' display="none"') + '/><circle id="gc-d1" r="4.5" fill="var(--viz1)" stroke="var(--card)" stroke-width="2"' + (GC_SHOW.v ? '' : ' display="none"') + '/></g></svg>' +
    '<div id="gc-tip" role="status" style="display:none;position:absolute;top:0;pointer-events:none;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:6px 9px;font-size:.8125rem;line-height:1.45;box-shadow:0 2px 8px rgba(0,0,0,.15);white-space:nowrap"></div></div>';
}
function gcChartHover(ev){
  const c = GC_CHART, el = document.getElementById('gc-chart');
  if(!c || !el) return;
  const box = el.getBoundingClientRect(), px = (ev.clientX - box.left) * c.W / box.width;
  const i = Math.max(0, Math.min(c.n - 1, Math.round((px - c.L) / ((c.W - c.L - c.R) / Math.max(1, c.n - 1)))));
  const p = c.s.pts[i], X = c.x(i);
  document.getElementById('gc-hover').style.display = '';
  ['gc-hl'].forEach(id => { const l = document.getElementById(id); l.setAttribute('x1', X); l.setAttribute('x2', X); });
  const d1 = document.getElementById('gc-d1'), d2 = document.getElementById('gc-d2');
  d1.setAttribute('cx', X); d1.setAttribute('cy', c.y(p.v)); d2.setAttribute('cx', X); d2.setAttribute('cy', c.y(p.e));
  const tip = document.getElementById('gc-tip');
  const when = c.s.daily ? gcFmt(p.t, c.s.z, {weekday: 'short', month: 'short', day: 'numeric'}) : gcFmt(p.t, c.s.z, {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'});
  tip.innerHTML = '<div style="color:var(--muted)">' + esc(when) + '</div>' +
    (GC_SHOW.v ? '<div><span style="display:inline-block;width:10px;height:3px;border-radius:2px;background:var(--viz1);vertical-align:middle;margin-right:6px"></span>Visitors <b>' + p.v.toLocaleString() + '</b></div>' : '') +
    (GC_SHOW.e ? '<div><span style="display:inline-block;width:10px;height:3px;border-radius:2px;background:var(--viz2);vertical-align:middle;margin-right:6px"></span>Section &amp; set opens <b>' + p.e.toLocaleString() + '</b></div>' : '');
  tip.style.display = '';
  const sx = X * box.width / c.W, tw = tip.offsetWidth;
  tip.style.left = Math.max(0, Math.min(box.width - tw, sx + (sx > box.width / 2 ? -tw - 12 : 12))) + 'px';
}
function gcChartLeave(){ const a = document.getElementById('gc-hover'), b = document.getElementById('gc-tip'); if(a) a.style.display = 'none'; if(b) b.style.display = 'none'; }
async function renderStatsGraph(head, footer, r, rl){
  app.innerHTML = head + '<div class="note">Loading…</div>'; window.scrollTo(0, 0);
  let s, err = '', badKey = false;
  try{ s = await gcSeries(r); }catch(e){ err = e.message || String(e); badKey = !!e.badKey; }
  if(VIEW !== 'stats' || GC_RANGE !== r || GC_VIEWMODE !== 'graph') return;
  let h = head;
  if(err){
    app.innerHTML = h + '<p class="note" style="color:var(--bad)">Couldn’t load the graph (' + esc(err) + '). ' +
      (badKey ? 'Check that the key is right and has “Read statistics” ticked, or remove it and paste a new one.' : 'An ad blocker on this device can block it.') + '</p>' + footer;
    return;
  }
  const tv = s.pts.reduce((a, p) => a + p.v, 0), te = s.pts.reduce((a, p) => a + p.e, 0);
  const title = r === 'all' ? 'Visitors per day' : 'Visitors per hour · ' + rl.toLowerCase();
  const sw = c => '<span style="display:inline-block;width:14px;height:3px;border-radius:2px;background:' + c + ';vertical-align:middle;margin-right:6px"></span>';
  h += '<h3 style="margin:0 0 6px">' + title + '</h3>' +
    '<div role="group" aria-label="Lines to show" style="display:flex;gap:4px 16px;flex-wrap:wrap;font-size:.875rem;margin-bottom:4px">' +
    [['v', 'var(--viz1)', 'Visitors', tv], ['e', 'var(--viz2)', 'Section &amp; set opens', te]].map(x =>
      '<label style="display:inline-flex;align-items:center;gap:6px;min-height:44px;cursor:pointer"><input type="checkbox" data-act="gcser" data-k="' + x[0] + '"' + (GC_SHOW[x[0]] ? ' checked' : '') +
      ' style="width:18px;height:18px;margin:0;accent-color:' + x[1] + '">' + sw(x[1]) + x[2] + ' <b>' + x[3].toLocaleString() + '</b></label>').join('') + '</div>';
  h += '<div id="gc-chart-slot"></div>';
  const rows = s.pts.filter(p => p.v || p.e).reverse();
  h += '<details style="margin-top:10px"><summary>Show as table</summary>' +
    (rows.length ? '<table style="width:100%;border-collapse:collapse;font-size:.875rem;margin-top:6px"><thead><tr><th style="text-align:left;padding:4px 0">' + (s.daily ? 'Day' : 'Hour') + '</th><th style="text-align:right">Visitors</th><th style="text-align:right">Opens</th></tr></thead><tbody>' +
      rows.map(p => '<tr style="border-top:1px solid var(--line)"><td style="padding:4px 0">' + esc(gcFmt(p.t, s.z, s.daily ? {weekday: 'short', month: 'short', day: 'numeric'} : {weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'})) + '</td><td style="text-align:right">' + p.v.toLocaleString() + '</td><td style="text-align:right">' + p.e.toLocaleString() + '</td></tr>').join('') + '</tbody></table>'
      : '<p class="note">No visits in this period.</p>') + '</details>';
  h += '<p class="note">' +
    (s.daily ? 'All time is shown by day for the last 180 days; hourly would be too many points to read. ' : '') +
    'Times are in your GoatCounter timezone (' + esc(s.z) + '). ' + (s.daily ? 'Each day counts unique visitors that day, so someone who comes back on two days is counted on both.' : 'Each hour counts unique visitors in that hour, so someone who stays across two hours is counted in both.') + ' Tap or hover the graph to see each ' + (s.daily ? 'day' : 'hour') + '.</p>' + footer;
  app.innerHTML = h;
  gcDrawChart(s);
}
async function renderStats(){
  VIEW = 'stats';
  const r = GC_RANGE, key = gcKey(), rl = GC_RANGES.find(x => x[0] === r)[2];
  const head = '<div class="top">' + ownerBackBtn() + '<div class="ttl">Site stats</div></div>' +
    '<div class="seg" role="group" aria-label="Time range" style="margin-bottom:14px">' + GC_RANGES.map(x => '<button data-act="gcrange" data-r="' + x[0] + '" aria-pressed="' + (x[0] === r) + '">' + x[1] + '</button>').join('') + '</div>' +
    '<div class="seg" role="group" aria-label="Show as" style="margin-bottom:14px">' + [['numbers', 'Numbers'], ['graph', 'Line graph']].map(x => '<button data-act="gcview" data-v="' + x[0] + '" aria-pressed="' + (x[0] === GC_VIEWMODE) + '">' + x[1] + '</button>').join('') + '</div>';
  const keyLine = key ? '<p class="note">API key: saved on this device. <button class="link" data-act="gckeydel">Remove key</button></p>' : '';
  const footer = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn" data-act="stats">Refresh</button></div>' + keyLine;
  const graph = GC_VIEWMODE === 'graph';
  if((graph || GC_HOURS[r] <= 24) && !key){
    app.innerHTML = head +
      '<h3>' + (graph ? 'The line graph' : rl) + ' needs a GoatCounter API key</h3>' +
      '<p class="note">GoatCounter’s public counter only counts whole days' + (graph ? ' and has no hour-by-hour data' : '') + '. For ' + (graph ? 'the graph' : 'the last 24 hours') + ', this page has to ask GoatCounter’s API, which needs a key. You only do this once per device. The key is saved in this browser only, and is never part of the website.</p>' +
      '<ol class="note" style="padding-left:20px"><li>Open <a href="' + GC_SITE + '/user/api" target="_blank" rel="noopener">GoatCounter → Settings → API</a>.</li>' +
      '<li>Create a new key and tick <b>only “Read statistics”</b>.</li><li>Copy the key and paste it below.</li></ol>' +
      '<label class="lbl" for="gc-key">API key</label><input id="gc-key" class="field" autocomplete="off" spellcheck="false" placeholder="Paste your GoatCounter API key">' +
      '<div style="margin-top:10px"><button class="btn" data-act="gckeysave">Save key</button></div>' +
      '<p class="note">Only save it on your own devices: anyone using this browser could read your stats with it. You can delete the key in GoatCounter at any time.</p>' + footer;
    window.scrollTo(0, 0);
    return;
  }
  if(graph) return renderStatsGraph(head, footer, r, rl);
  app.innerHTML = head + '<div class="note">Loading…</div>'; window.scrollTo(0, 0);
  const secs = SECS.filter(sc => sc.key !== 'Review');
  const sets = DATA.filter(z => z.sec !== 'Review' && !z._src && !z.soon);
  const page = location.pathname || '/';
  let total = null, visits = null, secN, misN, setN, errMsg = '', badKey = false, approx = false;
  if(r !== 'all' && key){
    try{
      const m = await gcApiHits(r);
      const get = p => (m[p.toLowerCase()] || {n: 0}).n;
      secN = secs.map(sc => get(gcSecPath(sc)));
      misN = secs.map(sc => get(gcMissPath(sc)));
      setN = sets.map(z => get(gcSetPath(z)));
      visits = 0; total = 0;
      Object.keys(m).forEach(p => { total += m[p].n; if(!m[p].ev) visits += m[p].n; });
    }catch(e){
      errMsg = e.message || String(e); badKey = !!e.badKey;
      secN = secs.map(() => null); misN = secN.slice(); setN = sets.map(() => null);
    }
  } else {
    /* Public counter: whole UTC days. "Last 7 days" counts from midnight UTC 6 days ago. */
    let start = '';
    if(r !== 'all'){ approx = true; start = new Date(Date.now() - (GC_HOURS[r] / 24 - 1) * 86400000).toISOString().slice(0, 10); }
    gcFreshEnd();
    const jobs = [gcCount('TOTAL', start), gcCount(page, start)]
      .concat(secs.map(sc => gcCount(gcSecPath(sc), start)))
      .concat(secs.map(sc => gcCount(gcMissPath(sc), start)))
      .concat(sets.map(z => gcCount(gcSetPath(z), start)));
    const got = await Promise.allSettled(jobs);
    const val = x => x.status === 'fulfilled' ? x.value : null;
    const failed = got.filter(x => x.status === 'rejected');
    if(failed.length === got.length) errMsg = String((failed[0].reason && failed[0].reason.message) || failed[0].reason);
    total = val(got[0]);
    const pageN = val(got[1]);
    secN = secs.map((_, i) => val(got[2 + i]));
    misN = secs.map((_, i) => val(got[2 + secs.length + i]));
    setN = sets.map((_, i) => val(got[2 + 2 * secs.length + i]));
    /* GoatCounter keeps "/x/", "/x/index.html", "/x?y" etc. as separate pages, so the
       count for this one path can miss visitors. Total minus the events we track covers
       every variant; use whichever is larger. */
    const evN = secN.concat(misN, setN).reduce((a, n) => a + (n || 0), 0);
    visits = total == null ? pageN : Math.max(pageN || 0, total - evN);
  }
  if(VIEW !== 'stats' || GC_RANGE !== r || GC_VIEWMODE !== 'numbers') return;
  const num = v => v == null ? '–' : v.toLocaleString();
  let h = head;
  if(errMsg){
    h += '<p class="note" style="color:var(--bad)">Couldn’t load the counts (' + esc(errMsg) + '). ' +
      (badKey ? 'Check that the key is right and has “Read statistics” ticked, or remove it and paste a new one.</p>' :
        key && r !== 'all' ? 'An ad blocker on this device can block it.</p>' :
        'In GoatCounter, open <b>Settings</b> and turn on <b>“Allow adding visitor counts on your website”</b>, then refresh. An ad blocker on this device can also block it.</p>');
  }
  h += '<div class="pair">' +
    '<div class="tile"><span class="t" style="font-size:28px">' + num(visits) + '</span><span class="s">Visitors to the site · ' + rl.toLowerCase() + '</span></div>' +
    '<div class="tile"><span class="t" style="font-size:28px">' + num(total) + '</span><span class="s">All tracked activity (visits + section and set opens)</span></div></div>';
  const bars = rows => {
    const max = Math.max(1, ...rows.map(x => x.n || 0));
    return rows.map(x => '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;gap:8px"><span>' + x.label + '</span><b>' + num(x.n) + '</b></div>' +
      '<div class="bar" style="margin:4px 0 0"><i style="width:' + ((x.n || 0) / max * 100) + '%"></i></div></div>').join('');
  };
  h += '<h3 style="margin-top:20px">Sections opened · ' + rl.toLowerCase() + '</h3>' + bars(secs.map((sc, i) => ({label: sc.name, n: secN[i]})));
  secs.forEach((sc, si) => {
    const rows = sets.map((z, i) => ({z, n: setN[i]})).filter(x => x.z.sec === sc.key).map(x => ({label: esc(x.z.title) + (x.z.grp ? ' <span style="color:var(--muted)">· ' + esc(x.z.grp) + '</span>' : ''), n: x.n}));
    rows.push({label: '<i>Missed questions review</i>', n: misN[si]});
    h += '<h3 style="margin-top:20px">' + sc.name + ': sets started</h3>' + bars(rows);
  });
  const rangeNote = r === 'all' ? 'All time.' :
    approx ? 'Counted in whole days (from midnight UTC), so this can include up to a day more than ' + rl.toLowerCase() + '. Add an API key on the 24 hours tab for exact hours.' :
    'GoatCounter groups visits by the hour, so this counts from the start of the hour ' + GC_HOURS[r] + ' hours ago (' + new Date(gcStartMs(r)).toLocaleString([], {weekday: 'short', hour: 'numeric', minute: '2-digit'}) + ').';
  h += '<p class="note">' + rangeNote + ' Counts are unique visitors from GoatCounter, and can take a minute or two to show up. Visitors with ad blockers aren’t counted, so real numbers are a bit higher. Section and set counts start from the day they were added.</p>' + footer;
  app.innerHTML = h;
}

/* ---------- OWNER BUTTONS ---------- */
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if(!b || b.disabled) return;
  const a = b.dataset.act;
  if(a === 'ownerback') hback(renderSecret);
  else if(a === 'inbox'){ if(VIEW !== 'inb') hpush('inb'); renderInbox(); }
  else if(a === 'stats'){ if(VIEW !== 'stats') hpush('stats'); renderStats(); }
  else if(a === 'gcser'){ if(gcSetShow(b.dataset.k, b.checked)){ if(GC_CHART) gcDrawChart(GC_CHART.s); } else b.checked = true; }
  else if(a === 'gcview'){ gcSetView(b.dataset.v); renderStats(); }
  else if(a === 'gcrange'){ gcSetRange(b.dataset.r); renderStats(); }
  else if(a === 'gckeysave'){ const el = document.getElementById('gc-key'); const k = el ? el.value.trim() : ''; if(k){ gcSetKey(k); renderStats(); } else if(el) el.focus(); }
  else if(a === 'gckeydel'){ gcSetKey(''); renderStats(); }
  else if(a === 'sugdiag') relayDiag();
  else if(a === 'sugcopyall'){
    copyText(INBOX.filter(i => !i.done).map(itemAsText).join('\n\n')).then(ok => setStatus(ok ? 'Copied all open suggestions.' : 'Couldn’t copy automatically.', ok ? 'good' : 'bad'));
  }
  else if(a === 'sugdone'){ editInboxItem(b, 'done'); renderInbox(); }
  else if(a === 'sugdel'){
    if(b.dataset.arm !== '1'){ b.dataset.arm = '1'; b.textContent = 'Tap again to delete'; return; }
    editInboxItem(b, 'del'); renderInbox();
  }
});
/* The screens index.html can open by name (see openOwner there). */
const OWNER_PAGES = {secret: renderSecret, rev: renderReviewer, inb: renderInbox, stats: renderStats};
