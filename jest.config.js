module.exports = {
    transform: { '^.+\\.ts?$': 'ts-jest' },
    coverageThreshold: {
      global: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  };