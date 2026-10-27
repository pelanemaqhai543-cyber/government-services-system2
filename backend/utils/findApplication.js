
const db = require('../config/db');

function query(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

async function findApplication(identifier) {
  const value = String(identifier ?? '').trim();

  if (!value) return null;

  let rows = await query(
    `SELECT * FROM service_requests
     WHERE reference_number = ?
     LIMIT 1`,
    [value]
  );

  if (rows.length) return rows[0];

  if (/^\d+$/.test(value)) {
    rows = await query(
      `SELECT * FROM service_requests
       WHERE id = ?
       LIMIT 1`,
      [Number(value)]
    );

    if (rows.length) return rows[0];
  }

  return null;
}

module.exports = findApplication;
