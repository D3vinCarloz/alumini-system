const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications — Get list for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE User_ID = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/notifications/unread-count — For the Bell icon
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE User_ID = ? AND Is_Read = 0',
      [userId]
    );
    res.json({ count: count || 0 });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read — Mark specific notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    await db.query(
      'UPDATE notifications SET Is_Read = 1 WHERE Notification_ID = ? AND User_ID = ?',
      [req.params.id, userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Error marking single notification read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/read-by-type — Silently clear notifications by category
router.put('/read-by-type', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { type, types } = req.body;
    
    // Safely handle both single strings and arrays of strings from the frontend
    const typeArray = types ? (Array.isArray(types) ? types : [types]) : (type ? [type] : []);

    if (typeArray.length === 0) {
      return res.status(400).json({ error: 'Type or types array is required' });
    }

    const placeholders = typeArray.map(() => '?').join(',');
    
    // 🟢 FIXED: Lowercase table name and strict numeric booleans
    await db.query(
      `UPDATE notifications SET Is_Read = 1 WHERE User_ID = ? AND Type IN (${placeholders})`,
      [userId, ...typeArray]
    );

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Error marking notifications read by type:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/notifications/:id — Remove notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const [result] = await db.query(
      'DELETE FROM notifications WHERE Notification_ID = ? AND User_ID = ?',
      [req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;