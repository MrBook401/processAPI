module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  coverageReporters: ['html', 'json', 'lcov', 'cobertura'],
  coverageDirectory: `coverage`,
};
