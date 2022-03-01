import { sep } from "path";

/**
 * Get difference between paths
 */

export default function(a, b) {
  a = a.split(sep);
  b = b.split(sep);

  return a
    .filter((x, i) => i > b.length || (b[i] != x && x != ""))
    .concat(b.filter((x, i) => i > a.length || (a[i] != x && x != "")))
    .join(sep);
};