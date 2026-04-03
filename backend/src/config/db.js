const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 20000,
});

pool.getConnection()
  .then((connection) => {
    console.log('Connected to Railway MySQL on port', process.env.DB_PORT);
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed!');
    console.error('Error Code:', err.code);
    console.error('Message:', err.message);
  });

module.exports = pool;
