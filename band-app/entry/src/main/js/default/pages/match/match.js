import router from '@system.router';
import vibrator from '@system.vibrator';
import brightness from '@system.brightness';
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

    zoneA: 'zone',
    zoneB: 'zone',
    numA: 'num num-a',
    numB: 'num num-b',
    stripCls: 'strip',
    labelA: '0',
    labelB: '0',
    dotsA: [],
    dotsB: [],
    gamesText: '0 - 0',
    infoText: 'SET 1',

    showWin: false,
    winCls: 'win-team win-a',
    winText: '',
    finalSets: ''
  },

  onInit() {
    keepScreenOn(true);
    var self = this;
    if (this.mode === 'resume') {
      store.load(function (data) {
        if (data && data.cur && data.cur.winner < 0) {
          cur = data.cur;
          hist = data.hist || [];
        } else {
          cur = score.newMatch(false);
        }
        self.render();
      });
    } else {
      cur = score.newMatch(this.mode === 'golden');
      hist = [];
      this.render();
      this.persist('new');
    }
  },

  onDestroy() {
    keepScreenOn(false);
  },

  pointA() {
    this.point(0);
  },

  pointB() {
    this.point(1);
  },

  point(team) {
    if (!cur || cur.winner >= 0) {
      return;
    }
    var res = score.addPoint(cur, team);
    hist.push(cur);
    if (hist.length > MAX_UNDO) {
      hist.shift();
    }
    cur = res.state;

    var big = res.event !== 'point';
    buzz(big);
    this.flip = 1 - this.flip;
    var anim = (big ? ' big-' : ' flash-') + (team === 0 ? 'a' : 'b') + this.flip;
    this.zoneA = team === 0 ? 'zone' + anim : 'zone';
    this.zoneB = team === 1 ? 'zone' + anim : 'zone';
    this.numA = 'num num-a' + (team === 0 ? ' pop' + this.flip : '');
    this.numB = 'num num-b' + (team === 1 ? ' pop' + this.flip : '');

    this.render();
    this.persist(res.event);
  },

  undo() {
    if (!hist.length) {
      return;
    }
    cur = hist.pop();
    this.flip = 1 - this.flip;
    this.stripCls = 'strip undo' + this.flip;
    this.zoneA = 'zone';
    this.zoneB = 'zone';
    buzz(false);
    this.render();
    this.persist('undo');
  },

  // Long-press the middle strip: back to the start screen.
  // The match is saved, so "Resume" picks it up again.
  menu() {
    router.replace({ uri: 'pages/index/index' });
  },

  finish() {
    router.replace({ uri: 'pages/index/index' });
  },

  render() {
    var st = cur;
    var labels = score.pointLabels(st);
    this.labelA = labels.a;
    this.labelB = labels.b;
    this.gamesText = st.g[0] + ' - ' + st.g[1];
    this.infoText = labels.note || 'SET ' + (st.done.length + 1);
    this.dotsA = range(st.s[0]);
    this.dotsB = range(st.s[1]);

    this.showWin = st.winner >= 0;
    if (this.showWin) {
      this.winText = st.winner === 0 ? 'TEAM A' : 'TEAM B';
      this.winCls = 'win-team ' + (st.winner === 0 ? 'win-a' : 'win-b');
      this.finalSets = score.setsText(st);
    }
  },

  persist(event) {
    store.save({ cur: cur, hist: hist });
    phone.send(cur, event);
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

function keepScreenOn(on) {
  try {
    brightness.setKeepScreenOn({ keepScreenOn: on });
  } catch (e) {
    // not supported on this band: ignore
  }
}
