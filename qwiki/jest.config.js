/** @type {import('ts-jest').JestConfigWithTsJest} */
// see also https://github.com/mtiller/ts-jest-sample
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  testPathIgnorePatterns: [
      "/node_modules/"
  ],
  roots: [
      "<rootDir>",
  ]
};