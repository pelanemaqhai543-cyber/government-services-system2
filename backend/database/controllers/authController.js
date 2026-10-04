exports.login = async (req, res) => {
  const { national_id, password } = req.body;

  console.log('\n═══════════════════════════════════════');
  console.log('🔐 LOGIN ATTEMPT');
  console.log('   national_id:', national_id);
  console.log('   password length:', password?.length);
  console.log('   DB_NAME:', process.env.DB_NAME);
  console.log('   DB_HOST:', process.env.DB_HOST);

  if (!national_id || !password) {
    return res.status(400).json({ message: 'National ID and password required' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE national_id = ?', [national_id]);
    console.log('   Rows found:', rows.length);

    if (rows.length === 0) {
      const [all] = await db.query('SELECT national_id, role FROM users LIMIT 20');
      console.log('   All users in DB:', JSON.stringify(all, null, 2));
      console.log('═══════════════════════════════════════\n');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('   User found:', user.full_name, '| role:', user.role);
    console.log('   Hash preview:', user.password?.slice(0, 15));
    console.log('   Hash length:', user.password?.length);

    const match = await bcrypt.compare(password, user.password);
    console.log('   bcrypt match:', match);
    console.log('═══════════════════════════════════════\n');

    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, national_id: user.national_id, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        national_id: user.national_id,
        full_name: user.full_name,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error('   ❌ Login error:', err);
    console.log('═══════════════════════════════════════\n');
    res.status(500).json({ message: 'Server error during login' });
  }
};