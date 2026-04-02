const router = require('express').Router();
const db     = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// 1. GET ALL CHATS FOR USER (Student/Alumni Messenger List)
router.get('/', authenticate, async (req, res) => {
  try {
    const { subId, role } = req.user;
    const col = role === 'student' ? 'q.Student_ID' : 'q.Alumni_ID';

    const [rows] = await db.query(`
      SELECT q.Query_ID, q.Status AS dbStatus,
             COALESCE(lr.Latest_Content, q.Content) AS Content,
             COALESCE(lr.Latest_Date, q.Query_Date) AS Query_Date,
             lr.Latest_Sender_Role,
             s_user.Name AS studentName, s_user.Profile_Pic AS studentProfilePic,
             a_user.Name AS alumniName, a_user.Profile_Pic AS alumniProfilePic
      FROM   query q
      JOIN   student st   ON st.Student_ID = q.Student_ID
      JOIN   user s_user  ON s_user.User_ID = st.User_ID
      JOIN   alumni al    ON al.Alumni_ID   = q.Alumni_ID
      JOIN   user a_user  ON a_user.User_ID = al.User_ID
      LEFT JOIN (
          SELECT r1.Query_ID, r1.Content AS Latest_Content, r1.Reply_Date AS Latest_Date, u.role AS Latest_Sender_Role
          FROM reply r1
          JOIN user u ON r1.User_ID = u.User_ID
          INNER JOIN (
              SELECT Query_ID, MAX(Reply_Date) AS MaxDate FROM reply GROUP BY Query_ID
          ) r2 ON r1.Query_ID = r2.Query_ID AND r1.Reply_Date = r2.MaxDate
      ) lr ON lr.Query_ID = q.Query_ID
      WHERE  ${col} = ?
      ORDER  BY Query_Date DESC
    `, [subId]);

    const formattedRows = rows.map(row => {
      const isUnread = (role === 'student' && row.dbStatus === 'answered') || 
                       (role === 'alumni' && row.dbStatus === 'pending');
      return {
        ...row,
        isUnread,
        Status: isUnread ? 'unread' : 'read', 
        Profile_Pic: role === 'student' ? row.alumniProfilePic : row.studentProfilePic
      };
    });

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. GET ALL CHATS FOR ADMIN
router.get('/admin/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const [rows] = await db.query(`
      SELECT q.Query_ID, q.Content, q.Query_Date, q.Status,
             s_u.Name AS studentName, s_u.Profile_Pic AS studentProfilePic,
             a_u.Name AS alumniName, a_u.Profile_Pic AS alumniProfilePic
      FROM   query q
      JOIN   student s ON s.Student_ID = q.Student_ID JOIN user s_u ON s_u.User_ID = s.User_ID
      JOIN   alumni a  ON a.Alumni_ID = q.Alumni_ID   JOIN user a_u ON a_u.User_ID = a.User_ID
      ORDER  BY q.Query_Date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. GET SINGLE CHAT (Admin Bypass + Auto-Clear Notifications)
router.get('/:queryId', authenticate, async (req, res) => {
  try {
    const { subId, role, id: userId } = req.user;
    const { queryId } = req.params;
    
    let sql = `
      SELECT q.Query_ID, q.Content, q.Query_Date, q.Status,
             s_u.Name AS studentName, q.Student_ID,
             a_u.Name AS alumniName, q.Alumni_ID
      FROM   query q
      JOIN   student s ON s.Student_ID = q.Student_ID JOIN user s_u ON s_u.User_ID = s.User_ID
      JOIN   alumni a  ON a.Alumni_ID = q.Alumni_ID   JOIN user a_u ON a_u.User_ID = a.User_ID
      WHERE  q.Query_ID = ?
    `;
    const params = [queryId];

    if (role !== 'admin') {
      sql += role === 'student' ? ' AND q.Student_ID = ?' : ' AND q.Alumni_ID = ?';
      params.push(subId);
    }

    const [queryRows] = await db.query(sql, params);
    if (queryRows.length === 0) return res.status(404).json({ message: 'Conversation not found' });

    const queryData = queryRows[0];

    if (role !== 'admin') {
      if ((role === 'alumni' && queryData.Status === 'pending') || (role === 'student' && queryData.Status === 'answered')) {
        await db.query("UPDATE query SET Status = 'read' WHERE Query_ID = ?", [queryId]);
      }
      await db.query(`
        UPDATE notifications SET Is_Read = TRUE WHERE User_ID = ? AND Link LIKE ? AND Is_Read = FALSE
      `, [userId, `%/${queryId}`]);
    }

    const [replies] = await db.query(`
      SELECT r.Reply_ID, r.User_ID, u.Name AS senderName, u.Profile_Pic, r.Content, r.Reply_Date
      FROM   reply r
      JOIN   user u ON u.User_ID = r.User_ID
      WHERE  r.Query_ID = ?
      ORDER  BY r.Reply_Date ASC
    `, [queryId]);

    res.json({ ...queryData, messages: replies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. POST NEW CHAT
router.post('/', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { alumniId, content } = req.body;
    const studentId = req.user.subId;

    if (!alumniId || !content) return res.status(400).json({ message: 'Missing fields' });

    const [existing] = await db.query(
      'SELECT Query_ID FROM query WHERE Student_ID = ? AND Alumni_ID = ?',
      [studentId, alumniId]
    );

    if (existing.length > 0) {
      const qId = existing[0].Query_ID;
      await db.query('INSERT INTO reply (Query_ID, User_ID, Content) VALUES (?, ?, ?)', [qId, req.user.id, content]);
      await db.query("UPDATE query SET Status = 'pending' WHERE Query_ID = ?", [qId]);
      return res.status(200).json({ queryId: qId, existing: true });
    }

    const [result] = await db.query(
      "INSERT INTO query (Student_ID, Alumni_ID, Content, Status) VALUES (?, ?, ?, 'pending')",
      [studentId, alumniId, content]
    );

    res.status(201).json({ queryId: result.insertId, existing: false });
  } catch (err) {
    console.error("Error in POST /queries:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
