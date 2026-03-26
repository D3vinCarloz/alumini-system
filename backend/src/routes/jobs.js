const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/jobs — all job postings (any logged-in user)
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT j.Job_ID, j.Job_Title, j.Company_Name, j.Description, j.Posting_Date,
             u.Name AS postedByName, j.Alumni_ID
      FROM   JOB_POSTINGS j
      JOIN   ALUMNI a ON a.Alumni_ID = j.Alumni_ID
      JOIN   USER   u ON u.User_ID   = a.User_ID
      ORDER  BY j.Posting_Date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/jobs — alumni posts a job
router.post('/', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const { jobTitle, companyName, description } = req.body;

    await db.query(
      'INSERT INTO JOB_POSTINGS (Alumni_ID, Job_Title, Company_Name, Description) VALUES (?,?,?,?)',
      [req.user.subId, jobTitle, companyName, description]
    );
    res.status(201).json({ message: 'Job posted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/jobs/:jobId — alumni deletes own job
router.delete('/:jobId', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    await db.query(
      'DELETE FROM JOB_POSTINGS WHERE Job_ID = ? AND Alumni_ID = ?',
      [req.params.jobId, req.user.subId]
    );
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;