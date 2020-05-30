module.exports = {
    transform: { '^.+\\.ts?$': 'ts-jest' },
    coveragePathIgnorePatterns:['test/test.utils.js'],
    coverageThreshold: {
      global: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  };