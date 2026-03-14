# Cloudflare Pages deployment

This project deploys as static assets from `dist/`.

## Prerequisites

- Cloudflare account
- Node.js 20+
- npm dependencies installed (`npm install`)

## Build artifacts

```bash
npm run build
```

Output directory: `dist/`

This project also ships `public/_redirects`, so the build output includes a fallback rule for client-side routes.

## Option A: dashboard static upload

1. Open Cloudflare dashboard.
2. Go to `Workers & Pages`.
3. Select `Create`.
4. Select `Pages`.
5. Select `Upload assets`.
6. Upload the local `dist/` directory.
7. Deploy.

## Option B: CLI upload (optional)

```bash
npx wrangler pages deploy dist --project-name 01-lit-starter
```

## SPA fallback for deep links

This app uses client-side routing (`history.pushState`), so direct loads of `/about` or `/list` should return `index.html`.

The repository includes `public/_redirects` with this rule:

```text
/* /index.html 200
```

If deep links still 404 after deploy, confirm Cloudflare is serving the generated `_redirects` file from `dist/`.

## GitHub Actions deploy setup

The repository includes these workflows:

- `.github/workflows/lit-starter-ci.yml`
- `.github/workflows/lit-starter-preview.yml`
- `.github/workflows/lit-starter-production.yml`

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The deploy workflows build `01-lit-starter/dist` and upload it to the Cloudflare Pages project named `01-lit-starter`. Non-`main` branches create preview deployments, and `main` pushes deploy production.

## Post-deploy validation

- Visit `/` and confirm "Welcome Home" renders.
- Visit `/about` and confirm async text appears after loading state.
- Visit `/list` and click a list item to confirm alert handling.
- Hard refresh `/about` and `/list` to confirm route fallback behavior.
