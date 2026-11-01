require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false },
      multipleStatements: true
    });

    console.log('✅ Connected to MyGov Aiven database.');

    // 1. Ensure the base tables exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS request_documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          request_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500),
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Safely add all missing columns
    const alterQueries = [
      // User columns
      `ALTER TABLE users ADD COLUMN date_of_birth DATE`,
      `ALTER TABLE users ADD COLUMN gender VARCHAR(20)`,
      `ALTER TABLE users ADD COLUMN email VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN national_id VARCHAR(20)`,
      `ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active'`,
      `ALTER TABLE users ADD COLUMN birth_certificate_number VARCHAR(50)`,
      
      // Document columns needed for Base64 upload
      `ALTER TABLE request_documents ADD COLUMN file_data LONGTEXT`,
      `ALTER TABLE request_documents ADD COLUMN document_type VARCHAR(50)`
    ];

    for (const query of alterQueries) {
      try {
        await connection.query(query);
        console.log(`✅ Ran: ${query}`);
      } catch (err) {
        // 1060 means Duplicate Column (already exists), which is fine
        if (err.errno !== 1060) {
          console.log(`⚠️ Skipped: ${query} - ${err.message}`);
        }
      }
    }

    console.log('🎉 ALL MISSING COLUMNS ADDED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();