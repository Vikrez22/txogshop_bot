# Telegram Shop Bot 

A Telegram bot for selling Microsoft license keys (Windows, Office, M365).  
Accepts TRON USDT (TRC20) payments. Integrates with the CIDMS/PIDMS API at pidkey.com.

---

## Features

- 🛒 Browse products by category
- 💳 TRON USDT payment flow
- 🔑 Automatic key delivery after payment
- 📦 Order history per user
- 🔧 `/checkkey` — check any MS product key via PIDMS API
- 🔧 `/getcid` — get Confirmation ID from Installation ID via CIDMS API

---

## Setup

### 1. Prerequisites
- Node.js 18+
- MySQL server running

### 2. Clone & install
```bash
git clone https://github.com/
cd telegram-shop-bot
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```
BOT_TOKEN=your_telegram_bot_token        # from @BotFather
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=yourpassword
DB_NAME=shopbot
CIDMS_API_KEY=your_api_key_from_pidkey.com
TRON_WALLET=your_TRC20_wallet_address
```

### 4. Create the MySQL database
```sql
CREATE DATABASE shopbot;
```
The tables are created automatically on first run.

### 5. Run
```bash
# Development
node src/bot/bot.js

# Production (with PM2)
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

---

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome message + menu |
| `/browse` | Show all products |
| `/myorders` | View your order history |
| `/confirm_payment <TX>` | Confirm USDT payment with TX hash |
| `/checkkey <KEY>` | Check a Microsoft product key |
| `/getcid <IID>` | Get Confirmation ID from Installation ID |
| `/help` | Help message |
| `/support` | Contact support |
| `/cancel` | Cancel current order |

---

## Adding Keys to Stock

Use MySQL directly to add license keys:
```sql
-- Find product IDs
SELECT id, name FROM products;

-- Add a key
INSERT INTO keys_stock (product_id, license_key) VALUES (1, 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
```

---

## Project Structure

```
src/
├── bot/
│   └── bot.js              # Entry point, registers all handlers
├── db/
│   └── db.js               # MySQL connection + schema init
├── handlers/
│   └── commands.js         # All command & callback handlers
└── services/
    ├── cidms.service.js    # CIDMS/PIDMS API integration
    └── shop.service.js     # Product, order, key delivery logic
ecosystem.config.js         # PM2 config
.env.example                # Environment template
```

---

## Payment Flow

1. User clicks **Buy** on a product
2. Bot shows TRON wallet address + amount
3. User sends USDT (TRC20) and runs `/confirm_payment <TX_HASH>`
4. Bot marks order as paid and delivers the license key automatically

> ⚠️ **Production note:** Add TRON blockchain TX verification before marking orders as paid.
> Use the TronGrid or TronScan API to confirm the transaction.
# txogshop_bot
