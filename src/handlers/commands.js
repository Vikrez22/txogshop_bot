const shopService = require('../services/shop.service');
const cidmsService = require('../services/cidms.service');
require('dotenv').config();

const TRON_WALLET = process.env.TRON_WALLET;

const userState = {};

function formatProduct(p) {
  return `🛍 *${p.name}*\n📦 Category: ${p.category}\n💬 ${p.description}\n💰 Price: $${parseFloat(p.price).toFixed(2)} USDT\n📊 Stock: ${p.stock} left\nID: \`${p.id}\``;
}

async function handleStart(ctx) {
  const name = ctx.from.first_name || 'there';
  await ctx.reply(
    `👋 Welcome, *${name}*!\n\nI'm a Microsoft license key shop bot. Here's what I can do:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          ['🛒 Browse Products', '📦 My Orders'],
          ['❓ Help', '📞 Support'],
        ],
        resize_keyboard: true,
      },
    }
  );
}

async function handleBrowse(ctx) {
  const products = await shopService.getAllProducts();

  if (!products.length) {
    return ctx.reply('😔 No products in stock right now. Check back soon!');
  }

  const grouped = {};
  for (const p of products) {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  }

  for (const [category, items] of Object.entries(grouped)) {
    let text = `*📂 ${category}*\n\n`;
    const buttons = [];

    for (const p of items) {
      text += `• *${p.name}* — $${parseFloat(p.price).toFixed(2)} USDT\n`;
      buttons.push([{ text: `🛒 Buy: ${p.name}`, callback_data: `buy_${p.id}` }]);
    }

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
  }
}

async function handleBuyCallback(ctx) {
  const telegramId = ctx.from.id;
  const productId = parseInt(ctx.callbackQuery.data.replace('buy_', ''));

  await ctx.answerCbQuery();

  const product = await shopService.getProductById(productId);
  if (!product || product.stock < 1) {
    return ctx.reply('❌ Sorry, this product is out of stock.');
  }

  userState[telegramId] = { step: 'confirm_purchase', productId };

  const orderId = await shopService.createOrder(telegramId, productId, 1, product.price);
  userState[telegramId].orderId = orderId;

  await ctx.reply(
    `*Order Summary*\n\n${formatProduct(product)}\n\n✅ Send *$${parseFloat(product.price).toFixed(2)} USDT (TRC20)* to:\n\n\`${TRON_WALLET}\`\n\n📋 Your Order ID: *#${orderId}*\n\nAfter sending, run:\n/confirm_payment <TX_HASH>\n\nOr /cancel to cancel.`,
    { parse_mode: 'Markdown' }
  );
}

async function handleConfirmPayment(ctx) {
  const telegramId = ctx.from.id;
  const parts = ctx.message.text.split(' ');
  const txHash = parts[1];

  if (!txHash) {
    return ctx.reply('❌ Usage: /confirm_payment <TX_HASH>\n\nExample: /confirm_payment abc123def456...');
  }

  const state = userState[telegramId];
  if (!state || !state.orderId) {
    return ctx.reply('❌ No pending order found. Use 🛒 Browse Products to shop first.');
  }

  await ctx.reply('⏳ Verifying your payment, please wait...');

  await shopService.markOrderPaid(state.orderId, txHash);
  const licenseKey = await shopService.deliverKey(state.orderId);

  if (!licenseKey) {
    return ctx.reply(
      `✅ Payment received for Order #${state.orderId}!\n\n⚠️ Temporarily out of keys — our team will deliver within 1 hour.\n\nContact: /support`,
      { parse_mode: 'Markdown' }
    );
  }

  delete userState[telegramId];

  await ctx.reply(
    `✅ *Payment Confirmed!*\n\nOrder #${state.orderId} — License Key:\n\n\`${licenseKey}\`\n\n📌 Please activate within 24 hours.\n❓ Need help? /help`,
    { parse_mode: 'Markdown' }
  );
}

async function handleMyOrders(ctx) {
  const telegramId = ctx.from.id;
  const orders = await shopService.getUserOrders(telegramId);

  if (!orders.length) {
    return ctx.reply('📭 No orders yet. Use 🛒 Browse Products to get started!');
  }

  const statusEmoji = { pending: '⏳', paid: '✅', delivered: '🎁', cancelled: '❌' };

  let text = '*📦 Your Recent Orders*\n\n';
  for (const o of orders) {
    text += `#${o.id} — ${o.product_name}\n`;
    text += `   ${statusEmoji[o.status] || '❓'} ${o.status.toUpperCase()} | $${parseFloat(o.total_price).toFixed(2)} USDT\n`;
    text += `   📅 ${new Date(o.created_at).toLocaleDateString()}\n\n`;
  }

  await ctx.reply(text, { parse_mode: 'Markdown' });
}

async function handleGetCID(ctx) {
  const parts = ctx.message.text.split(' ');
  parts.shift();
  const iid = parts.join(' ').trim();

  if (!iid) {
    return ctx.reply('❌ Usage: /getcid <Installation_ID>');
  }

  await ctx.reply('⏳ Fetching Confirmation ID, please wait...');
  const result = await cidmsService.getCID(iid);

  if (!result || result.had_occurred) {
    return ctx.reply('❌ Could not get CID. Check your Installation ID and try again.');
  }

  await ctx.reply(
    `✅ *Confirmation ID:*\n\n\`${result.confirmation_id_with_dash || result.confirmationid}\``,
    { parse_mode: 'Markdown' }
  );
}

async function handleCheckKey(ctx) {
  const parts = ctx.message.text.split(' ');
  parts.shift();
  const key = parts.join(' ').trim();

  if (!key) {
    return ctx.reply('❌ Usage: /checkkey <ProductKey>');
  }

  await ctx.reply('⏳ Checking key, please wait (may take up to 2 minutes)...');
  const result = await cidmsService.checkKey(key);

  if (!result) {
    return ctx.reply('❌ API error. Please try again later.');
  }

  await ctx.reply(
    `🔑 *Key Check Result:*\n\n\`\`\`\n${JSON.stringify(result, null, 2)}\n\`\`\``,
    { parse_mode: 'Markdown' }
  );
}

async function handleHelp(ctx) {
  await ctx.reply(
    `*📖 Help & Commands*\n\n` +
    `🛒 *Shopping*\n` +
    `/browse — View all products\n` +
    `/myorders — View your order history\n` +
    `/confirm_payment <TX> — Confirm USDT payment\n\n` +
    `🔑 *Key Tools*\n` +
    `/checkkey <KEY> — Check a Microsoft product key\n` +
    `/getcid <IID> — Get Confirmation ID from Installation ID\n\n` +
    `💳 *Payment*\n` +
    `We accept TRON USDT (TRC20) only.\n` +
    `Wallet: \`${TRON_WALLET}\`\n\n` +
    `📞 *Support*: /support`,
    { parse_mode: 'Markdown' }
  );
}

async function handleSupport(ctx) {
  await ctx.reply(
    `📞 *Support*\n\nProvide your Order ID and TX hash when contacting admin.\n\nContact: @YourAdminUsername`,
    { parse_mode: 'Markdown' }
  );
}

async function handleCancel(ctx) {
  delete userState[ctx.from.id];
  await ctx.reply('❌ Order cancelled. Use 🛒 Browse Products to start again.');
}

module.exports = {
  handleStart,
  handleBrowse,
  handleBuyCallback,
  handleConfirmPayment,
  handleMyOrders,
  handleGetCID,
  handleCheckKey,
  handleHelp,
  handleSupport,
  handleCancel,
};
