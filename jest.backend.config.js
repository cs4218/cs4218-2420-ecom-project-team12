export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/**/*.test.js",
  ],

  testPathIgnorePatterns: [
    "<rootDir>/client/*",
    "<rootDir>/tests/*", // playwright tests
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{js,jsx}",
  ],
  coveragePathIgnorePatterns: [
    "client",
    "tests", // playwright tests
    "node_modules",
    "coverage",
    "playwright-report",
  ],
  coverageThreshold: {
    global: {
      lines: 0,
      functions: 0,
    },
  },
};
