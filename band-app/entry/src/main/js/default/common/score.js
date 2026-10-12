// Padel scoring engine.
// Written in plain ES5 on purpose: the band's lite JS engine is small and
// does not support every modern language feature.
//
// State shape (kept compact because it is saved to flash and sent to the phone):
//   golden : true = golden point at 40-40, false = advantage
//   p      : [a, b] points in the current game (or tie-break)
//   g      : [a, b] games in the current set
//   s      : [a, b] sets won
//   tb     : true while a 6-6 tie-break is being played
//   done   : finished sets, e.g. [[6, 4], [3, 6]]
//   winner : -1 while playing, 0 = team A won, 1 = team B won

var LABELS = ['0', '15', '30', '40'];
var SETS_TO_WIN = 2; // best of 3

function clone(st) {
  return JSON.parse(JSON.stringify(st));
}

function newMatch(golden) {
  return { golden: !!golden, p: [0, 0], g: [0, 0], s: [0, 0], tb: false, done: [], winner: -1 };
}

// Gives a point to team t (0 or 1).
// Returns { state, event } where event is 'point', 'game', 'set' or 'match'.
function addPoint(st, t) {
  if (st.winner >= 0) {
    return { state: st, event: 'none' };
  }
  var n = clone(st);
  var o = 1 - t;
  var gameWon = false;

  n.p[t]++;
  if (n.tb) {
    gameWon = n.p[t] >= 7 && n.p[t] - n.p[o] >= 2;
  } else if (n.golden) {
    gameWon = n.p[t] >= 4;
  } else {
    gameWon = n.p[t] >= 4 && n.p[t] - n.p[o] >= 2;
    // Back to deuce: keep the numbers small.
    if (!gameWon && n.p[t] === 4 && n.p[o] === 4) {
      n.p = [3, 3];
    }
  }

  if (!gameWon) {
    return { state: n, event: 'point' };
  }

  var wasTieBreak = n.tb;
  n.p = [0, 0];
  n.tb = false;
  n.g[t]++;

  var setWon = wasTieBreak || (n.g[t] >= 6 && n.g[t] - n.g[o] >= 2);
  if (!setWon) {
    if (n.g[0] === 6 && n.g[1] === 6) {
      n.tb = true;
    }
    return { state: n, event: 'game' };
  }

  n.done.push([n.g[0], n.g[1]]);
  n.g = [0, 0];
  n.s[t]++;
  if (n.s[t] >= SETS_TO_WIN) {
    n.winner = t;
    return { state: n, event: 'match' };
  }
  return { state: n, event: 'set' };
}

// What to show for the current game: { a, b, note }.
function pointLabels(st) {
  var a = st.p[0];
  var b = st.p[1];
  if (st.tb) {
    return { a: '' + a, b: '' + b, note: 'TIE-BREAK' };
  }
  if (a >= 3 && b >= 3) {
    if (a === b) {
      return { a: '40', b: '40', note: st.golden ? 'GOLDEN' : 'DEUCE' };
    }
    return a > b ? { a: 'AD', b: '40', note: '' } : { a: '40', b: 'AD', note: '' };
  }
  return { a: LABELS[a], b: LABELS[b], note: '' };
}

// "6-4  3-6" for the finished sets.
function setsText(st) {
  var parts = [];
  for (var i = 0; i < st.done.length; i++) {
    parts.push(st.done[i][0] + '-' + st.done[i][1]);
  }
  return parts.join('  ');
}

export default {
  newMatch: newMatch,
  addPoint: addPoint,
  pointLabels: pointLabels,
  setsText: setsText
};
