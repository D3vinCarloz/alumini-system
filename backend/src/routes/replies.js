const router = require('express').Router();
const db     = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { createNotification } = require('../config/notify');

// POST /api/replies/:queryId
router.post('/:queryId', authenticate, async (req, res) => {
  try {
    const { queryId } = req.params;
    const { content } = req.body;

    if (!content)
      return res.status(400).json({ message: 'content is required' });

    await db.query(
      'INSERT INTO REPLY (Query_ID, User_ID, Content) VALUES (?, ?, ?)',
      [queryId, req.user.id, content]
    );

    // Mark as answered if alumni replies
    if (req.user.role === 'alumni') {
      await db.query(
        "UPDATE QUERY SET Status = 'answered' WHERE Query_ID = ?",
        [queryId]
      );
    }

    // Get query details for notification
    const [[query]] = await db.query(`
      SELECT q.Student_ID, q.Alumni_ID,
             s_user.User_ID AS studentUserId,
             s_user.Name    AS studentName,
             a_user.User_ID AS alumniUserId,
             a_user.Name    AS alumniName
      FROM   QUERY q
      JOIN   STUDENT st  ON st.Student_ID = q.Student_ID
      JOIN   USER s_user ON s_user.User_ID = st.User_ID
      JOIN   ALUMNI al   ON al.Alumni_ID   = q.Alumni_ID
      JOIN   USER a_user ON a_user.User_ID = al.User_ID
      WHERE  q.Query_ID = ?
    `, [queryId]);

    if (query) {
      if (req.user.role === 'alumni') {
        // Notify student that alumni replied
        await createNotification({
          userId:  query.studentUserId,
          title:   'Query Answered',
          message: `${query.alumniName} replied to your query.`,
          type:    'reply',
          link:    `/chat/${queryId}`,
        });
      } else {
        // Notify alumni that student sent a follow-up
        await createNotification({
          userId:  query.alumniUserId,
          title:   'New Message',
          message: `${query.studentName} sent a follow-up message.`,
          type:    'reply',
          link:    `/chat/${queryId}`,
        });
      }
    }

    res.status(201).json({ message: 'Reply sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;