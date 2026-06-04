import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  // Use the pre-configured ESM presets provided by ts-jest
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  
  // Direct ts-jest to transpile using native ES Module outputs
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // 🚨 CRITICAL MAPPING: Tells Jest that if an import looks for './file.js',
  // it should look inside your code for './file.ts' instead.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Where to scan for testing files
  testMatch: ['**/src/tests/**/*.test.ts'],
  verbose: true,
};

export default jestConfig;