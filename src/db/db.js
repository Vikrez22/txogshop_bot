const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,  
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS keys_stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        license_key TEXT NOT NULL,
        is_sold BOOLEAN DEFAULT FALSE,
        order_id INT,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        telegram_id BIGINT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending','paid','delivered','cancelled') DEFAULT 'pending',
        tron_tx_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Seed sample products if empty
    const [rows] = await conn.execute('SELECT COUNT(*) as cnt FROM products');
    if (rows[0].cnt === 0) {
      await conn.execute(`
        INSERT INTO products (name, description, price, stock, category) VALUES
        ('Windows 11 Pro Key', 'Genuine Windows 11 Professional activation key', 15.00, 50, 'Windows'),
        ('Office 2021 Home & Student', 'Microsoft Office 2021 Home & Student key', 25.00, 30, 'Office'),
        ('Office 365 Personal (1yr)', 'Microsoft 365 Personal 1-year subscription key', 35.00, 20, 'Office 365'),
        ('Windows 10 Pro Key', 'Genuine Windows 10 Professional activation key', 10.00, 100, 'Windows')
      `);
    }

    console.log('✅ Database initialized');
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDB };
