#!/usr/bin/env node
/* Checks the whole site: questions.js, the map images, the version numbers and the updated date,
   then runs the tests in tools/test.js.

     node tools/check.js             check only
     node tools/check.js --fix       also give new questions their permanent key ("k"), move their "src" lines
                                     to tools/sources.json and rewrite questions.js one question per line
     node tools/check.js --release   everything --fix does, then get the site ready to publish: raise the
                                     version number in index.html and version.json and set the updated date to today

   Every question carries a permanent key, "k". The site uses it to remember which
   questions a student missed, so a key must never change once it is published, even
   if the question is reworded or moved. The same question in two sets shares one key.
   When you add a question, leave "k" out and run this with --fix. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const file = path.join(root, 'questions.js'), srcFile = path.join(__dirname, 'sources.json');
const release = process.argv.includes('--release'), fix = release || process.argv.includes('--fix');
const HEAD = '/* The sections on the front page, then every practice set and question. One section or question per line.\n' +
  '   After editing, run: node tools/check.js --fix   (see README) */\n';

function stop(msg){ console.error(msg); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
const sAt = raw.indexOf('const SECTIONS = '), dAt = raw.indexOf('const DATA = ');
if(sAt < 0 || dAt < sAt) stop('questions.js must contain "const SECTIONS = [...]" followed by "const DATA = [...]"');
const parse = (name, text) => { try{ return JSON.parse(text.trim().replace(/;$/, '')); }catch(e){ stop('questions.js: ' + name + ' is not valid: ' + e.message); } };
const SECTIONS = parse('SECTIONS', raw.slice(sAt + 17, dAt)), DATA = parse('DATA', raw.slice(dAt + 13));
/* The study-guide lines each question was built from. Only this tool reads them, so they are kept out of the page. */
let SRC = {};
try{ SRC = JSON.parse(fs.readFileSync(srcFile, 'utf8')); }catch(e){ if(fs.existsSync(srcFile)) stop('tools/sources.json is not valid: ' + e.message); }

const errors = [], warns = [];
const sig = q => JSON.stringify([q.t, q.q, q.o || null, q.items || null, q.img || null]);
const byKey = {}, bySig = {}, ids = {}, secKeys = {}, secUsed = {};
let total = 0, added = 0, moved = 0;

if(!Array.isArray(SECTIONS) || !SECTIONS.length) errors.push('SECTIONS must list at least one section');
else SECTIONS.forEach((s, i) => {
  const where = 'Section ' + (i + 1) + (s.name ? ' (' + s.name + ')' : '');
  ['key', 'badge', 'name', 'pages', 'note'].forEach(f => { if(!s[f] || typeof s[f] !== 'string') errors.push(where + ' has no "' + f + '"'); });
  if(secKeys[s.key]) errors.push('Two sections share the key "' + s.key + '"');
  secKeys[s.key] = 1;
});

DATA.forEach(z => z.qs.forEach(q => { if(q.k){ byKey[q.k] = byKey[q.k] || sig(q); bySig[sig(q)] = q.k; } }));

DATA.forEach(z => {
  if(ids[z.id]) errors.push('Two sets share id ' + z.id);
  ids[z.id] = 1;
  ['title', 'lab', 'sec'].forEach(f => { if(!z[f]) errors.push('Set ' + z.id + ' has no "' + f + '"'); });
  if(z.sec && !secKeys[z.sec]) errors.push('Set ' + z.id + ' (' + z.title + ') is in section "' + z.sec + '", which is not listed in SECTIONS. Its "sec" must match a section "key" exactly');
  secUsed[z.sec] = 1;
  const inSet = {};
  z.qs.forEach((q, i) => {
    total++;
    const where = z.title + ' Q' + (i + 1);
    if(!q.q || !q.s || !q.why) errors.push(where + ': needs "q", "s" and "why"');
    if(q.src){
      if(fix && Array.isArray(q.src)) q._src = q.src;
      else errors.push(where + ': "src" belongs in tools/sources.json. Run: node tools/check.js --fix');
      delete q.src;
    }
    const src = q._src || (q.k && SRC[q.k]) || [];
    if(q.t === 'mc'){
      if(!Array.isArray(q.o) || q.o.length < 2 || q.o.length > 5) errors.push(where + ': needs 2 to 5 options');
      else {
        if(!(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length)) errors.push(where + ': answer is not one of the options');
        if(new Set(q.o).size !== q.o.length) errors.push(where + ': two options are the same');
      }
    } else if(q.t === 'tf'){
      if(typeof q.a !== 'boolean') errors.push(where + ': answer must be true or false');
      if((q.why.match(/Clause \d+:/g) || []).length > 2 || src.length > 2) errors.push(where + ': True / False has more than two facts. Keep it to one or two');
    } else if(q.t === 'fill'){
      if(!Array.isArray(q.acc) || !q.acc.length || !q.shown) errors.push(where + ': needs "acc" and "shown"');
    } else errors.push(where + ': unknown type "' + q.t + '"');
    if('exact' in q && (q.t !== 'fill' || q.exact !== true)) errors.push(where + ': "exact" is only for fill-in questions, written as "exact":true');
    if('items' in q && (!Array.isArray(q.items) || q.items.length < 2 || q.items.length % 2)) errors.push(where + ': a matching table needs an even number of "items" (left, right, left, right…)');
    if(q.img && !fs.existsSync(path.join(root, 'maps', q.img + '.jpg'))) errors.push(where + ': missing image maps/' + q.img + '.jpg');
    if(!q.k){
      if(!fix){ errors.push(where + ': has no key yet. Run: node tools/check.js --fix'); return; }
      const s = sig(q);
      let k = bySig[s];
      for(let n = 0; !k; n++){
        const c = 'q' + crypto.createHash('sha1').update(s + (n || '')).digest('hex').slice(0, 8);
        if(!byKey[c] || byKey[c] === s) k = c;
      }
      q.k = k; byKey[k] = s; bySig[s] = k; added++;
    } else if(byKey[q.k] !== sig(q)){
      warns.push(where + ': shares key ' + q.k + ' with a question that is worded differently');
    }
    if(inSet[q.k]) errors.push(where + ': the same question is in this set twice (Q' + inSet[q.k] + ')');
    inSet[q.k] = i + 1;
    if(q._src){ SRC[q.k] = q._src; delete q._src; moved++; }
  });
});
SECTIONS.forEach(s => { if(s.key && !secUsed[s.key]) warns.push('Section "' + s.key + '" has no practice sets, so it shows on the front page with nothing in it'); });

['owner.js', 'preview.png'].forEach(f => { if(!fs.existsSync(path.join(root, f))) errors.push('Missing ' + f); });

/* The tests: answer checking and the guide-note layout, against every question. */
try{ require('./test.js')(root, DATA).forEach(t => errors.push('Test failed: ' + t)); }
catch(e){ errors.push('Could not run tools/test.js: ' + e.message); }

/* Version numbers and the "Updated" date. */
const pad = n => String(n).padStart(2, '0'), ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = ymd(new Date());
const htmlFile = path.join(root, 'index.html'), verFile = path.join(root, 'version.json');
let newVersion = 0;
try{
  let html = fs.readFileSync(htmlFile, 'utf8');
  const a = (html.match(/const APP_VERSION = (\d+)/) || [])[1];
  const b = JSON.parse(fs.readFileSync(verFile, 'utf8')).version;
  const d = (html.match(/const APP_UPDATED = '([^']*)'/) || [])[1];
  if(a === undefined || d === undefined) errors.push('index.html must contain "const APP_VERSION = …" and "const APP_UPDATED = \'…\'"');
  else if(release){
    if(!errors.length){
      newVersion = Math.max(Number(a), Number(b) || 0) + 1;
      html = html.replace(/const APP_VERSION = \d+/, 'const APP_VERSION = ' + newVersion).replace(/const APP_UPDATED = '[^']*'/, "const APP_UPDATED = '" + today + "'");
      fs.writeFileSync(htmlFile, html);
      fs.writeFileSync(verFile, JSON.stringify({version: newVersion}).replace(':', ': ') + '\n');
    }
  } else {
    if(String(a) !== String(b)) errors.push('Version mismatch: index.html says ' + a + ', version.json says ' + b + '. Run: node tools/check.js --release');
    /* A day's grace on "in the future": the computer running this check may be in an earlier time zone than the one that set the date. */
    const real = /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d;
    const latest = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if(!real) errors.push('APP_UPDATED in index.html must be a real date written like ' + today + ' (it says ' + d + ')');
    else if(d > latest && d > today) errors.push('APP_UPDATED in index.html is in the future: ' + d);
  }
}catch(e){ errors.push('Could not read the version numbers: ' + e.message); }

if(fix && !errors.length){
  const rows = list => list.map(x => '  ' + JSON.stringify(x)).join(',\n');
  const out = HEAD + 'const SECTIONS = [\n' + rows(SECTIONS) + '\n];\nconst DATA = [\n' + DATA.map(z => {
    const head = Object.assign({}, z); delete head.qs;
    const h = JSON.stringify(head);
    return h.slice(0, -1) + ',"qs":[' + (z.qs.length ? '\n' + rows(z.qs) + '\n' : '') + ']}';
  }).join(',\n') + '\n];\n';
  fs.writeFileSync(file, out);
  /* Keep only the sources of questions that still exist, in the order the questions appear. */
  const keep = [];
  DATA.forEach(z => z.qs.forEach(q => { if(SRC[q.k] && keep.indexOf(q.k) < 0) keep.push(q.k); }));
  fs.writeFileSync(srcFile, '{\n' + keep.map(k => JSON.stringify(k) + ':' + JSON.stringify(SRC[k])).join(',\n') + '\n}\n');
  console.log('Rewrote questions.js' + (added ? ' (' + added + ' new key' + (added > 1 ? 's' : '') + ')' : '') + (moved ? ' and moved ' + moved + ' "src" to tools/sources.json' : ''));
} else if(fix) console.log('Nothing was changed, because of the problems below. Fix them and run this again.');
if(newVersion) console.log('Ready to publish: version ' + newVersion + ', updated ' + today + '.');
warns.forEach(w => console.log('Note: ' + w));
errors.forEach(e => console.error('Problem: ' + e));
console.log(SECTIONS.length + ' sections, ' + DATA.length + ' sets, ' + total + ' questions, ' + Object.keys(byKey).length + ' different questions. ' +
  (errors.length ? errors.length + ' problem(s) found.' : 'No problems found.'));
process.exit(errors.length ? 1 : 0);
