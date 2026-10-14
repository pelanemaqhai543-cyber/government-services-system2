const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
  try {
    console.log('🌱 Seeding database...\n');

    const hash = await bcrypt.hash('password123', 10);
    console.log('🔐 Password hash created');
    console.log('   Length:', hash.length, '(should be 60)\n');

    // ⚠️ All National IDs are exactly 13 digits
    const users = [
      ['6000000000001', 'Robert Fox',        'home_affairs'],
      ['6000000000002', 'Traffic Officer',   'traffic'],
      ['6000000000003', 'Finance Officer',   'finance'],
      ['6000000000004', 'Pension Officer',   'pension'],
      ['6000000000005', 'Police Officer',    'police'],
      ['6000000000006', 'Passport Officer',  'passport'],
      ['6010123400000', 'Mpho Thabane',      'citizen'],
    ];

    for (const [nid, name, role] of users) {
      try {
        const [existing] = await db.query(
          'SELECT id FROM users WHERE national_id = ?',
          [nid]
        );

        if (existing.length > 0) {
          await db.query(
            'UPDATE users SET password = ?, full_name = ?, role = ? WHERE national_id = ?',
            [hash, name, role, nid]
          );
          console.log(`♻️  Updated: ${name.padEnd(20)} (${role.padEnd(15)}) → ${nid}`);
        } else {
          const [r] = await db.query(
            'INSERT INTO users (national_id, password, full_name, role, is_verified) VALUES (?, ?, ?, ?, TRUE)',
            [nid, hash, name, role]
          );

          if (role === 'citizen') {
            await db.query(
              "INSERT INTO citizen_profiles (user_id, verification_status, verified_at) VALUES (?, 'auto_verified', NOW())",
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
    console.log('  Home Affairs Admin  →  6000000000001');
    console.log('  Traffic Officer     →  6000000000002');
    console.log('  Finance Officer     →  6000000000003');
    console.log('  Pension Officer     →  6000000000004');
    console.log('  Police Officer      →  6000000000005');
    console.log('  Passport Officer    →  6000000000006');
    console.log('  Citizen             →  6010123400000');
    console.log('─────────────────────────────────────────────');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message);
    process.exit(1);
  }
})();