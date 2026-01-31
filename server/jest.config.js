module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  setupFilesAfterEnv: ['./test/setupTest.js'],
  testPathIgnorePatterns: ['/node_modules/']
};