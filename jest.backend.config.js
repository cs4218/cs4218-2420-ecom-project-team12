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
    ".*.e2e.test.js", // playwright tests
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{js,jsx}",
  ],
  coveragePathIgnorePatterns: [
    "client",
    "tests",
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
