const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const guard = [authenticate, requireRole('admin')];

// GET /api/admin/stats
router.get('/stats', ...guard, async (_req, res) => {
  try {
    const [[{ totalUsers }]]           = await db.query('SELECT COUNT(*) AS totalUsers FROM user');
    const [[{ totalQueries }]]         = await db.query('SELECT COUNT(*) AS totalQueries FROM query');
    const [[{ pendingVerifications }]] = await db.query(
      "SELECT COUNT(*) AS pendingVerifications FROM alumni WHERE Verification_Status = FALSE"
    );
    res.json({ totalUsers, totalQueries, pendingVerifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', ...guard, async (_req, res) => {
  try {
    const [rows] = await db.query(
      // 👈 ADDED Profile_Pic
      'SELECT User_ID, Name, Email, Role, Profile_Pic, created_at FROM user ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/queries
router.get('/queries', ...guard, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT q.Query_ID, q.Status, q.Query_Date, q.Content,
             s_user.Name AS studentName, s_user.Profile_Pic AS studentProfilePic, /* 👈 ADDED */
             a_user.Name AS alumniName, a_user.Profile_Pic AS alumniProfilePic /* 👈 ADDED */
      FROM   query q
      JOIN   student st  ON st.Student_ID = q.Student_ID
      JOIN   user s_user ON s_user.User_ID = st.User_ID
      JOIN   alumni al   ON al.Alumni_ID   = q.Alumni_ID
      JOIN   user a_user ON a_user.User_ID = al.User_ID
      ORDER  BY q.Query_Date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/alumni
router.get('/alumni', ...guard, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.Alumni_ID, u.Name, u.Email, u.Profile_Pic, /* 👈 ADDED (Fixes Verify Alumni page!) */
             a.Department, a.Graduation_Year, a.Batch,
             a.Bio, a.Contact_Info,
             a.Verification_Status, a.Status
      FROM   alumni a
      JOIN   user u ON u.User_ID = a.User_ID
      ORDER  BY
        CASE a.Status
          WHEN 'pending'  THEN 1
          WHEN 'rejected' THEN 2
          WHEN 'verified' THEN 3
        END,
        u.Name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', ...guard, async (_req, res) => {
  try {
    // Department-wise alumni count
    const [byDepartment] = await db.query(`
      SELECT Department,
             COUNT(*) AS count,
             SUM(CASE WHEN Verification_Status = TRUE THEN 1 ELSE 0 END) AS verified
      FROM   alumni
      WHERE  Department IS NOT NULL AND Department != ''
      GROUP  BY Department
      ORDER  BY count DESC
    `);

    // Batch-wise alumni count
    const [byBatch] = await db.query(`
      SELECT Batch, COUNT(*) AS count
      FROM   alumni
      WHERE  Batch IS NOT NULL AND Batch != ''
      GROUP  BY Batch
      ORDER  BY Batch DESC
    `);

    // Query stats
    const [[queryStats]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN Status = 'pending'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN Status = 'answered' THEN 1 ELSE 0 END) AS answered
      FROM query
    `);

    res.json({ byDepartment, byBatch, queryStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/user-detail/student/:userId
router.get('/user-detail/student/:userId', ...guard, async (req, res) => {
  try {
    const [[data]] = await db.query(
      'SELECT Student_ID, Roll_No, Department FROM student WHERE User_ID = ?',
      [req.params.userId]
    );
    res.json(data || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/user-detail/alumni/:userId
router.get('/user-detail/alumni/:userId', ...guard, async (req, res) => {
  try {
    const [[data]] = await db.query(
      `SELECT Alumni_ID, Department, Graduation_Year, Batch,
              Contact_Info, Bio, Verification_Status, Status
       FROM   alumni WHERE User_ID = ?`,
      [req.params.userId]
    );
    res.json(data || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
