const { pool } = require('../db/db');

async function getAllProducts() {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE stock > 0 ORDER BY category, name'
  );
  return rows;
}

async function getProductById(id) {
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createOrder(telegramId, productId, quantity, totalPrice) {
  const [result] = await pool.execute(
    'INSERT INTO orders (telegram_id, product_id, quantity, total_price, status) VALUES (?, ?, ?, ?, "pending")',
    [telegramId, productId, quantity, totalPrice]
  );
  return result.insertId;
}

async function getOrderById(orderId) {
  const [rows] = await pool.execute(
    `SELECT o.*, p.name as product_name FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.id = ?`,
    [orderId]
  );
  return rows[0] || null;
}

async function getUserOrders(telegramId) {
  const [rows] = await pool.execute(
    `SELECT o.*, p.name as product_name FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.telegram_id = ?
     ORDER BY o.created_at DESC LIMIT 10`,
    [telegramId]
  );
  return rows;
}

async function markOrderPaid(orderId, txHash) {
  await pool.execute(
    'UPDATE orders SET status = "paid", tron_tx_hash = ? WHERE id = ?',
    [txHash, orderId]
  );
}

async function deliverKey(orderId) {
  // Pull an unsold key for this product
  const order = await getOrderById(orderId);
  if (!order) return null;

  const [keys] = await pool.execute(
    'SELECT * FROM keys_stock WHERE product_id = ? AND is_sold = FALSE LIMIT 1',
    [order.product_id]
  );

  if (!keys.length) return null;

  const key = keys[0];
  await pool.execute(
    'UPDATE keys_stock SET is_sold = TRUE, order_id = ? WHERE id = ?',
    [orderId, key.id]
  );
  await pool.execute(
    'UPDATE orders SET status = "delivered" WHERE id = ?',
    [orderId]
  );
  // Decrement stock
  await pool.execute(
    'UPDATE products SET stock = stock - 1 WHERE id = ?',
    [order.product_id]
  );

  return key.license_key;
}

async function addKeyToStock(productId, licenseKey) {
  await pool.execute(
    'INSERT INTO keys_stock (product_id, license_key) VALUES (?, ?)',
    [productId, licenseKey]
  );
}

module.exports = {
  getAllProducts,
  getProductById,
  createOrder,
  getOrderById,
  getUserOrders,
  markOrderPaid,
  deliverKey,
  addKeyToStock,
};
