/* Tests for the answer checking and the guide-note layout. Run by tools/check.js; nothing to install.
   The code under test is the block of index.html between "ANSWER CHECKING AND GUIDE NOTES" and "END OF TESTED CODE".
   Returns a list of what failed (empty when all is well). */
const fs = require('fs'), path = require('path');
module.exports = function(root, DATA){
  const fails = [];
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const a = html.indexOf('/* ===== ANSWER CHECKING AND GUIDE NOTES ====='), b = html.indexOf('/* ===== END OF TESTED CODE ===== */');
  if(a < 0 || b < a) return ['index.html no longer has the "ANSWER CHECKING AND GUIDE NOTES" … "END OF TESTED CODE" markers'];
  const F = new Function(html.slice(a, b) + '\nreturn {esc, norm, fillOK, ansText, markDiff, whyBody, whyHtml};')();
  const same = (name, got, want) => { if(JSON.stringify(got) !== JSON.stringify(want)) fails.push(name + ': expected ' + JSON.stringify(want) + ', got ' + JSON.stringify(got)); };

  /* Fill-in answers, marked the generous way. */
  const date = {t: 'fill', acc: ['2090'], shown: 'c. 2090 BC'};
  same('fill: the number alone', F.fillOK(date, '2090'), true);
  same('fill: with "c." and "BC"', F.fillOK(date, ' c. 2090 B.C. '), true);
  same('fill: wrong number', F.fillOK(date, '2091'), false);
  same('fill: empty', F.fillOK(date, '   '), false);
  same('fill: a long guess that happens to include it', F.fillOK(date, 'somewhere around 2090 or so'), false);
  const word = {t: 'fill', acc: ['Hammurabi'], shown: 'Hammurabi'};
  same('fill: capitals and "the" are ignored', F.fillOK(word, 'the HAMMURABI.'), true);
  same('fill: misspelled', F.fillOK(word, 'Hamurabi'), false);
  /* Fill-in answers marked "exact": the word itself, spelled right. */
  const exact = {t: 'fill', acc: ['Theism'], shown: 'Theism', exact: true};
  same('exact: the word', F.fillOK(exact, 'Theism'), true);
  same('exact: capitals and spaces around it do not matter', F.fillOK(exact, '  theism '), true);
  same('exact: extra words', F.fillOK(exact, 'the theism'), false);
  same('exact: misspelled', F.fillOK(exact, 'Theizm'), false);
  same('exact: empty', F.fillOK(exact, ''), false);
  same('not exact: extra words are fine', F.fillOK({t: 'fill', acc: ['Theism'], shown: 'Theism'}, 'the theism'), true);

  /* The "Correct answer" line. */
  const mc = {t: 'mc', o: ['Rome', 'Athens', 'Sparta', 'None of the above'], a: 1};
  same('answer text: true/false', F.ansText({t: 'tf', a: false}), 'False');
  same('answer text: multiple choice', F.ansText(mc), 'B. Athens');
  same('answer text: multiple choice, choices shuffled', F.ansText(mc, [2, 1, 0, 3]), 'B. Athens');
  same('answer text: multiple choice, moved by the shuffle', F.ansText(mc, [1, 2, 0, 3]), 'A. Athens');
  same('answer text: fill-in', F.ansText(date), 'c. 2090 BC');
  same('esc', F.esc('<b> & "x"'), '&lt;b&gt; &amp; &quot;x&quot;');

  /* The guide note marks the words that were changed in a false statement. */
  same('guide note: changed words are marked', F.markDiff('Hittites were from Asia Minor.', 'Hittites were from Mesopotamia.'), 'Hittites were from <b class="chg">Asia Minor</b>.');
  same('guide note: nothing to compare with', F.markDiff('A & B.', ''), 'A &amp; B.');
  const pair = {t: 'mc', o: ['Homer -- Iliad', 'Plato -- Aeneid', 'Herodotus -- Histories', 'Euclid -- Elements', 'All of the above are correctly related'], a: 1,
    q: 'Which is NOT correctly related?', why: 'A: related. “Homer” goes with “Iliad.” B: NOT related. “Plato” goes with “Republic,” not “Aeneid.” C: related. “Herodotus” goes with “Histories.” D: related. “Euclid” goes with “Elements.”'};
  const pairHtml = F.whyBody(pair, null) || '';
  same('guide note: one row per pair', (pairHtml.match(/<li /g) || []).length, 4);
  same('guide note: the wrong pair shows what it goes with', pairHtml.indexOf('<s>Aeneid</s>') > 0 && pairHtml.indexOf('<b>Republic</b>') > 0, true);
  same('guide note: unknown wording falls back to plain text', F.whyHtml({t: 'tf', a: true, q: 'x', why: 'Just <so>.'}), '<div class="guide"><small>From the study guide</small><p>Just &lt;so&gt;.</p></div>');

  /* Every real question: the note must lay out without an error, and the wordings the layout is built for must be recognised. */
  const seen = {};
  DATA.forEach(z => z.qs.forEach((q, i) => {
    if(!q.k || seen[q.k] || !q.why) return;
    seen[q.k] = 1;
    const where = z.title + ' Q' + (i + 1), w = q.why;
    let body;
    try{
      body = F.whyBody(q, null);
      if(q.t === 'mc' && Array.isArray(q.o)){ const n = q.o.length, oo = []; for(let k = n - 2; k >= 0; k--) oo.push(k); oo.push(n - 1); F.whyBody(q, oo); F.ansText(q, oo); }
    }catch(e){ fails.push(where + ': the guide note could not be laid out (' + e.message + ')'); return; }
    const expected =
      (q.t === 'tf' && /^Clause 1: /.test(w)) ? 'one row per clause' :
      (q.t === 'tf' && /^False\. The (study )?guide says: /.test(w)) ? 'the guide’s wording' :
      (q.t === 'mc' && /^A: (NOT related|related)\. /.test(w)) ? 'one row per pair' :
      (q.items && /Correct matches: /.test(w)) ? 'one row per match' : '';
    if(expected && !body) fails.push(where + ': the guide note should show ' + expected + ', but its wording is not recognised, so it shows as plain text. Check the "why"');
    if(q.t === 'fill' && Array.isArray(q.acc) && !q.acc.some(x => F.fillOK(q, x))) fails.push(where + ': none of the accepted answers ("acc") would be marked right');
  }));
  return fails;
};
