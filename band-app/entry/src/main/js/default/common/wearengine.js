// PLACEHOLDER for Huawei's official Wear Engine library.
//
// The band app works fine on its own with this file: it simply does not
// talk to the phone. To turn on the phone scoreboard, download the real
// "wearengine.js" for lite wearables from the Huawei Developer site
// (Wear Engine -> Lite wearable -> SDK download) and replace this file with it.
// See the main README, section "Connecting the phone".

function P2pClient() {}
P2pClient.prototype.setPeerPkgName = function () {};
P2pClient.prototype.setPeerFingerPrint = function () {};
P2pClient.prototype.ping = function (cb) {
  if (cb && cb.onFailure) cb.onFailure();
};
P2pClient.prototype.send = function (msg, cb) {
  if (cb && cb.onFailure) cb.onFailure();
};
P2pClient.prototype.registerReceiver = function (cb) {
  if (cb && cb.onFailure) cb.onFailure();
};
P2pClient.prototype.unregisterReceiver = function () {};

function Builder() {
  this.description = '';
}
Builder.prototype.setDescription = function (text) {
  this.description = text;
};

function Message() {
  this.builder = null;
}

export { P2pClient, Message, Builder };
