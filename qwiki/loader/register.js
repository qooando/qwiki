import { register } from "node:module";
import { pathToFileURL } from "node:url";
register("./dist/loader.js", pathToFileURL("./"));