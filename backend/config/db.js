
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

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 15000,

  // Aiven requires encrypted database connections.
  ssl: {
    rejectUnauthorized: false
  }
};

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

// Verify the connection without stopping the application
// before the database is available.
promisePool.getConnection()
  .then(connection => {
    console.log('✅ MySQL connected successfully.');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log('   SSL: enabled');

    connection.release();
  })
  .catch(error => {
    console.error('❌ MySQL connection error:', error.message);
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

  end: () => promisePool.end()
};

module.exports = db;
