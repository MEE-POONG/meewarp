# meeWarp

Cross-stack setup for the Warp distribution system, featuring an Express/MongoDB backend and a Vite + React (TS) frontend.

## Prerequisites
- Node.js 18+
- npm 9+
- Local MongoDB instance (or MongoDB Atlas connection string)

## Environment Setup

### Server (`/server`)
1. Copy the example env file:
   ```bash
   cp server/.env.example server/.env
   ```
2. Adjust the values as needed:
   - `SERVER_PORT` – port Express should listen on (defaults to 5000).
   - `MONGODB_URI` – Mongo connection string.
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` – credentials required for the admin login endpoint.
   - `ADMIN_JWT_SECRET` – signing secret for issued JWTs.
   - `RATE_LIMIT_*` and `LOGIN_RATE_LIMIT_*` – knobs for request throttling.

### Client (`/client`)
1. Copy the example env file:
   ```bash
   cp client/.env.example client/.env
   ```
2. Update `VITE_API_BASE_URL` if the frontend should call a non-proxied API base (defaults to `/api`).

## Installation & Scripts

### Backend
```bash
cd server
npm install
npm run start
```
The server reads config from `server/.env` and, by default, connects to `mongodb://localhost:27017/meewarp`.

### Frontend
```bash
cd client
npm install
npm run dev
```
The dev server proxies `/api` to `http://localhost:5000` (configurable in `vite.config.ts`).
- `/admin` สำหรับสร้างโปรไฟล์และออก PayLink, `/admin/activity` แสดง Warp activity log แบบเรียลไทม์

## Structure Overview
```
client/      Vite React application (TS, Tailwind, React Router)
server/      Express API with Mongoose models and admin routes
```

## Testing

### Backend
```bash
cd server
npm test
```

> Uses Jest + Supertest with an in-memory MongoDB instance. Ensure your environment permits spawning child processes/listening on ephemeral ports.

### Frontend
```bash
cd client
npm run test:run
```

Vitest with Testing Library covers the admin form interactions. `npm run test` stays in watch mode for local development.

### Continuous Integration
GitHub Actions workflow at `.github/workflows/ci.yml` installs dependencies for both packages and executes the test suites on every push/PR.

## Realtime Leaderboard & Display Queue
- `GET /api/v1/leaderboard/top-supporters` returns the latest top supporters (aggregated by amount).
- `GET /api/v1/leaderboard/stream` exposes a Server-Sent Events stream; every transaction update pushes the refreshed leaderboard.
- `POST /api/v1/transactions` (admin auth required) registers a warp transaction; หากตั้งค่า ChillPay ระบบจะออก PayLink และตั้งสถานะเป็น `pending`
- `GET /api/v1/transactions/activity-log` (admin auth) ให้ทีมงานดึง last activities ของ Warp transactions (เช่น created/updated)
- `POST /api/v1/transactions/:id/check-status` (admin auth) เชื่อม ChillPay Transaction API เพื่อตรวจสอบสถานะการชำระเงินตาม reference
- `POST /api/v1/public/transactions/check-status` (public) ให้ลูกค้ากดตรวจสอบสถานะด้วย transactionId หรือ payLink token (อ่านอย่างเดียว)
- `GET /api/v1/display/stream` เปิด Server-Sent Events สำหรับหน้าจอหลัก ใช้จับ queue / warp กำลังแสดงผลแบบเรียลไทม์
- `POST /api/v1/public/display/next` ล็อก transaction ที่จ่ายแล้ว (`status: paid`) และอัปเดตเป็น `displaying` โดยคืนข้อมูลให้จอหลักนำไปเรนเดอร์ตามเวลาที่ซื้อมา
- `POST /api/v1/public/display/:id/complete` (public) ให้จอหลักแจ้งว่า Warp แสดงผลครบเวลาแล้ว ระบบจะบันทึกสถานะเป็น `displayed`

## ChillPay Integration (beta)
- ตั้งค่า `CHILLPAY_*` ใน `server/.env` พร้อม `PUBLIC_BASE_URL` (URL ฝั่งลูกค้า) และ `PUBLIC_API_BASE_URL` (เช่น URL backend ที่สามารถรับ webhook/ใช้ตรวจสถานะได้)
- `CHILLPAY_TRANSACTION_URL` ใช้เรียก Transaction API เพื่อตรวจสอบสถานะใน sandbox/production
- `CHILLPAY_AUTO_POLL` (ค่าเริ่มต้น true) เปิด/ปิดการตรวจสถานะอัตโนมัติ, `CHILLPAY_POLL_CRON` ตั้ง cron pattern (ค่าเริ่มต้น `*/15 * * * * *`), `CHILLPAY_POLL_BATCH` กำหนดจำนวน transaction ในแต่ละรอบ
- ถ้ายังไม่ configure ค่าเหล่านี้ ระบบจะบันทึกธุรกรรมเป็น `paid` แบบจำลอง และข้ามการสร้าง PayLink
- เมื่อมี credential จริง ระบบจะสร้าง ChillPay PayLink หลังสร้าง transaction และตั้ง status เป็น `pending`
- ระบบมี background job (15 วินาทีต่อครั้ง โดยตั้ง `CHILLPAY_POLL_CRON`/`CHILLPAY_AUTO_POLL`) สำหรับเช็กสถานะผ่าน Transaction API และอัปเดตเป็น `paid/failed` อัตโนมัติ เมื่อสำเร็จจะบันทึก activity log พร้อม refresh leaderboard; ทีมงานยังสามารถกด `POST /api/v1/transactions/:id/check-status` เพื่อบังคับตรวจได้เอง

## Customer Warp Modal (Demo)
- TV landing page (`/`) แสดง QR Code ให้ลูกค้าสแกนเพื่อไปยังหน้า `/self-warp` บนมือถือ
- โมดัลจะเรียก `POST /api/v1/transactions` โดยดึง Bearer token แอดมินจาก Auth context (ล็อกอินใน `/admin` ก่อน)
- ราคาเป็นการจำลองยังไม่ผูก Payment Gateway จริง; ปรับ Logic ใน `CustomerWarpModal` ได้เมื่อต้องการเชื่อมระบบชำระเงินจริง
- โมดัลมี validation และ spinner แสดงสถานะ พร้อมข้อความบอกข้อผิดพลาด (ดู `client/src/components/customer/CustomerWarpModal.tsx`)

## Deployment Notes
- Set the server-side admin secrets (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`) via your hosting provider's secret manager.
- For production builds, ensure `VITE_API_BASE_URL` points to the deployed API origin.
