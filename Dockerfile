FROM node:25.6 AS build

WORKDIR /app

COPY package.json package.json
RUN npm install
COPY . .
RUN npm run build

FROM node:25.6-slim

WORKDIR /app
COPY --from=build /app/package.json package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

CMD ["node", "server/entry.express"]