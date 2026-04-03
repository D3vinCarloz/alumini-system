const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { createNotification } = require('../config/notify');

function isAlumniThreadId(threadId) {
  return typeof threadId === 'string' && threadId.startsWith('aa-');
}

function parseThreadId(threadId) {
  return isAlumniThreadId(threadId) ? threadId.slice(3) : threadId;
}

function formatClassicRow(row, role) {
  const isUnread = (role === 'student' && row.dbStatus === 'answered') ||
    (role === 'alumni' && row.dbStatus === 'pending');

  return {
    ...row,
    Thread_ID: String(row.Query_ID),
    threadType: 'student-alumni',
    counterpartName: role === 'student' ? row.alumniName : row.studentName,
    counterpartProfilePic: role === 'student' ? row.alumniProfilePic : row.studentProfilePic,
    counterpartRole: role === 'student' ? 'alumni' : 'student',
    counterpartAlumniId: row.Alumni_ID,
    isUnread,
    Status: isUnread ? 'unread' : 'read',
    Profile_Pic: role === 'student' ? row.alumniProfilePic : row.studentProfilePic,
  };
}

function formatAlumniRow(row, currentAlumniId) {
  const isSender = row.Sender_Alumni_ID === currentAlumniId;
  const counterpartName = isSender ? row.receiverName : row.senderName;
  const counterpartProfilePic = isSender ? row.receiverProfilePic : row.senderProfilePic;
  const counterpartAlumniId = isSender ? row.Receiver_Alumni_ID : row.Sender_Alumni_ID;
  const isUnread = row.Latest_Sender_Alumni_ID !== currentAlumniId && row.Status === 'pending';

  return {
    Query_ID: row.Query_ID,
    Thread_ID: `aa-${row.Query_ID}`,
    threadType: 'alumni-alumni',
    Content: row.Content,
    Query_Date: row.Query_Date,
    Status: isUnread ? 'unread' : 'read',
    isUnread,
    Latest_Sender_Role: 'alumni',
    studentName: null,
    alumniName: counterpartName,
    counterpartName,
    counterpartProfilePic,
    counterpartRole: 'alumni',
    counterpartAlumniId,
    Profile_Pic: counterpartProfilePic,
  };
}

