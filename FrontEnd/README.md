# ScoutMarket Frontend

React/Vite frontend for the ScoutMarket football player marketplace.

See the root `README.md` for the full project overview, backend setup, environment variables, and demo-mode notes.

## Local Setup

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

## Build

```powershell
npm run build
```

For a static public demo without a deployed backend, set `VITE_USE_MOCK_API=true`. Mock mode only covers the public home page and public player listing; authenticated flows still require the backend.
