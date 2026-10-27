const bcrypt = require('bcryptjs');
const db = require('./config/db');

const NEW_PASSWORD = 'password123';   // choose your own, 8+ characters
const NATIONAL_ID = '6000000000099';

(async () => {
  // 1. Show which roles the column currently allows
  const [[col]] = await db.query("SHOW COLUMNS FROM users LIKE 'role'");
  console.log('role column type:', col.Type);

  // 2. If it is an ENUM missing 'admin', add it (keeps every existing value)
  if (/^enum/i.test(col.Type) && !/'admin'/i.test(col.Type)) {
    const newType = col.Type.replace(/\)$/, ",'admin')");
    await db.query(`ALTER TABLE users MODIFY COLUMN role ${newType} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    console.log("Added 'admin' to the role list.");
  }

  // 3. Create or update the admin
  const hash = await bcrypt.hash(NEW_PASSWORD, 10);
  const [upd] = await db.query(
    "UPDATE users SET password = ?, status = 'active', role = 'admin' WHERE national_id = ?",
    [hash, NATIONAL_ID]
  );

  if (upd.affectedRows === 0) {
    await db.query(
      "INSERT INTO users (national_id, password, full_name, role, status) VALUES (?, ?, 'System Admin', 'admin', 'active')",
      [NATIONAL_ID, hash]
    );
    console.log('Admin created.');
  } else {
    console.log('Admin password updated.');
  }

  const [roles] = await db.query('SELECT role, COUNT(*) AS n FROM users GROUP BY role');
  console.log('Users by role:', roles);
  process.exit(0);
})().catch(e => { console.error('Failed:', e.message); process.exit(1); });