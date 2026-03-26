const db = require('./db');

async function createNotification({ userId, title, message, type, link }) {
  try {
    await db.query(
      'INSERT INTO NOTIFICATIONS (User_ID, Title, Message, Type, Link) VALUES (?, ?, ?, ?, ?)',
      [userId, title, message, type, link || null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

module.exports = { createNotification };