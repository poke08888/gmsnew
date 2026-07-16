# gms-revenue-bot

Watches the GMS `orders` collection (MongoDB Atlas change stream) and posts a
revenue + channel-KPI report to the Telegram group **BM+ Nonelab** on every new order.

## Run locally
    npm install
    cp .env.example .env   # fill in secrets
    npm test               # unit tests
    npm run dry-run -- --print   # preview against latest order, no send
    npm start              # start the watcher

## Deploy (server, pm2)
    pm2 start src/index.js --name gms-revenue-bot --node-args="--env-file=.env"
    pm2 save

## Behavior notes
- Cumulative today/month totals use `createdAt` (Asia/Ho_Chi_Minh time).
- KPI progress uses `orderDate` + `listprice × qty` to match the GMS dashboard.
- Per-order and cumulative revenue shown as both Net and Gross.
- Only `insert` events trigger a message; updates/deletes are ignored.
- The change stream is resumable via a token persisted in `.state/resume-token.json`.
