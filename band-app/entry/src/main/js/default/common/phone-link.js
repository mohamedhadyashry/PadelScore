// Sends the score to the phone app over Huawei Wear Engine.
// Failures are ignored on purpose: the band must keep scoring even when the
// phone is out of range or the phone app is not installed.
import { P2pClient, Message, Builder } from './wearengine.js';

// Must match the Android app (phone-app) applicationId ...
var PHONE_PACKAGE = 'com.padelscore.phone';
// ... and the SHA-256 fingerprint of the certificate the phone app is signed
// with (see README, "Connecting the phone").
var PHONE_FINGERPRINT = 'REPLACE_WITH_PHONE_APP_SHA256_FINGERPRINT';

var client = null;

function getClient() {
  if (!client) {
    client = new P2pClient();
    client.setPeerPkgName(PHONE_PACKAGE);
    client.setPeerFingerPrint(PHONE_FINGERPRINT);
  }
  return client;
}

// event: 'point' | 'game' | 'set' | 'match' | 'undo' | 'new'
function send(state, event) {
  try {
    var builder = new Builder();
    builder.setDescription(JSON.stringify({ ev: event, st: state }));
    var message = new Message();
    message.builder = builder;
    getClient().send(message, {
      onSuccess: function () {},
      onFailure: function () {},
      onSendResult: function () {},
      onSendProgress: function () {}
    });
  } catch (e) {
    console.error('phone-link: ' + e);
  }
}

export default { send: send };
