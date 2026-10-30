const mysql = require('mysql2');
require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

const missingEnv = requiredEnv.filter(
  (key) => process.env[key] === undefined
);

if (missingEnv.length > 0) {
  throw new Error(
    `Missing database environment variables: ${missingEnv.join(', ')}`
  );
}

const isCloudDB =
  process.env.DB_HOST.includes('rlwy') ||
  process.env.DB_HOST.includes('railway') ||
  process.env.DB_HOST.includes('planetscale') ||
  process.env.DB_HOST.includes('aiven') ||
  process.env.DB_HOST.includes('clever-cloud') ||
  process.env.NODE_ENV === 'production';

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // 👇 THIS IS THE FIX: Forces the connection to stay open
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000 
};

if (isCloudDB) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

// Test connection on startup
promisePool.getConnection()
  .then((connection) => {
    console.log('MySQL connected successfully');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT || 3306}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`SSL: ${isCloudDB ? 'enabled' : 'disabled'}`);
    connection.release();
  })
  .catch((error) => {
    console.error('MySQL connection error:', error.message);
  });

const db = {
  query: async (sql, params = []) => {
    const [rows] = await promisePool.query(sql, params);
    return [rows];
  },

  execute: async (sql, params = []) => {
    const [rows] = await promisePool.execute(sql, params);
    return [rows];
  },

  getConnection: () => promisePool.getConnection(),

  close: () => promisePool.end(),
};

module.exports = db;