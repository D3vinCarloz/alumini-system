const router = require('express').Router();
const db     = require('../config/db');
const path   = require('path');
const fs     = require('fs');
const { authenticate, requireRole } = require('../middleware/auth');
const { createNotification } = require('../config/notify');
const upload = require('../config/upload');

// POST /api/applications/:jobId — student applies with resume
router.post('/:jobId', authenticate, requireRole('student'),
  upload.single('resume'),
  async (req, res) => {
    try {
      const { jobId } = req.params;

      // Check already applied
      const [[existing]] = await db.query(
        'SELECT Application_ID FROM JOB_APPLICATIONS WHERE Job_ID = ? AND Student_ID = ?',
        [jobId, req.user.subId]
      );
      if (existing) {
        // Remove uploaded file if already applied
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(409).json({ message: 'You have already applied for this job' });
      }

      const resumePath = req.file ? req.file.filename : null;

      await db.query(
        'INSERT INTO JOB_APPLICATIONS (Job_ID, Student_ID, Resume_Path) VALUES (?, ?, ?)',
        [jobId, req.user.subId, resumePath]
      );

      // Notify alumni
      const [[job]] = await db.query(`
        SELECT j.Job_Title, u.User_ID AS alumniUserId
        FROM   JOB_POSTINGS j
        JOIN   ALUMNI a ON a.Alumni_ID = j.Alumni_ID
        JOIN   USER u   ON u.User_ID   = a.User_ID
        WHERE  j.Job_ID = ?
      `, [jobId]);

      if (job) {
        await createNotification({
          userId:  job.alumniUserId,
          title:   'New Job Application',
          message: `${req.user.name} applied for "${job.Job_Title}"${resumePath ? ' with resume' : ''}.`,
          type:    'application',
          link:    `/job-postings`,
        });
      }

      res.status(201).json({ message: 'Application submitted successfully' });
    } catch (err) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error(err);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }
);

// GET /api/applications/my — student's own applications
router.get('/my', authenticate, requireRole('student'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.Application_ID, a.Status, a.Applied_Date,
             a.Resume_Path,
             j.Job_ID, j.Job_Title, j.Company_Name, j.Description,
             u.Name AS postedByName
      FROM   JOB_APPLICATIONS a
      JOIN   JOB_POSTINGS j ON j.Job_ID    = a.Job_ID
      JOIN   ALUMNI al      ON al.Alumni_ID = j.Alumni_ID
      JOIN   USER u         ON u.User_ID    = al.User_ID
      WHERE  a.Student_ID = ?
      ORDER  BY a.Applied_Date DESC
    `, [req.user.subId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/applications/job/:jobId — alumni sees applicants
router.get('/job/:jobId', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.Application_ID, a.Status, a.Applied_Date,
             a.Resume_Path,
             u.Name AS studentName, u.Email AS studentEmail,
             s.Roll_No, s.Department
      FROM   JOB_APPLICATIONS a
      JOIN   STUDENT st ON st.Student_ID = a.Student_ID
      JOIN   USER u     ON u.User_ID     = st.User_ID
      JOIN   STUDENT s  ON s.Student_ID  = a.Student_ID
      WHERE  a.Job_ID = ?
      ORDER  BY a.Applied_Date DESC
    `, [req.params.jobId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/applications/resume/:filename — serve resume file
router.get('/resume/:filename', authenticate, async (req, res) => {
  try {
    const filename  = req.params.filename;
    const filePath  = path.join(__dirname, '../../uploads/resumes', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Only allow the student who uploaded OR alumni/admin to view
    const [[app]] = await db.query(
      'SELECT a.Student_ID FROM JOB_APPLICATIONS a WHERE a.Resume_Path = ?',
      [filename]
    );

    if (!app) return res.status(404).json({ message: 'Resume not found' });

    // Allow: the student themselves, alumni, admin
    if (req.user.role === 'student') {
      const [[student]] = await db.query(
        'SELECT Student_ID FROM STUDENT WHERE User_ID = ?',
        [req.user.id]
      );
      if (student.Student_ID !== app.Student_ID) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/applications/:applicationId/status — alumni updates status
router.patch('/:applicationId/status', authenticate, requireRole('alumni'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['applied', 'viewed', 'shortlisted', 'rejected'];

    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const [[app]] = await db.query(`
      SELECT a.Student_ID, j.Job_Title,
             u.User_ID AS studentUserId, u.Name AS studentName
      FROM   JOB_APPLICATIONS a
      JOIN   JOB_POSTINGS j ON j.Job_ID     = a.Job_ID
      JOIN   STUDENT st     ON st.Student_ID = a.Student_ID
      JOIN   USER u         ON u.User_ID     = st.User_ID
      WHERE  a.Application_ID = ?
    `, [req.params.applicationId]);

    await db.query(
      'UPDATE JOB_APPLICATIONS SET Status = ? WHERE Application_ID = ?',
      [status, req.params.applicationId]
    );

    if (app) {
      const statusMessages = {
        viewed:      `Your application for "${app.Job_Title}" has been viewed.`,
        shortlisted: `You have been shortlisted for "${app.Job_Title}"! 🎉`,
        rejected:    `Your application for "${app.Job_Title}" was not selected.`,
      };
      if (statusMessages[status]) {
        await createNotification({
          userId:  app.studentUserId,
          title:   'Application Status Update',
          message: statusMessages[status],
          type:    'application',
          link:    `/my-applications`,
        });
      }
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;