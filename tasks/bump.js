const paths = require("./settings/paths");

const qoa = require("qoa");
const bumper = require("bump-regex");
const fs = require("fs");

exports.default = async function bump() {
  return [new Promise(async (resolve, reject) => {
    return qoa.interactive({
      type: "interactive",
      query: "How far should we bump the version?",
      symbol: ">",
      menu: ["patch", "minor", "major"],
      handle: "type"
    }).then(async result => {
      const pkg = await fs.promises.readFile(`${process.cwd()}/package.json`);
      return bumper({ type: result.type, str: pkg.toString() }, async (err, out) => {
        if (err) return reject(err);

        await fs.promises.writeFile(`${process.cwd()}/package.json`, out.str);

        return resolve({
          log: `Bumped version from ${out.prev} to ${out.new}`
        });
      });
    }).catch(err => reject(err));
  })];
}