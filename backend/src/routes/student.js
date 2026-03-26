const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/student/profile
router.get('/profile', authenticate, requireRole('student'), async (req, res) => {
  try {
    const [[student]] = await db.query(`
      SELECT u.User_ID, u.Name, u.Email,
             s.Student_ID, s.Roll_No, s.Department
      FROM   USER u
      JOIN   STUDENT s ON s.User_ID = u.User_ID
      WHERE  u.User_ID = ?
    `, [req.user.id]);

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/student/profile
router.put('/profile', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { name, rollNo, department } = req.body;

    await db.query('UPDATE USER SET Name = ? WHERE User_ID = ?', [name, req.user.id]);
    await db.query(
      'UPDATE STUDENT SET Roll_No = ?, Department = ? WHERE User_ID = ?',
      [rollNo, department, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;