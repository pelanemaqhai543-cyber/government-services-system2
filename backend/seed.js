const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
  try {
    console.log('🌱 Updating passwords for demo accounts...\n');

    const hash = await bcrypt.hash('password123', 10);
    console.log('🔐 New hash:', hash);
    console.log('   Length:', hash.length, '(should be 60)\n');

    const users = [
      ['60000001', 'home_affairs'],
      ['60000002', 'traffic'],
      ['60000003', 'finance'],
      ['60000004', 'pension'],
      ['60000005', 'police'],
      ['60000006', 'passport'],
      ['60101234', 'citizen'],
    ];

    for (const [nid] of users) {
      const [result] = await db.query(
        'UPDATE users SET password = ? WHERE national_id = ?',
        [hash, nid]
      );
      console.log(`♻️  Updated: ${nid} (${result.affectedRows} row affected)`);
    }

    console.log('\n🎉 Done! All accounts now use password: password123');
    console.log('   Verify with:');
    console.log("   SELECT national_id, LENGTH(password) FROM users WHERE national_id='60000001';");

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed:', err.message);
    process.exit(1);
  }
})();