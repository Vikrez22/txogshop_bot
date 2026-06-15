module.exports = {
  apps: [
    {
      name: 'telegram-shop-bot',
      script: 'src/bot/bot.js',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
