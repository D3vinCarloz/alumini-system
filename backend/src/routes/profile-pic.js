const router = require('express').Router();
const db     = require('../config/db');
const path   = require('path');
const fs     = require('fs');
const { authenticate } = require('../middleware/auth');
const { uploadProfile } = require('../config/upload');

// POST /api/profile-pic — upload profile picture
router.post('/', authenticate, uploadProfile.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old profile pic if exists
    const [[user]] = await db.query(
      'SELECT Profile_Pic FROM user WHERE User_ID = ?',
      [req.user.id]
    );

    if (user?.Profile_Pic) {
      const oldPath = path.join(__dirname, '../../uploads/profiles', user.Profile_Pic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Save new filename to DB
    await db.query(
      'UPDATE user SET Profile_Pic = ? WHERE User_ID = ?',
      [req.file.filename, req.user.id]
    );

    res.json({
      message:    'Profile picture updated successfully',
      profilePic: req.file.filename,
    });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/profile-pic — remove profile picture
router.delete('/', authenticate, async (req, res) => {
  try {
    const [[user]] = await db.query(
      'SELECT Profile_Pic FROM user WHERE User_ID = ?',
      [req.user.id]
    );

    if (user?.Profile_Pic) {
      const filePath = path.join(__dirname, '../../uploads/profiles', user.Profile_Pic);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await db.query(
      'UPDATE user SET Profile_Pic = NULL WHERE User_ID = ?',
      [req.user.id]
    );

    res.json({ message: 'Profile picture removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
