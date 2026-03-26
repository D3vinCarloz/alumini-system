// Make sure auth.js has these at the top:
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');  // ← make sure this line exists

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // 1. Find user in USER table
    const [rows] = await db.query(
      'SELECT * FROM USER WHERE Email = ?', [email]
    );
    const user = rows[0];

    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    // 2. Compare password
    const valid = await bcrypt.compare(password, user.Password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid credentials' });

    // 3. Fetch sub-table ID (Student_ID or Alumni_ID)
    let subId = null;
    if (user.Role === 'student') {
      const [[s]] = await db.query(
        'SELECT Student_ID FROM STUDENT WHERE User_ID = ?', [user.User_ID]
      );
      subId = s?.Student_ID ?? null;
    } else if (user.Role === 'alumni') {
      const [[a]] = await db.query(
        'SELECT Alumni_ID FROM ALUMNI WHERE User_ID = ?', [user.User_ID]
      );
      subId = a?.Alumni_ID ?? null;
    }

    // 4. Sign JWT — carries both User_ID and subId
    const token = jwt.sign(
      {
        id:    user.User_ID,
        subId: subId,
        name:  user.Name,
        email: user.Email,
        role:  user.Role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Return user (no password) + token
    res.json({
      token,
      user: {
        id:    user.User_ID,
        subId: subId,
        name:  user.Name,
        email: user.Email,
        role:  user.Role,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNo, department, graduationYear, batch } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    if (!['student', 'alumni'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or alumni' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT User_ID FROM USER WHERE Email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO USER (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
    const userId = result.insertId;

    // Insert sub-table record
    if (role === 'student') {
      await db.query(
        'INSERT INTO STUDENT (User_ID, Roll_No, Department) VALUES (?, ?, ?)',
        [userId, rollNo || '', department || '']
      );
    } else if (role === 'alumni') {
      await db.query(
        `INSERT INTO ALUMNI (User_ID, Department, Graduation_Year, Batch, Contact_Info, Bio, Verification_Status, Status)
         VALUES (?, ?, ?, ?, '', '', FALSE, 'pending')`,
        [userId, department || '', graduationYear || null, batch || '']
      );
    }

    res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;