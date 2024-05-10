import { register } from "node:module";
import {fileURLToPath, pathToFileURL} from "node:url";
import {dirname} from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

register(`${__dirname}/loader.js`, pathToFileURL("./"));