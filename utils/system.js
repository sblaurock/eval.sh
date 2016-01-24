// Prevent running application as root
var guardUID = function() {
  var uid = parseInt(process.env.SUDO_UID);

  if(uid) {
    process.setuid(uid);
  }
};

module.exports = {
  guardUID: guardUID
};
