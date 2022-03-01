/**
 * Format time string to 2 digits
 */

export default function (time) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}