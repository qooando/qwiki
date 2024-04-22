const {pathsToModuleNameMapper} = require("ts-jest");
/** @type {import('ts-jest').JestConfigWithTsJest} */
// see also https://github.com/mtiller/ts-jest-sample
const {compilerOptions} = require("./tsconfig.json");

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    testPathIgnorePatterns: [
        "/node_modules/"
    ],
    roots: [
        "<rootDir>",
    ],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>'})
    // moduleNameMapper: {
    //     "^@qwiki/(.*)$": [
    //         "<rootDir>/dist/$1.js",
    //         "<rootDir>/src/$1.ts"
    //     ]
    // }
};