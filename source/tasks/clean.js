import config from "../config.js";
import thoughtify from "../utils/thoughtify.js";
import { deleteAsync } from "del";

/**
 * Entry point
 */

export default async function () {
  return {
    before: null,
    thoughts: [
      new Promise(async (resolve, reject) => {
        deleteAsync(`${config.paths.roots.to}**/*`)
          .then((result) => {
            return `removed ${result.length} files from ${config.paths.roots.to}`;
          })
          .then((msg) => thoughtify({}).done(msg))
          .then((thought) => resolve(thought))
          .catch((err) => reject(err));
      }),
    ],
    after: null,
  };
}
