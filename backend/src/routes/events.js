const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/events — all events, upcoming first
router.get('/', authenticate, async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.Event_ID, e.Title, e.Description, e.Event_Date,
             e.Event_Time, e.Mode, e.Type, e.created_at,
             u.Name AS createdByName, u.Role AS createdByRole
      FROM   EVENTS e
      JOIN   USER u ON u.User_ID = e.Created_By
      ORDER  BY e.Event_Date ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events — alumni or admin creates event
router.post('/', authenticate, requireRole('alumni', 'admin'), async (req, res) => {
  try {
    const { title, description, eventDate, eventTime, mode, type } = req.body;

    if (!title || !eventDate) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    await db.query(
      `INSERT INTO EVENTS (Title, Description, Event_Date, Event_Time, Mode, Type, Created_By)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, eventDate, eventTime, mode, type, req.user.id]
    );
    res.status(201).json({ message: 'Event created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:eventId — creator or admin deletes event
router.delete('/:eventId', authenticate, requireRole('alumni', 'admin'), async (req, res) => {
  try {
    await db.query(
      'DELETE FROM EVENTS WHERE Event_ID = ? AND (Created_By = ? OR ? = "admin")',
      [req.params.eventId, req.user.id, req.user.role]
    );
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;