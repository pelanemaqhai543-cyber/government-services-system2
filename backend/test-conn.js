const mysql = require('mysql2/promise');

(async () => {
  console.log('Connecting to reseau.proxy.rlwy.net:48199 ...');
  const start = Date.now();
  try {
    const conn = await mysql.createConnection({
      host: 'reseau.proxy.rlwy.net',
      port: 48199,
      user: 'root',
      password: 'ODpXpFpviaXIBQxTIzZylXWOzyjwPILS',
      database: 'gov_services',
      ssl: { rejectUnauthorized: false },
      connectTimeout: 15000,
    });
    const [rows] = await conn.query('SELECT 1 AS ok');
    console.log('✅ Connected in', Date.now() - start, 'ms');
    console.log('Result:', rows);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed after', Date.now() - start, 'ms');
    console.error('Code:', err.code);
    console.error('Errno:', err.errno);
    console.error('Message:', err.message);
    process.exit(1);
  }
})();
