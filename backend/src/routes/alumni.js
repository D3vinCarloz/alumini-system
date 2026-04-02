const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/alumni — all alumni (students browse this)
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.Alumni_ID, u.User_ID, u.Name, u.Email, u.Profile_Pic, u.LinkedIn,
             a.Department, a.Graduation_Year, a.Batch,
             a.Contact_Info, a.Bio, a.Verification_Status
      FROM   alumni a
      JOIN   user u ON u.User_ID = a.User_ID
      ORDER  BY u.Name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/alumni/my-profile — alumni gets own profile
router.get('/my-profile', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const [[alumni]] = await db.query(`
      SELECT u.User_ID, u.Name, u.Email, u.Profile_Pic, u.DOB, u.Gender, u.LinkedIn,
             a.Alumni_ID, a.Department, a.Graduation_Year,
             a.Batch, a.Contact_Info, a.Bio, 
             a.Verification_Status, a.Status
      FROM   user u
      JOIN   alumni a ON a.User_ID = u.User_ID
      WHERE  u.User_ID = ?
    `, [req.user.id]);

    if (!alumni) return res.status(404).json({ message: 'Alumni profile not found' });
    res.json(alumni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/alumni/my-profile — alumni updates own profile
router.put('/my-profile', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const { name, department, graduationYear, batch, contactInfo, bio, dob, gender, linkedin } = req.body;

    await db.query(
      'UPDATE user SET Name = ?, DOB = ?, Gender = ?, LinkedIn = ? WHERE User_ID = ?',
      [name, dob || null, gender || null, linkedin || null, req.user.id]
    );

    await db.query(`
      UPDATE alumni
      SET Department = ?, Graduation_Year = ?, Batch = ?,
          Contact_Info = ?, Bio = ?
      WHERE User_ID = ?
    `, [department, graduationYear || null, batch, contactInfo, bio, req.user.id]);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/alumni/:alumniId — single alumni with career + jobs
router.get('/:alumniId', authenticate, async (req, res) => {
  try {
    const [[alumni]] = await db.query(`
      SELECT a.Alumni_ID, u.User_ID, u.Name, u.Email, u.Profile_Pic, u.LinkedIn,
             a.Department, a.Graduation_Year, a.Batch,
             a.Contact_Info, a.Bio, a.Verification_Status
      FROM   alumni a
      JOIN   user u ON u.User_ID = a.User_ID
      WHERE  a.Alumni_ID = ?
    `, [req.params.alumniId]);

    if (!alumni) return res.status(404).json({ message: 'Alumni not found' });

    const [career] = await db.query(
      'SELECT * FROM CAREER_HISTORY WHERE Alumni_ID = ? ORDER BY Start_Year DESC',
      [req.params.alumniId]
    );
    const [jobs] = await db.query(
      'SELECT * FROM job_postings WHERE Alumni_ID = ? ORDER BY Posting_Date DESC',
      [req.params.alumniId]
    );

    res.json({ ...alumni, careerHistory: career, jobPostings: jobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/alumni/:alumniId/verify — admin verifies
router.patch('/:alumniId/verify', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await db.query(
      "UPDATE alumni SET Verification_Status = TRUE, Status = 'verified' WHERE Alumni_ID = ?",
      [req.params.alumniId]
    );
    res.json({ message: 'Alumni verified' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/alumni/:alumniId/reject — admin rejects
router.patch('/:alumniId/reject', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await db.query(
      "UPDATE alumni SET Verification_Status = FALSE, Status = 'rejected' WHERE Alumni_ID = ?",
      [req.params.alumniId]
    );
    res.json({ message: 'Alumni rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/alumni/profile — alumni updates own bio/contact
router.put('/profile', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const { bio, contactInfo, batch } = req.body;
    await db.query(
      'UPDATE alumni SET Bio = ?, Contact_Info = ?, Batch = ? WHERE Alumni_ID = ?',
      [bio, contactInfo, batch, req.user.subId]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
