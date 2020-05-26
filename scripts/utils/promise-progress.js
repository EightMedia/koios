/**
 * Progressify Promise.all
 */

module.exports = function(promises) {
  return cb => {
    let i = 0;
    for (const p of promises) {
      p.then(item => {
        i++;
        return cb(i, item);
      });
    }
    return Promise.all(promises);
  }
};