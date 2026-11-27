# Placement App UI

## Run locally

Start the Go API with its local PostgreSQL database using the [API setup instructions](https://github.com/SufyaanKhateeb/placement-app-api#run-locally-with-a-separate-database). Then run:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Vite sends API requests to the local Go server. For a manual verification test, create an account with a fixture email, switch tabs to get its code from the API terminal, return to the app, and complete sign-up.

## Run the browser regression

```sh
npx playwright install chromium
npm run test:e2e
```

The test starts its own UI server on port 3001. It simulates the email and session API responses, switches away and back, reloads, and completes verification on both the login and sign-up pages. It runs in CI without a database or email account.

## Build

```sh
npm run build
```
