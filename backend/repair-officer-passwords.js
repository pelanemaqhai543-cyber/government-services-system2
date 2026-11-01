const bcrypt = require('bcryptjs');
const db = require('./config/db');

const TEMPORARY_PASSWORD = 'password123';

const officers = [
  { id: 12, role: 'home_affairs' },
  { id: 13, role: 'traffic' },
  { id: 14, role: 'finance' },
  { id: 15, role: 'pension' },
  { id: 16, role: 'police' },
  { id: 17, role: 'passport' }
];

async function repairOfficerPasswords() {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Generate one bcrypt hash for the shared temporary password.
    const newHash = await bcrypt.hash(TEMPORARY_PASSWORD, 10);

    if (newHash.length !== 60) {
      throw new Error('Generated bcrypt hash has an unexpected length.');
    }

    for (const officer of officers) {
      const [rows] = await connection.query(
        'SELECT id, role FROM users WHERE id = ? FOR UPDATE',
        [officer.id]
      );

      if (
        rows.length !== 1 ||
        rows[0].role !== officer.role
      ) {
        throw new Error(
          `Account verification failed for ID ${officer.id}. No changes committed.`
        );
      }

      await connection.query(
        'UPDATE users SET password = ? WHERE id = ? AND role = ?',
        [newHash, officer.id, officer.role]
      );

      console.log(`Prepared password repair for ${officer.role}`);
    }

    await connection.commit();

    console.log('\nOfficer password repair completed successfully.');

    // Verify all six passwords.
    const [updatedUsers] = await db.query(
      `SELECT id, role, password
       FROM users
       WHERE id BETWEEN 12 AND 17
       ORDER BY id`
    );

    for (const user of updatedUsers) {
      const matches = await bcrypt.compare(
        TEMPORARY_PASSWORD,
        user.password
      );

      console.log(
        `${user.role}: ${matches ? 'PASSWORD OK' : 'VERIFICATION FAILED'}`
      );
    }

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Repair failed:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }

    await db.end();
  }
}

repairOfficerPasswords();