const db = require('./db');

let initialized = false;

async function ensureSchema() {
  if (initialized) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS alumni_query (
      Query_ID INT NOT NULL AUTO_INCREMENT,
      Sender_Alumni_ID INT NOT NULL,
      Receiver_Alumni_ID INT NOT NULL,
      Content TEXT NOT NULL,
      Query_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      Status VARCHAR(20) DEFAULT 'pending',
      Latest_Sender_Alumni_ID INT NOT NULL,
      PRIMARY KEY (Query_ID),
      KEY Sender_Alumni_ID (Sender_Alumni_ID),
      KEY Receiver_Alumni_ID (Receiver_Alumni_ID),
      KEY Latest_Sender_Alumni_ID (Latest_Sender_Alumni_ID),
      CONSTRAINT alumni_query_ibfk_1 FOREIGN KEY (Sender_Alumni_ID) REFERENCES alumni (Alumni_ID) ON DELETE CASCADE,
      CONSTRAINT alumni_query_ibfk_2 FOREIGN KEY (Receiver_Alumni_ID) REFERENCES alumni (Alumni_ID) ON DELETE CASCADE,
      CONSTRAINT alumni_query_ibfk_3 FOREIGN KEY (Latest_Sender_Alumni_ID) REFERENCES alumni (Alumni_ID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS alumni_reply (
      Reply_ID INT NOT NULL AUTO_INCREMENT,
      Query_ID INT NOT NULL,
      User_ID INT NOT NULL,
      Content TEXT NOT NULL,
      Reply_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (Reply_ID),
      KEY Query_ID (Query_ID),
      KEY User_ID (User_ID),
      CONSTRAINT alumni_reply_ibfk_1 FOREIGN KEY (Query_ID) REFERENCES alumni_query (Query_ID) ON DELETE CASCADE,
      CONSTRAINT alumni_reply_ibfk_2 FOREIGN KEY (User_ID) REFERENCES user (User_ID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  initialized = true;
}

module.exports = { ensureSchema };
