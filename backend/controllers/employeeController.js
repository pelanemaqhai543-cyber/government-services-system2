const db = require('../config/db');

const normalizeValue = (value) => {
  return String(value ?? '').trim();
};

const ALLOWED_CITIZEN_FIELDS = new Set([
  'date_of_birth',
  'gender',
  'address',
  'district',
  'verification_status',
]);

exports.searchCitizen = async (req, res) => {
  const nationalId = normalizeValue(req.query.national_id);
  const department = normalizeValue(req.user?.role).toLowerCase();

  if (!nationalId) {
    return res.status(400).json({
      message: 'National ID required',
    });
  }

  if (!department) {
    return res.status(403).json({
      message: 'Employee department is missing',
    });
  }

  try {
    const [citizenRows] = await db.query(
      `
        SELECT
          u.id,
          u.national_id,
          u.full_name,
          cp.date_of_birth,
          cp.gender,
          cp.address,
          cp.district,
          cp.verification_status
        FROM users u
        INNER JOIN citizen_profiles cp
          ON cp.user_id = u.id
        WHERE u.national_id = ?
          AND u.role = 'citizen'
          AND cp.verification_status = 'verified'
        LIMIT 1
      `,
      [nationalId]
    );

    if (citizenRows.length === 0) {
      return res.status(404).json({
        message: 'Verified citizen not found',
      });
    }

    const citizen = citizenRows[0];

    const [accessRows] = await db.query(
      `
        SELECT can_access_field
        FROM access_control
        WHERE department = ?
      `,
      [department]
    );

    const allowedFields = new Set(
      accessRows
        .map((row) => normalizeValue(row.can_access_field))
        .filter((field) => ALLOWED_CITIZEN_FIELDS.has(field))
    );

    const filteredCitizen = {
      national_id: citizen.national_id,
      full_name: citizen.full_name,
    };

    for (const field of allowedFields) {
      if (
        citizen[field] !== null &&
        citizen[field] !== undefined
      ) {
        filteredCitizen[field] = citizen[field];
      }
    }

    return res.status(200).json(filteredCitizen);
  } catch (error) {
    console.error('searchCitizen error:', error);

    return res.status(500).json({
      message: 'Error searching citizen',
    });
  }
};
