# MERN

## Setup

Clone this repo and navigate to the project directory. Then,


Install server dependencies:

```
npm install
```

Install client dependencies:

```
cd client
npm install
cd ..
```

Configure your environment variables by editing the `.env` file in the root directory.

- Set `MONGO_URL` to your MongoDB connection string, e.g., if you have a local MongoDB instance running on the default port with the database set up as `mern`, set it to `mongodb://localhost:27017/mern`.
- Other parameters like the `JWT_SECRET` should be changed if desired, especially in production.


If you would like to test with Playwright, install Playwright browsers and dependencies:

```
npx playwright install --with-deps
```


## Development

Test the server (starts both server and client, auto restarts on changes):
```
npm run dev
```

**Dev notes:**

- The **server files** are in the project root directory.

- The **client files** are in the `client` directory (from the project root).

- **Jest unit tests** are located alongside the files they test, with the test files having the `.test.js` extension.

- **Jest integration tests** are located in the `tests` directory (from the project root), with the test files having the `.test.js` extension.

- **Playwright end-to-end tests** are located in the `tests` directory (from the project root), with the test files having the `.e2e.test.js` extension.



## Testing


**Run frontend Jest tests:**
```
npm run test:frontend
```

**Run backend Jest tests:**
```
npm run test:backend
```

**Run Playwright tests:**
```
npx playwright test
```
Note that as of now, Playwright tests will use the environment variables configured within `.env`.


**Run all tests:**
```
npm run test:frontend && npm run test:backend && npx playwright test
```


## Continuous Integration (CI)

[![Run Jest Tests Workflow Status](https://github.com/cs4218/cs4218-2420-ecom-project-team12/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/cs4218/cs4218-2420-ecom-project-team12/actions/workflows/main.yml?query=branch%3Amain) [![Run Playwright Tests Workflow Status](https://github.com/cs4218/cs4218-2420-ecom-project-team12/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/cs4218/cs4218-2420-ecom-project-team12/actions/workflows/playwright.yml?query=branch%3Amain)

- [View MS1 GitHub Actions Workflow](https://github.com/cs4218/cs4218-2420-ecom-project-team12/actions/runs/13753025188/job/38456398184)
