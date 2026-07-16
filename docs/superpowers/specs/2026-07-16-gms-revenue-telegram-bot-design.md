# GMS Revenue Telegram Bot — Design

**Ngày:** 2026-07-16
**Tác giả:** Kevin + Claude

## 1. Mục tiêu

Mỗi khi có **đơn hàng mới** trong hệ thống GMS (`gms.nonelab.net`), tự động gửi một tin nhắn
vào group Telegram **"BM+ Nonelab"** báo cáo:

- Thông tin đơn hàng mới.
- Doanh thu của đơn (Net + Gross).
- Doanh thu luỹ kế **hôm nay** và **tháng này** (theo `createdAt`, giờ VN).
- Tỷ lệ hoàn thành **KPI của mỗi kênh** có KPI trong tháng hiện tại.

## 2. Bối cảnh hệ thống (đã khảo sát)

- **Nguồn dữ liệu:** MongoDB Atlas, database `gms`, collection `orders` (~800 đơn).
  Connection string: `mongodb+srv://USER:PASS@cluster1-dinh.uxgbola.mongodb.net/gms`.
- Cluster là **replica set** (`atlas-oktaj6-shard-0`) → hỗ trợ **change stream**.
- **Server:** `150.95.104.255` (Ubuntu 26.04), có Node v22 + pm2 sẵn. App GMS chạy trong
  container `nonelab-gms-1`. Bot sẽ chạy **độc lập dưới pm2**, KHÔNG sửa/deploy lại app GMS.
- **Telegram:** bot `@BabyKevintopkhongphaibot` (token đã có), group `BM+ Nonelab`,
  chat ID thật = `-5166227019`. Đã test gửi tin thành công.

### Schema liên quan

- `orders`: `_id`, `userId→users`, `partnerId→partners`, `brandId→brands`, `orderDate`,
  `deliveryDate`, `orderCode`, `createdAt`, `items[]` = `{name, sku, qty, listprice, netprice, grossprice}`.
- `partners`: `_id`, `name`, `channelId→channels`.
- `channels`: `_id`, `name`.
- `brands`: `_id`, `name`. `users`: `_id`, `name`.
- `kpis`: `_id`, `type` (`Channel|User|Partner`), `targetId`, `period` (`MONTH|QUARTER|YEAR`),
  `timeframe` (chuỗi dạng `"2026-7"` — **không** zero-pad), `amount`.

### Công thức doanh thu

- **Net đơn** = Σ(`item.netprice × item.qty`).
- **Gross đơn** = Σ(`item.grossprice × item.qty`).
- **KPI kênh (khớp dashboard):** với mỗi KPI `type=Channel` của **kỳ hiện tại**:
  - Lấy các `partnerId` có `channelId == kpi.targetId`.
  - Tính `currentValue` = Σ(`item.listprice × item.qty`) của các đơn có `partnerId ∈ đó`
    và `orderDate ∈ [startDate, endDate]` của kỳ.
  - `progress = min(100, round(currentValue / amount × 100, 2))`.
  - Kỳ hiện tại: tách `timeframe` theo `-`, so `year==nay && month==nay` (MONTH),
    quý (QUARTER), hoặc năm (YEAR). Mốc ngày tính theo giờ VN.

## 3. Kiến trúc

Tiến trình Node đơn lẻ, tên pm2 **`gms-revenue-bot`**. Các module:

- `src/config.js` — nạp biến môi trường từ `.env` (Mongo URI, bot token, chat ID, TZ).
- `src/db.js` — kết nối Mongoose tới `gms`; export các model tối thiểu (order, partner,
  channel, brand, user, kpi) hoặc dùng raw collection + aggregation.
- `src/revenue.js` — hàm thuần tính: doanh thu đơn, luỹ kế hôm nay/tháng (theo `createdAt`),
  và tiến độ KPI kênh (theo `orderDate`, `listprice`). Nhận `now` làm tham số để test được.
- `src/telegram.js` — `sendMessage(text)` với retry (3 lần, backoff), parse_mode HTML.
- `src/format.js` — dựng nội dung tin nhắn từ dữ liệu (thuần, test được). Format tiền `vi-VN`.
- `src/watcher.js` — mở change stream `orders` (`operationType=insert`), lưu `resumeToken`
  vào file để resume sau khi ngắt; với mỗi đơn mới → gọi tính toán → gửi Telegram.
- `src/index.js` — bootstrap: connect DB → start watcher; xử lý tín hiệu tắt.

### Luồng dữ liệu

