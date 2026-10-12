import router from '@system.router';
import vibrator from '@system.vibrator';
import score from '../../common/score.js';
import store from '../../common/store.js';
import phone from '../../common/phone-link.js';

var MAX_UNDO = 30;

// Kept outside `data` on purpose: the band has very little memory and
// `data` fields are made reactive, which costs memory for every nested value.
var cur = null;
var hist = [];

export default {
  data: {
    mode: 'advantage', // set by the router: 'advantage' | 'golden' | 'resume'

    flip: 0,
    // Which flash layer is shown (see match.hml): f = point, b = game/set, u = undo.
    fA0: false,
    fA1: false,
    bA0: false,
    bA1: false,
    fB0: false,
    fB1: false,
    bB0: false,
    bB1: false,
    u0: false,
    u1: false,

    playing: true,
    labelA: '0',
    labelB: '0',
    dotsA: [],
    dotsB: [],
    gamesText: '0 - 0',
    // Replaced as soon as the page script runs. If the band keeps showing
    // LOADING, the script failed to start.
    infoText: 'LOADING',

    showWin: false,
    winA: false,
    winB: false,
    finalSets: ''
  },

  onInit() {
    var self = this;
    try {
      if (this.mode === 'resume') {
        cur = score.newMatch(false);
        hist = [];
        this.updateView();
        store.load(function (data) {
          if (data && data.cur && data.cur.winner < 0) {
            cur = data.cur;
            hist = data.hist || [];
            self.updateView();
          }
        });
      } else {
        cur = score.newMatch(this.mode === 'golden');
        hist = [];
        this.updateView();
        this.persist('new');
      }
    } catch (e) {
      this.showError(e);
    }
  },

  pointA() {
    this.point(0);
  },

  pointB() {
    this.point(1);
  },

  point(team) {
    try {
      if (!cur || cur.winner >= 0) {
        return;
      }
      var res = score.addPoint(cur, team);
      hist.push(cur);
      if (hist.length > MAX_UNDO) {
        hist.shift();
      }
      cur = res.state;
      this.updateView();
      this.flash(team, res.event !== 'point');
      buzz(res.event !== 'point');
      this.persist(res.event);
    } catch (e) {
      this.showError(e);
    }
  },

  undo() {
    try {
      if (!hist.length) {
        return;
      }
      cur = hist.pop();
      this.updateView();
      this.flashUndo();
      buzz(false);
      this.persist('undo');
    } catch (e) {
      this.showError(e);
    }
  },

  // Long-press the middle strip: back to the start screen.
  // The match is saved, so "Resume" picks it up again.
  menu() {
    router.replace({ uri: 'pages/index/index' });
  },

  finish() {
    router.replace({ uri: 'pages/index/index' });
  },

  // Not called `render`: the build tools add their own `render` (the compiled
  // template) to the page, and a method with that name breaks the page.
  updateView() {
    var st = cur;
    var labels = score.pointLabels(st);
    this.labelA = labels.a;
    this.labelB = labels.b;
    this.gamesText = st.g[0] + ' - ' + st.g[1];
    this.infoText = labels.note || 'SET ' + (st.done.length + 1);
    this.dotsA = range(st.s[0]);
    this.dotsB = range(st.s[1]);

    this.showWin = st.winner >= 0;
    this.playing = !this.showWin;
    this.winA = st.winner === 0;
    this.winB = st.winner === 1;
    if (this.showWin) {
      this.finalSets = score.setsText(st);
    }
  },

  // Flashes the side that scored: a soft flash for a point, the full team
  // colour when a game or set is won.
  flash(team, big) {
    this.clearEffects();
    this.flip = 1 - this.flip;
    var first = this.flip === 0;
    if (team === 0) {
      if (big) {
        if (first) { this.bA0 = true; } else { this.bA1 = true; }
      } else {
        if (first) { this.fA0 = true; } else { this.fA1 = true; }
      }
    } else {
      if (big) {
        if (first) { this.bB0 = true; } else { this.bB1 = true; }
      } else {
        if (first) { this.fB0 = true; } else { this.fB1 = true; }
      }
    }
  },

  flashUndo() {
    this.clearEffects();
    this.flip = 1 - this.flip;
    if (this.flip === 0) { this.u0 = true; } else { this.u1 = true; }
  },

  clearEffects() {
    this.fA0 = false;
    this.fA1 = false;
    this.bA0 = false;
    this.bA1 = false;
    this.fB0 = false;
    this.fB1 = false;
    this.bB0 = false;
    this.bB1 = false;
    this.u0 = false;
    this.u1 = false;
  },

  // Shows a short error in the middle strip so problems are visible on the
  // band itself, and the full error in the log.
  showError(e) {
    console.error('PadelScore: ' + e);
    this.infoText = ('ERR ' + (e && e.message ? e.message : e)).substring(0, 14);
  },

  // Saving and the phone link must never stop the scoring, so errors from
  // them are only logged (the previewer, for example, can't save files).
  persist(event) {
    try {
      store.save({ cur: cur, hist: hist });
    } catch (e) {
      console.error('PadelScore: save failed ' + e);
    }
    try {
      phone.send(cur, event);
    } catch (e) {
      console.error('PadelScore: phone send failed ' + e);
    }
  }
};

function range(n) {
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push(i);
  }
  return out;
}

function buzz(long) {
  try {
    vibrator.vibrate({ mode: long ? 'long' : 'short' });
  } catch (e) {
    // no vibrator: ignore
  }
}
