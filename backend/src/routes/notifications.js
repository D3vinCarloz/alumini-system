const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — get all notifications for logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM NOTIFICATIONS
      WHERE  User_ID = ?
      ORDER  BY created_at DESC
      LIMIT  50
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM NOTIFICATIONS WHERE User_ID = ? AND Is_Read = FALSE',
      [req.user.id]
    );
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE NOTIFICATIONS SET Is_Read = TRUE WHERE Notification_ID = ? AND User_ID = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE NOTIFICATIONS SET Is_Read = TRUE WHERE User_ID = ?',
      [req.user.id]
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM NOTIFICATIONS WHERE Notification_ID = ? AND User_ID = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;