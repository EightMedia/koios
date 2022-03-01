import { cosmiconfigSync } from "cosmiconfig";
const configLoader = cosmiconfigSync("koios");
const config = configLoader.load(`${process.cwd()}/.koiosrc.js`);
export default config.config;
