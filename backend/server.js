
require('dotenv').config();
const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const mime = require("mime-types");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const app = express();
const db = new sqlite3.Database("db.sqlite");

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Create uploads folder if it doesn't exist
const uploadDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// File Storage Config
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4"];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid file type"));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

// Create table if not exist
db.run(\`CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY,
  title TEXT,
  desc TEXT,
  url TEXT,
  type TEXT
)\`);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

// Public API
app.get("/api/works", (req, res) => {
  db.all("SELECT id, title, desc, url, type FROM works ORDER BY id DESC", (_, rows) => res.json(rows));
});

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  return req.session.user === "admin" ? next() : res.status(401).send("Unauthorized");
}

// Admin Login (POST)
app.post("/api/admin/login", (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    req.session.user = "admin";
    res.sendStatus(200);
  } else res.status(403).send("Invalid credentials");
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.sendStatus(200));
});

// Admin CRUD
app.get("/api/admin/works", requireAdmin, (req, res) => {
  db.all("SELECT id, title FROM works ORDER BY id DESC", (_, rows) => res.json(rows));
});

app.post("/api/admin/add", requireAdmin, upload.single("file"), (req, res) => {
  const { title, desc } = req.body;
  const url = \`/uploads/\${req.file.filename}\`;
  const type = mime.lookup(req.file.originalname);
  db.run("INSERT INTO works (title, desc, url, type) VALUES (?, ?, ?, ?)",
    [title, desc, url, type], () => res.sendStatus(201));
});

app.post("/api/admin/delete", requireAdmin, (req, res) => {
  db.get("SELECT url FROM works WHERE id = ?", [req.body.id], (err, row) => {
    if (row) {
      const filepath = path.join(__dirname, row.url);
      fs.unlink(filepath, () => {});
    }
  });
  db.run("DELETE FROM works WHERE id = ?", [req.body.id], () => res.sendStatus(204));
});

// Static Files
app.use("/uploads", express.static(uploadDir));
app.use(express.static(path.resolve(__dirname, "../frontend/dist")));

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