// 1. GET ALL CHATS FOR USER
router.get('/', authenticate, async (req, res) => {
  try {
    const { subId, role } = req.user;

    if (role === 'student') {
      const [rows] = await db.query(`
        SELECT q.Query_ID, q.Status AS dbStatus,
               COALESCE(lr.Latest_Content, q.Content) AS Content,
               COALESCE(lr.Latest_Date, q.Query_Date) AS Query_Date,
               lr.Latest_Sender_Role,
               q.Alumni_ID,
               s_user.Name AS studentName, s_user.Profile_Pic AS studentProfilePic,
               a_user.Name AS alumniName, a_user.Profile_Pic AS alumniProfilePic
        FROM   query q
        JOIN   student st   ON st.Student_ID = q.Student_ID
        JOIN   user s_user  ON s_user.User_ID = st.User_ID
        JOIN   alumni al    ON al.Alumni_ID = q.Alumni_ID
        JOIN   user a_user  ON a_user.User_ID = al.User_ID
        LEFT JOIN (
            SELECT r1.Query_ID, r1.Content AS Latest_Content, r1.Reply_Date AS Latest_Date, u.role AS Latest_Sender_Role
            FROM reply r1
            JOIN user u ON r1.User_ID = u.User_ID
            INNER JOIN (
                SELECT Query_ID, MAX(Reply_Date) AS MaxDate FROM reply GROUP BY Query_ID
            ) r2 ON r1.Query_ID = r2.Query_ID AND r1.Reply_Date = r2.MaxDate
        ) lr ON lr.Query_ID = q.Query_ID
        WHERE q.Student_ID = ?
        ORDER BY Query_Date DESC
      `, [subId]);

      return res.json(rows.map((row) => formatClassicRow(row, role)));
    }

    if (role === 'alumni') {
      const [classicRows] = await db.query(`
        SELECT q.Query_ID, q.Status AS dbStatus,
               COALESCE(lr.Latest_Content, q.Content) AS Content,
               COALESCE(lr.Latest_Date, q.Query_Date) AS Query_Date,
               lr.Latest_Sender_Role,
               q.Alumni_ID,
               q.Student_ID,
               s_user.Name AS studentName, s_user.Profile_Pic AS studentProfilePic,
               a_user.Name AS alumniName, a_user.Profile_Pic AS alumniProfilePic
        FROM   query q
        JOIN   student st   ON st.Student_ID = q.Student_ID
        JOIN   user s_user  ON s_user.User_ID = st.User_ID
        JOIN   alumni al    ON al.Alumni_ID = q.Alumni_ID
        JOIN   user a_user  ON a_user.User_ID = al.User_ID
        LEFT JOIN (
            SELECT r1.Query_ID, r1.Content AS Latest_Content, r1.Reply_Date AS Latest_Date, u.role AS Latest_Sender_Role
            FROM reply r1
            JOIN user u ON r1.User_ID = u.User_ID
            INNER JOIN (
                SELECT Query_ID, MAX(Reply_Date) AS MaxDate FROM reply GROUP BY Query_ID
            ) r2 ON r1.Query_ID = r2.Query_ID AND r1.Reply_Date = r2.MaxDate
        ) lr ON lr.Query_ID = q.Query_ID
        WHERE q.Alumni_ID = ?
      `, [subId]);

      const [alumniRows] = await db.query(`
        SELECT aq.Query_ID, aq.Sender_Alumni_ID, aq.Receiver_Alumni_ID, aq.Status, aq.Latest_Sender_Alumni_ID,
               COALESCE(ar_latest.Content, aq.Content) AS Content,
               COALESCE(ar_latest.Reply_Date, aq.Query_Date) AS Query_Date,
               sender_user.Name AS senderName, sender_user.Profile_Pic AS senderProfilePic,
               receiver_user.Name AS receiverName, receiver_user.Profile_Pic AS receiverProfilePic
        FROM alumni_query aq
        JOIN alumni sender_alumni ON sender_alumni.Alumni_ID = aq.Sender_Alumni_ID
        JOIN user sender_user ON sender_user.User_ID = sender_alumni.User_ID
        JOIN alumni receiver_alumni ON receiver_alumni.Alumni_ID = aq.Receiver_Alumni_ID
        JOIN user receiver_user ON receiver_user.User_ID = receiver_alumni.User_ID
        LEFT JOIN (
          SELECT ar1.Query_ID, ar1.Content, ar1.Reply_Date
          FROM alumni_reply ar1
          INNER JOIN (
            SELECT Query_ID, MAX(Reply_Date) AS MaxDate
            FROM alumni_reply
            GROUP BY Query_ID
          ) ar2 ON ar1.Query_ID = ar2.Query_ID AND ar1.Reply_Date = ar2.MaxDate
        ) ar_latest ON ar_latest.Query_ID = aq.Query_ID
        WHERE aq.Sender_Alumni_ID = ? OR aq.Receiver_Alumni_ID = ?
      `, [subId, subId]);

      const formattedClassic = classicRows.map((row) => formatClassicRow(row, role));
      const formattedAlumni = alumniRows.map((row) => formatAlumniRow(row, subId));
      const rows = [...formattedClassic, ...formattedAlumni]
        .sort((a, b) => new Date(b.Query_Date).getTime() - new Date(a.Query_Date).getTime());

      return res.json(rows);
    }

    return res.json([]);
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
      FROM query q
      JOIN student s ON s.Student_ID = q.Student_ID JOIN user s_u ON s_u.User_ID = s.User_ID
      JOIN alumni a ON a.Alumni_ID = q.Alumni_ID JOIN user a_u ON a_u.User_ID = a.User_ID
      ORDER BY q.Query_Date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. GET SINGLE CHAT
router.get('/:queryId', authenticate, async (req, res) => {
  try {
    const { subId, role, id: userId } = req.user;
    const { queryId } = req.params;

    if (isAlumniThreadId(queryId)) {
      if (role !== 'alumni' && role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const numericId = parseThreadId(queryId);
      const [rows] = await db.query(`
        SELECT aq.Query_ID, aq.Content, aq.Query_Date, aq.Status, aq.Latest_Sender_Alumni_ID,
               aq.Sender_Alumni_ID, aq.Receiver_Alumni_ID,
               sender_user.Name AS senderName, sender_user.Profile_Pic AS senderProfilePic, sender_user.User_ID AS senderUserId,
               receiver_user.Name AS receiverName, receiver_user.Profile_Pic AS receiverProfilePic, receiver_user.User_ID AS receiverUserId
        FROM alumni_query aq
        JOIN alumni sender_alumni ON sender_alumni.Alumni_ID = aq.Sender_Alumni_ID
        JOIN user sender_user ON sender_user.User_ID = sender_alumni.User_ID
        JOIN alumni receiver_alumni ON receiver_alumni.Alumni_ID = aq.Receiver_Alumni_ID
        JOIN user receiver_user ON receiver_user.User_ID = receiver_alumni.User_ID
        WHERE aq.Query_ID = ?
      `, [numericId]);

      if (rows.length === 0) return res.status(404).json({ message: 'Conversation not found' });
      const thread = rows[0];

      if (role === 'alumni' && thread.Sender_Alumni_ID !== subId && thread.Receiver_Alumni_ID !== subId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      if (role === 'alumni') {
        if (thread.Latest_Sender_Alumni_ID !== subId && thread.Status === 'pending') {
          await db.query("UPDATE alumni_query SET Status = 'read' WHERE Query_ID = ?", [numericId]);
        }
        await db.query(
          'UPDATE notifications SET Is_Read = TRUE WHERE User_ID = ? AND Link = ? AND Is_Read = FALSE',
          [userId, `/chat/aa-${numericId}`]
        );
      }

      const [replies] = await db.query(`
        SELECT r.Reply_ID, r.User_ID, u.Name AS senderName, u.Profile_Pic, r.Content, r.Reply_Date
        FROM alumni_reply r
        JOIN user u ON u.User_ID = r.User_ID
        WHERE r.Query_ID = ?
        ORDER BY r.Reply_Date ASC
      `, [numericId]);

      const counterpartName = role === 'alumni'
        ? (thread.Sender_Alumni_ID === subId ? thread.receiverName : thread.senderName)
        : thread.receiverName;
      const counterpartProfilePic = role === 'alumni'
        ? (thread.Sender_Alumni_ID === subId ? thread.receiverProfilePic : thread.senderProfilePic)
        : thread.receiverProfilePic;
      const counterpartUserId = role === 'alumni'
        ? (thread.Sender_Alumni_ID === subId ? thread.receiverUserId : thread.senderUserId)
        : thread.receiverUserId;
      const counterpartAlumniId = role === 'alumni'
        ? (thread.Sender_Alumni_ID === subId ? thread.Receiver_Alumni_ID : thread.Sender_Alumni_ID)
        : thread.Receiver_Alumni_ID;

      return res.json({
        Query_ID: thread.Query_ID,
        Thread_ID: `aa-${thread.Query_ID}`,
        Content: thread.Content,
        Query_Date: thread.Query_Date,
        Status: thread.Status,
        counterpartName,
        counterpartProfilePic,
        counterpartRole: 'alumni',
        counterpartUserId,
        counterpartAlumniId,
        messages: replies,
      });
    }

    let sql = `
      SELECT q.Query_ID, q.Content, q.Query_Date, q.Status,
             s_u.Name AS studentName, s_u.Profile_Pic AS studentProfilePic, s_u.User_ID AS studentUserId, q.Student_ID,
             a_u.Name AS alumniName, a_u.Profile_Pic AS alumniProfilePic, a_u.User_ID AS alumniUserId, q.Alumni_ID
      FROM query q
      JOIN student s ON s.Student_ID = q.Student_ID JOIN user s_u ON s_u.User_ID = s.User_ID
      JOIN alumni a ON a.Alumni_ID = q.Alumni_ID JOIN user a_u ON a_u.User_ID = a.User_ID
      WHERE q.Query_ID = ?
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
      await db.query(
        'UPDATE notifications SET Is_Read = TRUE WHERE User_ID = ? AND Link LIKE ? AND Is_Read = FALSE',
        [userId, `%/${queryId}`]
      );
    }

    const [replies] = await db.query(`
      SELECT r.Reply_ID, r.User_ID, u.Name AS senderName, u.Profile_Pic, r.Content, r.Reply_Date
      FROM reply r
      JOIN user u ON u.User_ID = r.User_ID
      WHERE r.Query_ID = ?
      ORDER BY r.Reply_Date ASC
    `, [queryId]);

    res.json({
      ...queryData,
      Thread_ID: String(queryData.Query_ID),
      counterpartName: role === 'student' ? queryData.alumniName : queryData.studentName,
      counterpartProfilePic: role === 'student' ? queryData.alumniProfilePic : queryData.studentProfilePic,
      counterpartRole: role === 'student' ? 'alumni' : 'student',
      counterpartUserId: role === 'student' ? queryData.alumniUserId : queryData.studentUserId,
      counterpartAlumniId: queryData.Alumni_ID,
      messages: replies,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. POST NEW CHAT
router.post('/', authenticate, async (req, res) => {
  try {
    const { content, alumniId, recipientAlumniId } = req.body;

    if (!content) return res.status(400).json({ message: 'Missing fields' });

    if (req.user.role === 'student') {
      const studentId = req.user.subId;
      if (!alumniId) return res.status(400).json({ message: 'Missing fields' });

      const [existing] = await db.query(
        'SELECT Query_ID FROM query WHERE Student_ID = ? AND Alumni_ID = ?',
        [studentId, alumniId]
      );

      if (existing.length > 0) {
        const qId = existing[0].Query_ID;
        await db.query('INSERT INTO reply (Query_ID, User_ID, Content) VALUES (?, ?, ?)', [qId, req.user.id, content]);
        await db.query("UPDATE query SET Status = 'pending', Latest_Sender_Role = 'student' WHERE Query_ID = ?", [qId]);
        const [[recipient]] = await db.query(`
          SELECT u.User_ID
          FROM alumni a
          JOIN user u ON u.User_ID = a.User_ID
          WHERE a.Alumni_ID = ?
        `, [alumniId]);
        if (recipient?.User_ID) {
          await createNotification({
            userId: recipient.User_ID,
            title: `New message from ${req.user.name}`,
            message: content.substring(0, 60),
            type: 'reply',
            link: `/chat/${qId}`,
          });
        }
        return res.status(200).json({ queryId: qId, existing: true, threadId: String(qId) });
      }

      const [result] = await db.query(
        "INSERT INTO query (Student_ID, Alumni_ID, Content, Status, Latest_Sender_Role) VALUES (?, ?, ?, 'pending', 'student')",
        [studentId, alumniId, content]
      );

      const [[recipient]] = await db.query(`
        SELECT u.User_ID
        FROM alumni a
        JOIN user u ON u.User_ID = a.User_ID
        WHERE a.Alumni_ID = ?
      `, [alumniId]);
      if (recipient?.User_ID) {
        await createNotification({
          userId: recipient.User_ID,
          title: `New message from ${req.user.name}`,
          message: content.substring(0, 60),
          type: 'reply',
          link: `/chat/${result.insertId}`,
        });
      }

      return res.status(201).json({ queryId: result.insertId, existing: false, threadId: String(result.insertId) });
    }

    if (req.user.role === 'alumni') {
      const senderAlumniId = req.user.subId;
      if (!recipientAlumniId) return res.status(400).json({ message: 'Missing recipient' });
      if (Number(recipientAlumniId) === Number(senderAlumniId)) {
        return res.status(400).json({ message: 'You cannot message yourself' });
      }

      const [existing] = await db.query(`
        SELECT Query_ID
        FROM alumni_query
        WHERE (Sender_Alumni_ID = ? AND Receiver_Alumni_ID = ?)
           OR (Sender_Alumni_ID = ? AND Receiver_Alumni_ID = ?)
      `, [senderAlumniId, recipientAlumniId, recipientAlumniId, senderAlumniId]);

      if (existing.length > 0) {
        const qId = existing[0].Query_ID;
        await db.query('INSERT INTO alumni_reply (Query_ID, User_ID, Content) VALUES (?, ?, ?)', [qId, req.user.id, content]);
        await db.query(
          "UPDATE alumni_query SET Status = 'pending', Latest_Sender_Alumni_ID = ? WHERE Query_ID = ?",
          [senderAlumniId, qId]
        );
        const [[recipient]] = await db.query(`
          SELECT u.User_ID
          FROM alumni a
          JOIN user u ON u.User_ID = a.User_ID
          WHERE a.Alumni_ID = ?
        `, [recipientAlumniId]);
        if (recipient?.User_ID) {
          await createNotification({
            userId: recipient.User_ID,
            title: `New message from ${req.user.name}`,
            message: content.substring(0, 60),
            type: 'reply',
            link: `/chat/aa-${qId}`,
          });
        }
        return res.status(200).json({ queryId: qId, existing: true, threadId: `aa-${qId}` });
      }

      const [result] = await db.query(
        "INSERT INTO alumni_query (Sender_Alumni_ID, Receiver_Alumni_ID, Content, Status, Latest_Sender_Alumni_ID) VALUES (?, ?, ?, 'pending', ?)",
        [senderAlumniId, recipientAlumniId, content, senderAlumniId]
      );

      const [[recipient]] = await db.query(`
        SELECT u.User_ID
        FROM alumni a
        JOIN user u ON u.User_ID = a.User_ID
        WHERE a.Alumni_ID = ?
      `, [recipientAlumniId]);
      if (recipient?.User_ID) {
        await createNotification({
          userId: recipient.User_ID,
          title: `New message from ${req.user.name}`,
          message: content.substring(0, 60),
          type: 'reply',
          link: `/chat/aa-${result.insertId}`,
        });
      }

      return res.status(201).json({ queryId: result.insertId, existing: false, threadId: `aa-${result.insertId}` });
    }

    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    console.error('Error in POST /queries:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
