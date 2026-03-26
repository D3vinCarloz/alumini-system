require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Serve uploaded resumes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/alumni',        require('./routes/alumni'));
app.use('/api/queries',       require('./routes/queries'));
app.use('/api/replies',       require('./routes/replies'));
app.use('/api/jobs',          require('./routes/jobs'));
app.use('/api/career',        require('./routes/career'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/student',       require('./routes/student'));
app.use('/api/applications',  require('./routes/applications'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Unexpected server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Backend running at http://localhost:${PORT}`)
);