#!/usr/bin/env node
/* Checks questions.js, the map images and the version numbers.

     node tools/check.js         check only
     node tools/check.js --fix   also give new questions their permanent key ("k")
                                 and rewrite questions.js one question per line

   Every question carries a permanent key, "k". The site uses it to remember which
   questions a student missed, so a key must never change once it is published, even
   if the question is reworded or moved. The same question in two sets shares one key.
   When you add a question, leave "k" out and run this with --fix. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..');
const file = path.join(root, 'questions.js');
const fix = process.argv.includes('--fix');
const HEAD = '/* Practice sets and questions. One question per line.\n' +
  '   After editing, run: node tools/check.js --fix   (see README) */\n';

const raw = fs.readFileSync(file, 'utf8');
const at = raw.indexOf('const DATA = ');
if(at < 0){ console.error('questions.js must contain "const DATA = [...]"'); process.exit(1); }
let DATA;
try{ DATA = JSON.parse(raw.slice(at + 13).trim().replace(/;$/, '')); }
catch(e){ console.error('questions.js is not valid: ' + e.message); process.exit(1); }

const errors = [], warns = [];
const sig = q => JSON.stringify([q.t, q.q, q.o || null, q.items || null, q.img || null]);
const byKey = {}, bySig = {}, ids = {};
let total = 0, added = 0;

DATA.forEach(z => z.qs.forEach(q => { if(q.k){ byKey[q.k] = byKey[q.k] || sig(q); bySig[sig(q)] = q.k; } }));

DATA.forEach(z => {
  if(ids[z.id]) errors.push('Two sets share id ' + z.id);
  ids[z.id] = 1;
  ['title', 'lab', 'sec'].forEach(f => { if(!z[f]) errors.push('Set ' + z.id + ' has no "' + f + '"'); });
  z.qs.forEach((q, i) => {
    total++;
    const where = z.title + ' Q' + (i + 1);
    if(!q.q || !q.s || !q.why) errors.push(where + ': needs "q", "s" and "why"');
    if(q.t === 'mc'){
      if(!Array.isArray(q.o) || q.o.length < 2 || q.o.length > 5) errors.push(where + ': needs 2 to 5 options');
      else {
        if(!(Number.isInteger(q.a) && q.a >= 0 && q.a < q.o.length)) errors.push(where + ': answer is not one of the options');
        if(new Set(q.o).size !== q.o.length) errors.push(where + ': two options are the same');
      }
    } else if(q.t === 'tf'){
      if(typeof q.a !== 'boolean') errors.push(where + ': answer must be true or false');
      if((q.why.match(/Clause \d+:/g) || []).length > 2 || (q.src || []).length > 2) errors.push(where + ': True / False has more than two facts. Keep it to one or two');
    } else if(q.t === 'fill'){
      if(!Array.isArray(q.acc) || !q.acc.length || !q.shown) errors.push(where + ': needs "acc" and "shown"');
    } else errors.push(where + ': unknown type "' + q.t + '"');
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
  });
});

try{
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const a = (html.match(/const APP_VERSION = (\d+)/) || [])[1];
  const b = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version;
  if(String(a) !== String(b)) errors.push('Version mismatch: index.html says ' + a + ', version.json says ' + b);
}catch(e){ errors.push('Could not read the version numbers: ' + e.message); }

if(fix){
  const out = HEAD + 'const DATA = [\n' + DATA.map(z => {
    const head = Object.assign({}, z); delete head.qs;
    const h = JSON.stringify(head);
    return h.slice(0, -1) + ',"qs":[' + (z.qs.length ? '\n' + z.qs.map(q => '  ' + JSON.stringify(q)).join(',\n') + '\n' : '') + ']}';
  }).join(',\n') + '\n];\n';
  fs.writeFileSync(file, out);
  console.log('Rewrote questions.js' + (added ? ' (' + added + ' new key' + (added > 1 ? 's' : '') + ')' : ''));
}
warns.forEach(w => console.log('Note: ' + w));
errors.forEach(e => console.error('Problem: ' + e));
console.log(DATA.length + ' sets, ' + total + ' questions, ' + Object.keys(byKey).length + ' different questions. ' +
  (errors.length ? errors.length + ' problem(s) found.' : 'No problems found.'));
process.exit(errors.length ? 1 : 0);
