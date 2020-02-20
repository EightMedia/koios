const S = require("path").sep;

/**
 * Get difference between paths
 */

module.exports = function(a, b) {
  a = a.split(S);
  b = b.split(S);

  return a
    .filter((x, i) => i > b.length || (b[i] != x && x != ""))
    .concat(b.filter((x, i) => i > a.length || (a[i] != x && x != "")))
    .join(S);
};