FROM node:25.6 AS builder

WORKDIR /app

COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build

FROM node:25.6 AS dependenciesbuilder

WORKDIR /app

COPY package.json package.json
RUN npm install --omit=dev


FROM node:25.6-slim

WORKDIR /app
COPY --from=builder /app/package.json package.json
COPY --from=dependenciesbuilder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

CMD ["node", "server/entry.express"]