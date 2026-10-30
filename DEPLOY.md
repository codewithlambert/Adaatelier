# Deploying Ada Atelier

The site is a TanStack Start app. `npm run build` produces a standalone Node server in `.output/`.

## pxxl (or any Node host)

| Setting             | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| Framework / runtime | Node.js 20.19 or newer (22 LTS recommended)                 |
| Install command     | `npm install`                                               |
| Build command       | `npm run build`                                             |
| Start command       | `npm start`                                                 |
| Port                | read from the `PORT` environment variable the host provides |

`npm start` runs `node .output/server/index.mjs`, which serves the pages and the static assets in `.output/public`.

No environment variables are required. To build for another target, set `NITRO_PRESET` (for example `vercel` or `cloudflare-module`) before `npm run build`.

## Run the production build locally

```bash
npm run build
PORT=4321 npm start
```

Then open http://localhost:4321.
