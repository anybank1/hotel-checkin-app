# ระบบบันทึกการเข้าพักโรงแรม

เว็บแอปบันทึกการเข้าพักของแขกในโรงแรม อย่างง่าย — รันบน Cloudflare Pages + D1

## ฟีเจอร์

- ✅ บันทึกข้อมูลแขก (ชื่อ, เบอร์โทร, บัตรประชาชน/พาสปอร์ต, ที่อยู่)
- ✅ บันทึกข้อมูลห้องพัก (หมายเลข, ประเภท, ราคา)
- ✅ บันทึกวันเช็คอิน/เช็คเอาท์ + คำนวณยอดรวมอัตโนมัติ
- ✅ แก้ไข / ลบ รายการ
- ✅ ค้นหาด้วยชื่อ, เบอร์, เลขห้อง
- ✅ กรองตามสถานะ (กำลังพัก / จะเข้าพัก / เช็คเอาท์แล้ว)
- ✅ แดชบอร์ดสรุปยอด (แขกปัจจุบัน, ห้องว่าง, รายได้รวม, สรุปตามประเภท)
- ✅ Export CSV (เปิดใน Excel ได้ รองรับภาษาไทย)
- ✅ UI ภาษาไทย ตอบสนองทุกขนาดจอ
- ✅ รันบน Cloudflare Pages + Cloudflare D1 (SQLite at the edge)

## เทคโนโลยี

- Next.js 15 (App Router) + TypeScript
- React 19
- Tailwind CSS
- Cloudflare D1 (SQLite at the edge)
- @opennextjs/cloudflare (deploy adapter)
- lucide-react (icons)

## วิธีรัน Local Dev

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

> Local dev ใช้ better-sqlite3 (ไฟล์ `data/hotel.db`)
> Production ใช้ Cloudflare D1 อัตโนมัติ

## วิธี Deploy บน Cloudflare Pages

### 1. ติดตั้ง wrangler และ login

```bash
npx wrangler login
```

### 2. สร้าง D1 database

```bash
npx wrangler d1 create hotel-db
```

> คัดลอก `database_id` ที่ได้ ไปใส่ใน `wrangler.toml` แทน `YOUR_D1_DATABASE_ID`

### 3. รัน schema บน D1

```bash
# Local (สำหรับทดสอบ)
npx wrangler d1 execute hotel-db --local --file=db/schema.sql

# Remote (production)
npx wrangler d1 execute hotel-db --remote --file=db/schema.sql
```

### 4. Build และ deploy

```bash
npm run build
npx opennextjs-cloudflare
npx wrangler pages deploy
```

หรือรัน local preview ก่อน:

```bash
npx wrangler pages dev
```

## โครงสร้างโปรเจกต์

```
hotel-checkin-app/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # หน้าหลัก (แดชบอร์ด + รายการ + ฟอร์ม)
│   ├── globals.css             # Tailwind + custom styles
│   └── api/
│       └── guests/
│           ├── route.ts         # GET (list+search+stats) / POST (create)
│           ├── [id]/
│           │   └── route.ts     # PUT (update) / DELETE
│           └── export/
│               └── route.ts     # GET → CSV export
├── lib/
│   ├── db.ts                   # DB abstraction (SQLite dev / D1 prod)
│   └── types.ts                # TypeScript types
├── db/
│   └── schema.sql              # D1 database schema
├── open-next.config.ts         # OpenNext for Cloudflare config
├── wrangler.toml               # Cloudflare Pages + D1 config
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## ข้อมูลที่เก็บ

| ฟิลด์ | คำอธิบาย |
|-------|---------|
| full_name | ชื่อ-นามสกุล |
| phone | เบอร์โทร |
| id_card | บัตรประชาชน / พาสปอร์ต |
| address | ที่อยู่ |
| room_number | หมายเลขห้อง |
| room_type | ประเภท (Standard/Deluxe/Family) |
| check_in | วันเช็คอิน |
| check_out | วันเช็คเอาท์ |
| price_per_night | ราคาต่อคืน |
| total_amount | ยอดรวม (คำนวณอัตโนมัติ) |

## ปรับแต่ง

- **จำนวนห้องทั้งหมด:** แก้ `TOTAL_ROOMS` ใน `lib/db.ts` (ปัจจุบัน = 19)
- **สีแบรนด์:** แก้ `colors.brand` ใน `tailwind.config.ts`
- **D1 database ID:** แก้ `database_id` ใน `wrangler.toml`
