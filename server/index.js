const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const { Client } = require("mina-signer");

// Initialize Mina Client and Keys
let minaClient;
let privateKey;
let publicKey;

try {
  minaClient = new Client({ network: "devnet" }); // testnet minanet
  const keypair = minaClient.genKeys(); // Generate keys
  privateKey = keypair.privateKey;
  publicKey = keypair.publicKey;
  console.log("Mina Client initialized successfully");
  console.log("Private Key:", privateKey);
  console.log("Public Key:", publicKey);
} catch (error) {
  console.error("Failed to initialize Mina Client:", error);
  process.exit(1); // Exit process if Mina Client initialization fails
}

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// MySQL database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "voting_app",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    throw err;
  }
  console.log("Connected to MySQL database");
});

// Create users table if not exists
db.query(
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  (err) => {
    if (err) {
      console.error("Error creating users table:", err);
      throw err;
    }
    console.log("Users table created or already exists");
  }
);

// Create votes table if not exists
db.query(
  `CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    option VARCHAR(255) NOT NULL,
    voteDate DATE NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`,
  (err) => {
    if (err) {
      console.error("Error creating votes table:", err);
      throw err;
    }
    console.log("Votes table created or already exists");
  }
);

// Verify user
const verifyUser = async (username, email) => {
  try {
    if (!isValidEmailFormat(email)) {
      throw new Error("Invalid email format");
    }
    if (await isUsernameTaken(username)) {
      throw new Error("Username already taken");
    }
    const message = `Verify user: ${username}, email: ${email}`;
    console.log(`Signing message: ${message}`);
    const signedMessage = minaClient.signMessage(message, 1);
    console.log(signedMessage, "signedMessage");
    const isVerified = minaClient.verifyMessage(signedMessage);
    console.log(`Message verification result: ${isVerified}`);
    if (!isVerified) {
      throw new Error("User verification with Mina failed");
    }
    return true;
  } catch (error) {
    console.error("Error verifying user:", error);
    throw new Error("User verification failed");
  }
};

app.post("/api/users", async (req, res) => {
  const { username, email } = req.body;
  try {
    const isUserValid = await verifyUser(username, email);
    console.log(isUserValid, "isUserValid");
    if (!isUserValid) {
      return res.status(400).json({ error: "User validation failed" });
    }
    db.query(
      "INSERT INTO users (username, email) VALUES (?, ?)",
      [username, email],
      (err, result) => {
        if (err) {
          console.error("Error creating user:", err);
          return res.status(500).json({ error: "Error creating user" });
        }
        res.status(200).json({
          message: "User created successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Error handling user creation:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/votes", async (req, res) => {
  const { userId, option } = req.body;
  try {
    const voteDate = new Date().toISOString().slice(0, 10);

    // Create a message to sign with the vote details
    const message = `User ID: ${userId}, Vote: ${option}, Date: ${voteDate}`;
    const signedMessage = minaClient.signMessage(message, privateKey);
    console.log(`Signed message: ${signedMessage}`);

    // Verify the signed message
    const isVerified = minaClient.verifyMessage(signedMessage);
    console.log(`Message verification result: ${isVerified}`);
    if (!isVerified) {
      return res.status(400).json({ error: "Vote verification failed" });
    }

    // Insert vote into database
    const sql = "INSERT INTO votes (userId, option, voteDate) VALUES (?, ?, ?)";
    db.query(sql, [userId, option, voteDate], (err, result) => {
      if (err) {
        console.error("Error recording vote:", err);
        return res.status(500).json({ error: "Failed to record vote" });
      }
      // Return voteDate and signedMessage in response
      res.status(200).json({
        message: "Vote recorded successfully",
        voteDate,
        signedMessage,
      });
    });
  } catch (error) {
    console.error("Error handling vote:", error);
    return res.status(500).json({ error: "Error handling vote" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isUsernameTaken = async (username) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT COUNT(*) as count FROM users WHERE username = ?",
      [username],
      (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results[0].count > 0);
      }
    );
  });
};
