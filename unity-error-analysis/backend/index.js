const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { extractErrors } = require("./lexAnalyzer");
const { analyzeErrors } = require("./deepSeekAPI");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// File upload configuration (Multer)
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Upload and extract errors from log file
app.post("/upload", upload.single("logFile"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = `./uploads/${req.file.filename}`;
  const errors = await extractErrors(filePath);
  res.json({ errors });
});

// Store selected errors for DeepSeek analysis
let selectedErrors = [];
app.post("/select-errors", (req, res) => {
  const { errors } = req.body;
  if (!errors || errors.length === 0)
    return res.status(400).json({ message: "No errors selected" });

  selectedErrors = errors;
  res.json({ message: "Errors selected", selectedErrors });
});

// Analyze selected errors with DeepSeek
app.post("/analyze", async (req, res) => {
  if (selectedErrors.length === 0)
    return res.status(400).json({ message: "No errors selected" });

  try {
    const solutions = await analyzeErrors(selectedErrors);
    res.json({ solutions });
  } catch (error) {
    res.status(500).json({ message: "Error analyzing with DeepSeek" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
