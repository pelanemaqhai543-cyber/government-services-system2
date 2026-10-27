const mysql = require('mysql2');
require('dotenv').config();

const isCloudDB =
  !!process.env.DB_HOST &&
  (process.env.DB_HOST.includes('rlwy') ||
    process.env.DB_HOST.includes('railway') ||
    process.env.DB_HOST.includes('planetscale') ||
    process.env.DB_HOST.includes('aiven') ||
    process.env.DB_HOST.includes('clever-cloud') ||
    process.env.NODE_ENV === 'production');

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (isCloudDB) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

promisePool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL connected successfully');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   SSL: ${isCloudDB ? 'enabled' : 'disabled'}`);
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL connection error:', err.message);
    console.error('   Host:', process.env.DB_HOST);
    console.error('   Port:', process.env.DB_PORT || 3306);
    console.error('   Database:', process.env.DB_NAME);
  });

const db = {
  query: async (sql, params) => {
    const [rows] = await promisePool.query(sql, params);
    return [rows];
  },
  execute: async (sql, params) => {
    const [rows] = await promisePool.execute(sql, params);
    return [rows];
  },
  getConnection: () => promisePool.getConnection(),
};

module.exports = db;
