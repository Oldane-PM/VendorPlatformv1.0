# Pin Node 20 — Next.js 16 requires >=20.9 (Railpack was still using Node 18).
FROM node:20-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install includes devDependencies (Tailwind, TS, etc.) required for `next build`.
# Prevents npm from treating install as production-only and avoids install/build skew.
ENV NPM_CONFIG_PRODUCTION=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
