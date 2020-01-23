/**
 * Progressify Promise.all
 */

module.exports = function(promises, cb) {
  let i = 0;
  for (const p of promises) {
    p.then((item) => {
      i++;
      return cb(i, item);
    }).catch(err => err); // Shuts up UnhandledPromiseRejectionWarning, but keeps you in the dark
  }
  return Promise.all(promises);
}