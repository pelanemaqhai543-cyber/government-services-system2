const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function checkPasswords() {
  try {
    const [users] = await db.query(`
      SELECT id, role, password
      FROM users
      WHERE id BETWEEN 12 AND 18
      ORDER BY id
    `);

    for (const user of users) {
      const matches = await bcrypt.compare(
        'password123',
        user.password
      );

      console.log(
        `ID: ${user.id} | Role: ${user.role} | Password matches: ${matches}`
      );
    }
  } catch (error) {
    console.error('Password check failed:', error.message);
  } finally {
    await db.end();
  }
}

checkPasswords();