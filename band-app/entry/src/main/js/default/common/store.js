// Saves the match (and the undo history) to the band's flash so a match
// survives the app being closed or the band going to sleep.
import file from '@system.file';

var URI = 'internal://app/match.json';

function save(data) {
  file.writeText({
    uri: URI,
    text: JSON.stringify(data),
    fail: function (msg, code) {
      console.error('store.save failed ' + code + ' ' + msg);
    }
  });
}

// cb(data) gets the saved object, or null when nothing is saved.
function load(cb) {
  file.readText({
    uri: URI,
    success: function (res) {
      var data = null;
      try {
        data = JSON.parse(res.text);
      } catch (e) {
        data = null;
      }
      cb(data);
    },
    fail: function () {
      cb(null);
    }
  });
}

function clear() {
  file.delete({ uri: URI });
}

export default { save: save, load: load, clear: clear };
