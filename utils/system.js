// Prevent running application as root
export function guardUID() {
  const uid = parseInt(process.env.SUDO_UID, 10);

  if (uid) {
    process.setuid(uid);
  }
}
