# Deployment

## Status

The hosted demo is no longer running. This file records how it was deployed: server on Render, client on Cloudflare Pages.

---

## Render (server)

`render.yaml` is committed and auto-detected by Render.

**Setup steps:**
1. Render dashboard > New > Web Service > Connect GitHub > gecko repo
2. Render reads `render.yaml` automatically (`rootDir=server`, `buildCommand=npm install`, `startCommand=npm start`)
3. Set all `sync: false` env vars in Render dashboard (never commit secrets):
   - `MONGODB_URI`
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - `GROQ_API_KEY`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `OCR_SPACE_API_KEY`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NEWSLETTER_FROM_EMAIL`
   - `CLIENT_URL` = `https://<pages-project>.pages.dev`
4. Note the Render URL — needed for client `VITE_API_URL`

**Health check:** `GET /healthz` returns `{ status: "ok", uptime: N }`.

**Gotcha:** do NOT hardcode `PORT` in `render.yaml`. Render injects its own port at runtime; hardcoding returns HTTP 000 from the proxy.

**Cold starts:** free tier sleeps after inactivity. First request after sleep can take 30-60s. API client timeout is set to 60s to tolerate this.

---

## Cloudflare Pages (client)

Project: `gecko-client`. `wrangler.jsonc` + `client/public/_redirects` (SPA routing) committed.

### Manual build + deploy (current workflow)

The project was created via direct upload API — GitHub auto-build is not connected yet. Build and deploy manually:

```bash
# 1. Create client/.env.production with all VITE_* vars (never commit this file)
# VITE_API_URL=https://<render-service>.onrender.com
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=zoar-eed92.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=zoar-eed92
# VITE_FIREBASE_STORAGE_BUCKET=zoar-eed92.firebasestorage.app
# VITE_FIREBASE_MESSAGING_SENDER_ID=812712742589
# VITE_FIREBASE_APP_ID=1:812712742589:web:b7dac925e379ec2630f1d4

# 2. Build from WSL (must use Linux node, not Windows node - Rollup has platform-specific binaries)
export PATH=/tmp/node-v20.19.1-linux-x64/bin:$PATH
cd /path/to/gecko/client
node node_modules/vite/bin/vite.js build

# 3. Delete .env.production immediately after build
rm client/.env.production

# 4. Deploy from PowerShell (wrangler needs a non-UNC working dir)
# Map WSL to Z: drive first if not already mapped:
# net use Z: \\wsl.localhost\ubuntu
#
# Then in PowerShell:
$env:CLOUDFLARE_API_TOKEN="<token>"
$env:HOME="C:\Users\me"
$env:USERPROFILE="C:\Users\me"
cd "X:\path\to\gecko"
npx wrangler pages deploy client/dist --project-name gecko-client --branch main
```

The token needs the Cloudflare Pages Edit permission.

### Connect GitHub for auto-build (optional, eliminates manual workflow)

CF Pages dashboard > gecko-client > Settings > Builds & deployments > Connect Git. Once connected, every push to main triggers a CF-side build using the env vars set in the project dashboard.

### Firebase authorized domains

After adding a new Pages domain, add it to:
1. Firebase console > Authentication > Settings > Authorised domains
2. Google Cloud Console > APIs & credentials > Web client (auto created by Google Service) > Authorized JavaScript origins

---

## Docker (server only, local prod test)

```bash
docker build -t gecko-server .
docker run -p 3001:3001 --env-file server/.env gecko-server
```

---

## WSL build quirks

- **Never build from Windows node on WSL paths.** Rollup requires platform-native binaries; Windows node can't use Linux rollup and vice-versa.
- **UNC path workaround:** `npm run build` from PowerShell on `\\wsl.localhost\...` paths fails with "CMD.EXE was started with UNC path". Map WSL to a drive letter first (`net use Z: \\wsl.localhost\ubuntu`) OR build from inside WSL bash.
- **Standalone Linux node:** if WSL has no system node installed, download the tarball to `/tmp/`: `wget https://nodejs.org/dist/v20.19.1/node-v20.19.1-linux-x64.tar.xz -P /tmp/ && tar -xf /tmp/node-v20.19.1-linux-x64.tar.xz -C /tmp/`. Then prefix PATH.
- **HUSKY=0:** all git commits from PowerShell/WSL must set `HUSKY=0` to skip the pre-commit hook (lint-staged EISDIR on Windows npm symlinks).
