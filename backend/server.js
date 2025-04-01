require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // API Key from .env

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure "uploads" folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up Multer for file uploads (Only .txt allowed)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === ".txt") {
      cb(null, true);
    } else {
      cb(new Error("Only .txt files are allowed"), false);
    }
  },
});

// File upload route
app.post("/upload", upload.single("logFile"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

  console.log(`✅ File uploaded: ${req.file.filename}`);
  res.json({ name: req.file.filename, url: `http://localhost:${PORT}/uploads/${req.file.filename}` });
});

// Serve uploaded files publicly
app.use("/uploads", express.static(uploadDir));

// Get list of uploaded log files
app.get("/logs", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("❌ Error retrieving logs:", err);
      return res.status(500).json({ error: "Failed to retrieve logs" });
    }

    const logFiles = files.map(file => ({
      name: file,
      url: `http://localhost:${PORT}/uploads/${file}`
    }));

    console.log("📂 Retrieved logs:", logFiles);
    res.json(logFiles);
  });
});

// Extract meaningful insights from log files
app.get("/analyze/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error(`❌ Error reading file: ${filename}`, err);
      return res.status(500).json({ error: "Failed to read file" });
    }

    // Extract errors (lines containing "ERROR" or "Exception")
    const errorLines = data.split("\n").filter(line => /error|exception/i.test(line));

    console.log(`📊 Extracted ${errorLines.length} errors from ${filename}`);
    res.json({ filename, errors: errorLines });
  });
});

// Fetch solutions using Gemini API
app.post("/fetch-solution", async (req, res) => {
  const { errorText } = req.body;
  if (!errorText) return res.status(400).json({ error: "Error text is required" });

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: `Analyze this Unity error and provide a solution:\n\n${errorText}` }]
          }
        ]
      }
    );

    console.log("🔍 Gemini API Response:", response.data);

    if (response.data?.candidates?.length > 0) {
      res.json({ error: errorText, solution: response.data.candidates[0].content });
    } else {
      res.json({ error: errorText, solution: "No solution found. Try again." });
    }
  } catch (error) {
    console.error("❌ Failed to fetch solution from Gemini:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to retrieve solution" });
  }
});

// Delete a file
app.delete("/delete/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) {
      console.error(`❌ File not found: ${filename}`);
      return res.status(404).json({ error: "File not found" });
    }

    fs.unlink(filePath, unlinkErr => {
      if (unlinkErr) {
        console.error(`❌ Failed to delete file: ${filename}`, unlinkErr);
        return res.status(500).json({ error: "Failed to delete file" });
      }

      console.log(`🗑️ File deleted: ${filename}`);
      res.json({ message: "File deleted successfully" });
    });
  });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
