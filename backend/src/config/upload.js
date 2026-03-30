const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Resume upload ─────────────────────────────────────────────────────────────
const resumeDir = path.join(__dirname, '../../uploads/resumes');
if (!fs.existsSync(resumeDir)) fs.mkdirSync(resumeDir, { recursive: true });

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resumeDir),
  filename: (req, file, cb) => {
    const name = `${req.user.subId}_${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, name);
  },
});

const resumeFilter = (_req, file, cb) => {
  file.mimetype === 'application/pdf'
    ? cb(null, true)
    : cb(new Error('Only PDF files are allowed'), false);
};

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ── Profile picture upload ────────────────────────────────────────────────────
const profileDir = path.join(__dirname, '../../uploads/profiles');
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profileDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `user_${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const profileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only JPG, PNG, or WEBP images are allowed'), false);
};

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: profileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

module.exports = { uploadResume, uploadProfile };