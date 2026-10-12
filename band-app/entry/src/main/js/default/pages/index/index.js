import router from '@system.router';
import store from '../../common/store.js';

export default {
  data: {
    hasSaved: false
  },

  onInit() {
    var self = this;
    store.load(function (data) {
      self.hasSaved = !!(data && data.cur && data.cur.winner < 0);
    });
  },

  resume() {
    router.replace({ uri: 'pages/match/match', params: { mode: 'resume' } });
  },

  startAdvantage() {
    router.replace({ uri: 'pages/match/match', params: { mode: 'advantage' } });
  },

  startGolden() {
    router.replace({ uri: 'pages/match/match', params: { mode: 'golden' } });
  }
};