```
Đơn mới (insert) ─▶ change stream ─▶ nạp order + brand/partner/channel/user
   ─▶ tính doanh thu đơn (net/gross)
   ─▶ tính luỹ kế hôm nay & tháng (createdAt, giờ VN)
   ─▶ tính KPI mỗi kênh có KPI tháng (orderDate, listprice)
   ─▶ format tin nhắn ─▶ gửi Telegram (retry)
```

## 4. Nội dung tin nhắn (mẫu)

```
🛒 ĐƠN HÀNG MỚI — Menow20260716852282
🏷 Brand: Menow · Kênh: TikTok Shop · Đối tác: ABC
👤 NV: Nguyễn Văn A · 🕒 16/07/2026 11:21

📦 2 mặt hàng · 4 sản phẩm
💵 Doanh thu đơn: Net 190.388đ · Gross 205.619đ

📈 Luỹ kế theo ngày tạo đơn (giờ VN)
• Hôm nay: Net … · Gross …
• Tháng 07/2026: Net … · Gross …

🎯 Tiến độ KPI kênh — tháng 07/2026
⭐ TikTok Shop: 65,0% (1,95 tỷ / 3 tỷ)
• Shopee: 42,3% (1,80 tỷ / 4,25 tỷ)
• …
```

- Kênh của đơn mới được đánh dấu ⭐.
- Nếu không có KPI kênh nào cho tháng hiện tại → bỏ mục "Tiến độ KPI kênh" (hoặc ghi "Chưa đặt KPI tháng này").

## 5. Quyết định phạm vi (đã chốt với người dùng)

| Vấn đề | Quyết định |
|---|---|
| Mức giá doanh thu đơn & luỹ kế | Hiển thị **cả Net và Gross** |
| Luỹ kế hôm nay/tháng | **Toàn bộ** (mọi kênh/brand), theo **`createdAt`**, giờ VN |
| KPI kênh | **Tất cả kênh có KPI tháng hiện tại**; % theo `listprice × qty`, theo `orderDate` (khớp dashboard) |
| Cơ chế | **Change stream realtime** |
| Múi giờ | `Asia/Ho_Chi_Minh` (GMT+7) |

> Ghi chú: Luỹ kế dùng `createdAt` (doanh thu phát sinh realtime), còn KPI dùng `orderDate`
> để trùng khớp con số trên dashboard mà team đang xem. Đây là chủ ý, không phải mâu thuẫn.

## 6. Triển khai & vận hành

- Thư mục trên server: `/root/gms-revenue-bot`.
- Cấu hình bí mật trong `.env` (chmod 600): `MONGODB_URI`, `TELEGRAM_BOT_TOKEN`,
  `TELEGRAM_CHAT_ID`, `TZ=Asia/Ho_Chi_Minh`.
- Chạy: `pm2 start src/index.js --name gms-revenue-bot`, `pm2 save`.
- `resumeToken` lưu ở `.state/resume-token.json` để không bỏ sót đơn khi restart.

## 7. Xử lý lỗi

- Change stream đứt → thử resume bằng token đã lưu; nếu token quá cũ/invalid → mở stream mới
  (chấp nhận có thể bỏ sót đơn trong lúc gián đoạn, ghi log cảnh báo).
- Gửi Telegram lỗi → retry 3 lần (backoff 1s/3s/9s) rồi ghi log, không làm sập tiến trình.
- Mất kết nối Mongo → để lỗi nổi lên, pm2 restart, resume từ token.
- Mỗi đơn xử lý trong try/catch riêng để một đơn lỗi không chặn các đơn sau.

## 8. Kiểm thử

- **Unit (thuần):** `revenue.js` và `format.js` với dữ liệu order/kpi giả lập
  (kiểm tra net/gross, biên giờ VN cho "hôm nay"/"tháng", % KPI trùng công thức dashboard,
  `timeframe` không zero-pad `"2026-7"`).
- **Tích hợp (thủ công, có kiểm soát):** chèn 1 đơn test vào `orders` rồi xoá, xác nhận
  tin nhắn xuất hiện đúng trong group; hoặc chạy hàm xử lý trực tiếp trên đơn mới nhất và
  gửi vào group để đối chiếu số với dashboard.

## 9. Ngoài phạm vi (YAGNI)

- Không có dashboard/wo giao diện riêng cho bot.
- Không sửa app GMS, không thêm webhook vào GMS.
- Không xử lý cập nhật/xoá đơn (chỉ `insert`).
- Không gộp/không throttle nhiều đơn (mỗi đơn 1 tin) — thêm sau nếu spam.
