require('dotenv').config();
const { Telegraf } = require('telegraf');
const { initDB } = require('../db/db');
const handlers = require('../handlers/commands');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is not set in .env');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Initialise DB
initDB().catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});

bot.telegram.setMyCommands([
  { command: 'start', description: 'Start the bot' },
  { command: 'browse', description: 'Browse products' },
  { command: 'myorders', description: 'My order history' },
  { command: 'confirm_payment', description: 'Confirm payment' },
  { command: 'checkkey', description: 'Check a MS product key' },
  { command: 'getcid', description: 'Get Confirmation ID' },
  { command: 'help', description: 'Help' },
  { command: 'support', description: 'Contact support' },
]);

// Commands  ← THIS BLOCK WAS MISSING
bot.start(ctx => handlers.handleStart(ctx));
bot.command('browse', ctx => handlers.handleBrowse(ctx));
bot.command('myorders', ctx => handlers.handleMyOrders(ctx));
bot.command('confirm_payment', ctx => handlers.handleConfirmPayment(ctx));
bot.command('getcid', ctx => handlers.handleGetCID(ctx));
bot.command('checkkey', ctx => handlers.handleCheckKey(ctx));
bot.command('help', ctx => handlers.handleHelp(ctx));
bot.command('support', ctx => handlers.handleSupport(ctx));
bot.command('cancel', ctx => handlers.handleCancel(ctx));

// Keyboard buttons
bot.hears('🛒 Browse Products', ctx => handlers.handleBrowse(ctx));
bot.hears('📦 My Orders', ctx => handlers.handleMyOrders(ctx));
bot.hears('❓ Help', ctx => handlers.handleHelp(ctx));
bot.hears('📞 Support', ctx => handlers.handleSupport(ctx));

// Inline button callbacks
bot.action(/^buy_\d+$/, ctx => handlers.handleBuyCallback(ctx));

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err.message);
  ctx.reply('❌ Something went wrong. Please try again.').catch(() => {});
});

bot.launch();
console.log('🤖 Bot is running...');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));