// https://github.com/nodejs/loaders-test/tree/main/commonjs-extension-resolution-loader
import {isBuiltin} from 'node:module';
import {dirname} from 'node:path';
import {cwd} from 'node:process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {promisify} from 'node:util';
import * as fs from 'node:fs';

let pack = JSON.parse(fs.readFileSync("./package.json", "utf-8"));
export const moduleAliases = pack._moduleAliases;

import resolveCallback from 'resolve/async.js';
const resolveAsync = promisify(resolveCallback);
const baseURL = pathToFileURL(cwd() + '/').href;


export async function resolve(specifier, context, next) {
    const {parentURL = baseURL} = context;

    for (let alias in moduleAliases) {
        if (specifier.startsWith(alias)) {
            specifier = specifier.replace(alias, moduleAliases[alias]);
            if (specifier.startsWith("./")) {
                specifier = baseURL + specifier.replace("./", "/");
            }
        }
    }

    // if (specifier.startsWith("./")) {
    //     specifier = dirname(parentURL) + specifier.replace("./", "");
    // }
    //
    // console.debug(`[loader] ${specifier}`)

    if (isBuiltin(specifier)) {
        return next(specifier, context);
    }

    // `resolveAsync` works with paths, not URLs
    if (specifier.startsWith('file://')) {
        specifier = fileURLToPath(specifier);
    }
    const parentPath = fileURLToPath(parentURL);

    let url;
    try {
        const resolution = await resolveAsync(specifier, {
            basedir: dirname(parentPath),
            // For whatever reason, --experimental-specifier-resolution=node doesn't search for .mjs extensions
            // but it does search for index.mjs files within directories
            extensions: ['.js', '.json', '.node', '.mjs'],
        });
        url = pathToFileURL(resolution).href;
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            // Match Node's error code
            error.code = 'ERR_MODULE_NOT_FOUND';
        }
        throw error;
    }

    return next(url, context);
}

// import path from 'node:path';
//
// export default function loadAliases(aliasesToAdd) {with
//     const getAliases = () => {
//
//         const base = process.cwd();
//
//         const absoluteAliases = Object.keys(aliasesToAdd).reduce((acc, key) =>
//                 aliasesToAdd[key][0] === '/'
//                     ? acc
//                     : { ...acc, [key]: path.join(base, aliasesToAdd[key]) },
//             aliasesToAdd)
//
//         return absoluteAliases;
//
//     }
//
//     const isAliasInSpecifier = (path, alias) => {
//         return path.indexOf(alias) === 0
//             && (path.length === alias.length || path[alias.length] === '/')
//     }
//
//     const aliases = getAliases();
//
//     return (specifier, parentModuleURL, defaultResolve) => {
//
//         const alias = Object.keys(aliases).find((key) => isAliasInSpecifier(specifier, key));
//
//         const newSpecifier = alias === undefined
//             ? specifier
//             : path.join(aliases[alias], specifier.substr(alias.length));
//
//         return defaultResolve(newSpecifier, parentModuleURL);
//     }
// }
//

// export const resolve =
// export const resolve = loadAliases({
//     "@qwiki": "./dist"
// });

// register(__filename, pathToFileURL("."))