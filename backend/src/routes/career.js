const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/career — get own career history
router.get('/', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM CAREER_HISTORY WHERE Alumni_ID = ? ORDER BY Start_Year ASC',
      [req.user.subId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/career — add a career entry
router.post('/', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const { companyName, jobRole, startYear, endYear } = req.body;

    // Basic validation
    if (!companyName || !jobRole || !startYear) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [result] = await db.query(
      'INSERT INTO CAREER_HISTORY (Alumni_ID, Company_Name, Job_Role, Start_Year, End_Year) VALUES (?,?,?,?,?)',
      [req.user.subId, companyName, jobRole, startYear, endYear ?? null]
    );
    
    res.status(201).json({ message: 'Career entry added', careerId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/career/:careerId — update a career entry
router.put('/:careerId', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const { companyName, jobRole, startYear, endYear } = req.body;

    const [result] = await db.query(
      `UPDATE CAREER_HISTORY
       SET Company_Name = ?, Job_Role = ?, Start_Year = ?, End_Year = ?
       WHERE Career_ID = ? AND Alumni_ID = ?`,
      [companyName, jobRole, startYear, endYear ?? null, req.params.careerId, req.user.subId]
    );

    // 👈 SAFETY CHECK: Ensure the record was actually found and owned by this alumni
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Career entry not found or access denied' });
    }

    res.json({ message: 'Career entry updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/career/:careerId — delete own entry
router.delete('/:careerId', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM CAREER_HISTORY WHERE Career_ID = ? AND Alumni_ID = ?',
      [req.params.careerId, req.user.subId]
    );

    // 👈 SAFETY CHECK: Ensure the record was actually found and owned by this alumni
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Career entry not found or access denied' });
    }

    res.json({ message: 'Career entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;