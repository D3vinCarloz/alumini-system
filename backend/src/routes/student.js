const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/student/profile (For the logged-in student)
router.get('/profile', authenticate, requireRole('student'), async (req, res) => {
  try {
    const [[student]] = await db.query(`
      SELECT u.User_ID, u.Name, u.Email, u.Profile_Pic, u.DOB, u.Gender, u.LinkedIn,
             s.Student_ID, s.Roll_No, s.Department, s.Start_Year, s.End_Year
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

// PUT /api/student/profile (For the logged-in student to edit their profile)
router.put('/profile', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { name, rollNo, department, dob, gender, linkedin, startYear, endYear } = req.body;

    await db.query(
      'UPDATE USER SET Name = ?, DOB = ?, Gender = ?, LinkedIn = ? WHERE User_ID = ?', 
      [name, dob || null, gender || null, linkedin || null, req.user.id]
    );
    
    await db.query(
      'UPDATE STUDENT SET Roll_No = ?, Department = ?, Start_Year = ?, End_Year = ? WHERE User_ID = ?',
      [rollNo, department, startYear || null, endYear || null, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 👇 NEW: GET /api/student/:id (For Alumni/Admins viewing a student's profile)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [[student]] = await db.query(`
      SELECT u.User_ID, u.Name, u.Email, u.Profile_Pic, u.DOB, u.Gender, u.LinkedIn,
             s.Student_ID, s.Roll_No, s.Department, s.Start_Year, s.End_Year
      FROM   USER u
      JOIN   STUDENT s ON s.User_ID = u.User_ID
      WHERE  s.Student_ID = ?
    `, [req.params.id]);

    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;