const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — Get list for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE User_ID = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/unread-count — For the Bell icon
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE User_ID = ? AND Is_Read = FALSE',
      [req.user.id]
    );
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read — Mark specific notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET Is_Read = TRUE WHERE Notification_ID = ? AND User_ID = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/read-by-type — Silently clear notifications by category
router.put('/read-by-type', authenticate, async (req, res) => {
  try {
    const { types } = req.body;
    
    if (!types || !Array.isArray(types) || types.length === 0) {
      return res.status(400).json({ error: 'Types array is required' });
    }

    const placeholders = types.map(() => '?').join(',');
    
    // 🟢 FIXED: Changed TRUE to 1 for stricter MySQL compatibility
    await db.query(
      `UPDATE notifications SET Is_Read = TRUE WHERE User_ID = ? AND Type IN (${placeholders})`,
      `UPDATE NOTIFICATIONS SET Is_Read = 1 WHERE User_ID = ? AND Type IN (${placeholders})`,
      [req.user.id, ...types]
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id — Remove notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE Notification_ID = ? AND User_ID = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
