require("dotenv").config();

const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

let sslCa;

if (process.env.DB_SSL_CA) {
  sslCa = process.env.DB_SSL_CA.replace(/\\n/g, "\n");
} else {
  sslCa = fs.readFileSync(path.join(__dirname, "ca.pem"));
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    ca: sslCa,
    rejectUnauthorized: true,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = db;
