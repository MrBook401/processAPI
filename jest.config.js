module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  coverageReporters: ['clover', 'json', 'lcov', 'cobertura'],
  coverageDirectory: `coverage`,

};
