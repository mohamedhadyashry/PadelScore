// Tests for the band's scoring engine. Run: node tools/test-score.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync(new URL('../band-app/entry/src/main/js/default/common/score.js', import.meta.url), 'utf8');
const score = (await import('data:text/javascript,' + encodeURIComponent(src))).default;

function play(st, seq) {
  let ev;
  for (const c of seq) ({ state: st, event: ev } = score.addPoint(st, c === 'a' ? 0 : 1));
  return { st, ev };
}
const game = (t) => t.repeat(4);

let t = 0;
function test(name, fn) { fn(); t++; console.log('ok  ' + name); }

test('point labels', () => {
  let { st } = play(score.newMatch(false), 'aab');
  assert.deepEqual(score.pointLabels(st), { a: '30', b: '15', note: '' });
});

test('deuce and advantage', () => {
  let { st } = play(score.newMatch(false), 'aaabbb');
  assert.equal(score.pointLabels(st).note, 'DEUCE');
  ({ st } = play(st, 'a'));
  assert.deepEqual(score.pointLabels(st), { a: 'AD', b: '40', note: '' });
  ({ st } = play(st, 'b'));
  assert.equal(score.pointLabels(st).note, 'DEUCE');
  assert.deepEqual(st.p, [3, 3]);
  let r = play(st, 'bb');
  assert.equal(r.ev, 'game');
  assert.deepEqual(r.st.g, [0, 1]);
});

test('golden point wins at 40-40', () => {
  let { st } = play(score.newMatch(true), 'aaabbb');
  assert.equal(score.pointLabels(st).note, 'GOLDEN');
  let r = play(st, 'a');
  assert.equal(r.ev, 'game');
  assert.deepEqual(r.st.g, [1, 0]);
});

test('set 6-4', () => {
  let r = play(score.newMatch(false), game('a').repeat(5) + game('b').repeat(4) + game('a'));
  assert.equal(r.ev, 'set');
  assert.deepEqual(r.st.done, [[6, 4]]);
  assert.deepEqual(r.st.s, [1, 0]);
  assert.deepEqual(r.st.g, [0, 0]);
});

test('6-5 is not a set, 7-5 is', () => {
  let r = play(score.newMatch(false), game('a').repeat(5) + game('b').repeat(5) + game('a'));
  assert.equal(r.ev, 'game');
  r = play(r.st, game('a'));
  assert.deepEqual(r.st.done, [[7, 5]]);
});

test('tie-break at 6-6', () => {
  let r = play(score.newMatch(false), (game('a') + game('b')).repeat(6));
  assert.equal(r.st.tb, true);
  r = play(r.st, 'abababababab'); // 6-6 in tie-break
  assert.deepEqual(score.pointLabels(r.st), { a: '6', b: '6', note: 'TIE-BREAK' });
  r = play(r.st, 'a');
  assert.equal(r.ev, 'point');
  r = play(r.st, 'a');
  assert.equal(r.ev, 'set');
  assert.deepEqual(r.st.done, [[7, 6]]);
  assert.equal(r.st.tb, false);
});

test('match best of 3', () => {
  const set = (w) => game(w).repeat(6);
  let r = play(score.newMatch(false), set('a') + set('b') + set('a'));
  assert.equal(r.ev, 'match');
  assert.equal(r.st.winner, 0);
  assert.equal(score.setsText(r.st), '6-0  0-6  6-0');
  assert.equal(score.addPoint(r.st, 1).event, 'none');
});

test('state is not mutated (undo relies on this)', () => {
  const st = score.newMatch(false);
  score.addPoint(st, 0);
  assert.deepEqual(st.p, [0, 0]);
});

console.log(`\n${t} tests passed`);
