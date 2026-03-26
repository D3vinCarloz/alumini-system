const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { createNotification } = require('../config/notify');

// GET /api/queries
router.get('/', authenticate, async (req, res) => {
  try {
    const { subId, role } = req.user;
    const col = role === 'student' ? 'q.Student_ID' : 'q.Alumni_ID';

    const [rows] = await db.query(`
      SELECT q.Query_ID, q.Content, q.Query_Date, q.Status,
             s_user.Name  AS studentName, q.Student_ID,
             a_user.Name  AS alumniName,  q.Alumni_ID
      FROM   QUERY q
      JOIN   STUDENT st    ON st.Student_ID = q.Student_ID
      JOIN   USER s_user   ON s_user.User_ID = st.User_ID
      JOIN   ALUMNI al     ON al.Alumni_ID   = q.Alumni_ID
      JOIN   USER a_user   ON a_user.User_ID = al.User_ID
      WHERE  ${col} = ?
      ORDER  BY q.Query_Date DESC
    `, [subId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/queries — student starts or continues a query thread
router.post('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { alumniId, content } = req.body;

    if (!alumniId || !content)
      return res.status(400).json({ message: 'alumniId and content are required' });

    // Check if thread already exists between this student and alumni
    const [[existing]] = await db.query(
      'SELECT Query_ID FROM QUERY WHERE Student_ID = ? AND Alumni_ID = ?',
      [req.user.subId, alumniId]
    );

    if (existing) {
      // Thread exists — add message as a reply
      await db.query(
        'INSERT INTO REPLY (Query_ID, User_ID, Content) VALUES (?, ?, ?)',
        [existing.Query_ID, req.user.id, content]
      );

      // Update status back to pending since student sent a new message
      await db.query(
        "UPDATE QUERY SET Status = 'pending' WHERE Query_ID = ?",
        [existing.Query_ID]
      );

      // Notify alumni of new message
      const [[alumni]] = await db.query(`
        SELECT u.User_ID FROM ALUMNI a
        JOIN USER u ON u.User_ID = a.User_ID
        WHERE a.Alumni_ID = ?
      `, [alumniId]);

      if (alumni) {
        await createNotification({
          userId:  alumni.User_ID,
          title:   'New Message',
          message: `${req.user.name} sent a new message: "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`,
          type:    'reply',
          link:    `/chat/${existing.Query_ID}`,
        });
      }

      return res.status(200).json({ queryId: existing.Query_ID, existing: true });
    }

    // No thread yet — create new query
    const [result] = await db.query(
      'INSERT INTO QUERY (Student_ID, Alumni_ID, Content) VALUES (?, ?, ?)',
      [req.user.subId, alumniId, content]
    );

    const queryId = result.insertId;

    // Notify alumni of new query
    const [[alumni]] = await db.query(`
      SELECT u.User_ID, u.Name FROM ALUMNI a
      JOIN USER u ON u.User_ID = a.User_ID
      WHERE a.Alumni_ID = ?
    `, [alumniId]);

    if (alumni) {
      await createNotification({
        userId:  alumni.User_ID,
        title:   'New Query Received',
        message: `${req.user.name} sent you a query: "${content.substring(0, 80)}${content.length > 80 ? '...' : ''}"`,
        type:    'query',
        link:    `/chat/${queryId}`,
      });
    }

    res.status(201).json({ queryId, existing: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/queries/:queryId — full thread with all replies
router.get('/:queryId', authenticate, async (req, res) => {
  try {
    const [[query]] = await db.query(`
      SELECT q.Query_ID, q.Content, q.Query_Date, q.Status,
             s_user.Name AS studentName, q.Student_ID,
             a_user.Name AS alumniName,  q.Alumni_ID
      FROM   QUERY q
      JOIN   STUDENT st  ON st.Student_ID = q.Student_ID
      JOIN   USER s_user ON s_user.User_ID = st.User_ID
      JOIN   ALUMNI al   ON al.Alumni_ID   = q.Alumni_ID
      JOIN   USER a_user ON a_user.User_ID = al.User_ID
      WHERE  q.Query_ID = ?
    `, [req.params.queryId]);

    if (!query)
      return res.status(404).json({ message: 'Query not found' });

    const [replies] = await db.query(`
      SELECT r.Reply_ID, r.User_ID, u.Name AS senderName,
             r.Content, r.Reply_Date
      FROM   REPLY r
      JOIN   USER u ON u.User_ID = r.User_ID
      WHERE  r.Query_ID = ?
      ORDER  BY r.Reply_Date
    `, [req.params.queryId]);

    res.json({ ...query, messages: replies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;