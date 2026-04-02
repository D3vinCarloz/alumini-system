const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('../config/notify');

router.post('/:queryId', authenticate, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { content } = req.body;
    const { id: userId, role, name } = req.user;

    // 1. Save the reply message
    await db.query(
      'INSERT INTO reply (Query_ID, User_ID, Content) VALUES (?, ?, ?)',
      [queryId, userId, content]
    );

    // 2. Set Query Status & Update UI Tracking columns (isUnread & Latest_Sender_Role)
    const nextStatus = (role === 'student') ? 'pending' : 'answered';
    await db.query(
      'UPDATE query SET Status = ?, isUnread = 1, Latest_Sender_Role = ? WHERE Query_ID = ?', 
      [nextStatus, role, queryId]
    );

    // 3. Find Recipient's User_ID
    const [[queryInfo]] = await db.query(`
      SELECT s_u.User_ID as s_uid, a_u.User_ID as a_uid
      FROM query q
      JOIN student s ON s.Student_ID = q.Student_ID
      JOIN user s_u   ON s_u.User_ID = s.User_ID
      JOIN alumni a  ON a.Alumni_ID = q.Alumni_ID
      JOIN user a_u   ON a_u.User_ID = a.User_ID
      WHERE q.Query_ID = ?
    `, [queryId]);

    const recipientId = (role === 'student') ? queryInfo.a_uid : queryInfo.s_uid;

    // 4. Create Notification
    await createNotification({
      userId: recipientId,
      title:  `New message from ${name}`,
      message: content.substring(0, 60),
      type:   'reply',
      link:   `/chat/${queryId}`
    });

    res.status(201).json({ message: 'Reply sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
