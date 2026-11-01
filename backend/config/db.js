
const mysql = require('mysql2');
require('dotenv').config();

const requiredVariables = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing database environment variable: ${variable}`);
  }
}

const poolConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 50,

  // Connection timeout
  connectTimeout: 30000,

  // Aiven SSL
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

// Test database connection without crashing the server
async function checkDatabaseConnection() {
  let connection;

  try {
    connection = await promisePool.getConnection();

    console.log('✅ MySQL connected successfully.');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log('   SSL: enabled');

  } catch (error) {
    console.error('❌ MySQL connection error:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

checkDatabaseConnection();

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

  end: () => promisePool.end()
};

module.exports = db;
