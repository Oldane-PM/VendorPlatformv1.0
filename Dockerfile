# Pin Node 20+ so Railway/Nixpacks never falls back to Node 18 (Next 16 + deps require it).
# https://hub.docker.com/_/node
FROM node:20-bookworm-slim AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
