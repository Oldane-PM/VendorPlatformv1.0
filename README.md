# Vendor Management Portal (VendorPlatformv1.0)

This is a code bundle for Vendor Management Portal. The original project is available at https://www.figma.com/design/YiYegc5RsC8Eltv4wp4jrN/Vendor-Management-Portal.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Deploying on Railway

- **Config file:** `railway.toml` (Railway does **not** use `railway.yaml`; use `railway.toml` or `railway.json` per [Config as code](https://docs.railway.com/reference/config-as-code)).
- **Builder:** **`DOCKERFILE`** — the repo ships a root **`Dockerfile`** based on **`node:20-bookworm-slim`** so builds never use Node 18 (Next 16 needs **≥20.9**). Railpack alone was still resolving to Node 18 on some deploys.
- **Local Docker:** `docker compose up --build` (see `docker-compose.yml`).
- **Why `package-lock.json` is committed:** `npm ci` in the Dockerfile needs a lockfile in sync with `package.json`.
