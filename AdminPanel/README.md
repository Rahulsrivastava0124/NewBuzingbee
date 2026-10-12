# BuzingBee Admin Panel

React 19 + Vite + Material UI v9 (icons: lucide-react). Manages blogs, case
studies, enquiries, traffic and finance (clients, invoices, payments, expenses,
wallet ledger) against the BuzingBee API in `../Backend`.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run lint
```

The API base URL is resolved in this order: `VITE_API_BASE_URL`, then
`https://api.buzingbee.com/api` on `admin.buzingbee.com`, then
`http://localhost:3001/api` on localhost.

## Build and deploy

```bash
VITE_API_BASE_URL=https://api.example.com/api npm run build   # output in dist/
```

`Dockerfile` builds the bundle and serves it with nginx (`nginx.conf` handles
SPA routing and caching). `docker-compose.yml` runs it together with the API;
the API reads its secrets from `../Backend/.env`.

## Layout

- `src/theme.js` - Material UI theme (colours, density, component defaults)
- `src/components/` - shared UI (feedback dialogs, page header, rich text editor)
- `src/pages/` - route screens; `src/pages/finance/` holds the finance module
- `src/services/api.js` - API client and auth helpers
