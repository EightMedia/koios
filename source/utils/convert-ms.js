/**
 * Convert milliseconds to string with days, hours, minutes and seconds
 */

module.exports = function(ms) {
  let d, h, m, s;
  s = Math.floor(ms / 1000);
  ms = ms % 1000;
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;

  let str = "";
  if (d > 0) str += `${d}d `;
  if (h > 0) str += `${h}h `;
  if (m > 0) str += `${m}m `;
  if (s > 0) str += `${Number.parseFloat(s + "." + ms).toFixed(2)}s`;
  else str += `${ms}ms`;

  return str;
}