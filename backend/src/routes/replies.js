const router = require('express').Router();
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('../config/notify');

function isAlumniThreadId(threadId) {
  return typeof threadId === 'string' && threadId.startsWith('aa-');
}

function parseThreadId(threadId) {
  return isAlumniThreadId(threadId) ? threadId.slice(3) : threadId;
}

router.post('/:queryId', authenticate, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { content } = req.body;
    const { id: userId, role, name, subId } = req.user;

    if (isAlumniThreadId(queryId)) {
      if (role !== 'alumni') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const numericId = parseThreadId(queryId);
      const [[thread]] = await db.query(`
        SELECT aq.Sender_Alumni_ID, aq.Receiver_Alumni_ID,
               sender_user.User_ID AS senderUserId,
               receiver_user.User_ID AS receiverUserId
        FROM alumni_query aq
        JOIN alumni sender_alumni ON sender_alumni.Alumni_ID = aq.Sender_Alumni_ID
        JOIN user sender_user ON sender_user.User_ID = sender_alumni.User_ID
        JOIN alumni receiver_alumni ON receiver_alumni.Alumni_ID = aq.Receiver_Alumni_ID
        JOIN user receiver_user ON receiver_user.User_ID = receiver_alumni.User_ID
        WHERE aq.Query_ID = ?
      `, [numericId]);

      if (!thread) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (thread.Sender_Alumni_ID !== subId && thread.Receiver_Alumni_ID !== subId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await db.query(
        'INSERT INTO alumni_reply (Query_ID, User_ID, Content) VALUES (?, ?, ?)',
        [numericId, userId, content]
      );

      await db.query(
        "UPDATE alumni_query SET Status = 'pending', Latest_Sender_Alumni_ID = ? WHERE Query_ID = ?",
        [subId, numericId]
      );

      const recipientId = thread.Sender_Alumni_ID === subId ? thread.receiverUserId : thread.senderUserId;

      await createNotification({
        userId: recipientId,
        title: `New message from ${name}`,
        message: content.substring(0, 60),
        type: 'reply',
        link: `/chat/aa-${numericId}`,
      });

      return res.status(201).json({ message: 'Reply sent' });
    }

    await db.query(
      'INSERT INTO reply (Query_ID, User_ID, Content) VALUES (?, ?, ?)',
      [queryId, userId, content]
    );

    const nextStatus = role === 'student' ? 'pending' : 'answered';
    await db.query(
      'UPDATE query SET Status = ?, isUnread = 1, Latest_Sender_Role = ? WHERE Query_ID = ?',
      [nextStatus, role, queryId]
    );

    const [[queryInfo]] = await db.query(`
      SELECT s_u.User_ID as s_uid, a_u.User_ID as a_uid
      FROM query q
      JOIN student s ON s.Student_ID = q.Student_ID
      JOIN user s_u ON s_u.User_ID = s.User_ID
      JOIN alumni a ON a.Alumni_ID = q.Alumni_ID
      JOIN user a_u ON a_u.User_ID = a.User_ID
      WHERE q.Query_ID = ?
    `, [queryId]);

    const recipientId = role === 'student' ? queryInfo.a_uid : queryInfo.s_uid;

    await createNotification({
      userId: recipientId,
      title: `New message from ${name}`,
      message: content.substring(0, 60),
      type: 'reply',
      link: `/chat/${queryId}`,
    });

    res.status(201).json({ message: 'Reply sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
