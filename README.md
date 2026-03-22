# Vendor Management Portal (VendorPlatformv1.0)

This is a code bundle for Vendor Management Portal. The original project is available at https://www.figma.com/design/YiYegc5RsC8Eltv4wp4jrN/Vendor-Management-Portal.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Deploying on Railway

- **Config file:** `railway.toml` (Railway does **not** use `railway.yaml`; use `railway.toml` or `railway.json` per [Config as code](https://docs.railway.com/reference/config-as-code)).
- **Builder:** `RAILPACK` (default on Railway). The repo uses **Railpack** + `buildCommand` / `startCommand` in `railway.toml` — no Docker required.
- **Node version:** In the Railway service, add variable **`NODE_VERSION=20`** (Next 16 and several deps need Node ≥20). `package.json` `engines.node` should match.
- **Why `package-lock.json` is committed:** Railway runs `npm ci` in many builds; the lockfile must match `package.json`.
