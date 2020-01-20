/**
 * Progressify Promise.all
 */

module.exports = function(promises, cb) {
  let i = 0;
  for (const p of promises) {
    p.then((item) => {
      i++;
      cb(i, item);
    }).catch(err => err);
  }
  return Promise.all(promises);
}