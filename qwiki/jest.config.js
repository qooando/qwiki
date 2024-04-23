const {pathsToModuleNameMapper} = require("ts-jest");
/** @type {import('ts-jest').JestConfigWithTsJest} */
// see also https://github.com/mtiller/ts-jest-sample
const {compilerOptions} = require("./tsconfig.json");

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    testPathIgnorePatterns: [
        "/node_modules/",
        ".*/resources/.*"
    ],
    roots: [
        "<rootDir>",
    ],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>'}),
    moduleFileExtensions: ["tsx", "jsx", "js", "ts"]
};