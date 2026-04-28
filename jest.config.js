module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
};
