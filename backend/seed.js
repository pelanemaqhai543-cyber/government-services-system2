const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
  try {
    console.log('🌱 Seeding database...\n');

    const hash = await bcrypt.hash('password123', 10);
    console.log('🔐 Password hash created');
    console.log('   Length:', hash.length, '(should be 60)\n');

    const users = [
      ['60000001', 'Robert Fox',        'home_affairs'],
      ['60000002', 'Traffic Officer',   'traffic'],
      ['60000003', 'Finance Officer',   'finance'],
      ['60000004', 'Pension Officer',   'pension'],
      ['60000005', 'Police Officer',    'police'],
      ['60000006', 'Passport Officer',  'passport'],
      ['60101234', 'Mpho Thabane',      'citizen'],
    ];

    for (const [nid, name, role] of users) {
      try {
        // Check if user exists
        const [existing] = await db.query(
          'SELECT id FROM users WHERE national_id = ?',
          [nid]
        );

        if (existing.length > 0) {
          // User exists — update password + details
          await db.query(
            'UPDATE users SET password = ?, full_name = ?, role = ? WHERE national_id = ?',
            [hash, name, role, nid]
          );
          console.log(`♻️  Updated: ${name.padEnd(20)} (${role.padEnd(15)}) → ${nid}`);
        } else {
          // User doesn't exist — create it
          const [r] = await db.query(
            'INSERT INTO users (national_id, password, full_name, role) VALUES (?, ?, ?, ?)',
            [nid, hash, name, role]
          );

          if (role === 'citizen') {
            // Also create the citizen profile
            await db.query(
              "INSERT INTO citizen_profiles (user_id, verification_status) VALUES (?, 'verified')",
              [r.insertId]
            );
          }
          console.log(`✅ Created: ${name.padEnd(20)} (${role.padEnd(15)}) → ${nid}`);
        }
      } catch (e) {
        console.log(`❌ Failed: ${name} → ${e.message}`);
      }
    }

    console.log('\n🎉 Seeding complete!\n');
    console.log('📋 Login credentials (password: password123)');
    console.log('─────────────────────────────────────────────');
    console.log('  Home Affairs Admin  →  60000001');
    console.log('  Traffic Officer     →  60000002');
    console.log('  Finance Officer     →  60000003');
    console.log('  Pension Officer     →  60000004');
    console.log('  Police Officer      →  60000005');
    console.log('  Passport Officer    →  60000006');
    console.log('  Citizen             →  60101234');
    console.log('─────────────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
})();