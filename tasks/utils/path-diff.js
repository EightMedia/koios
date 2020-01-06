const path = require("path");

/**
 * Get difference between paths
 */

module.exports = function(a, b) {
  a = a.split(path.sep);
  b = b.split(path.sep);

  return a
    .filter((x, i) => i > b.length || (b[i] != x && x != ""))
    .concat(b.filter((x, i) => i > a.length || (a[i] != x && x != "")))
    .join(path.sep);
};