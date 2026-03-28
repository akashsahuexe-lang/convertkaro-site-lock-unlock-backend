const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// 🌟 SMART QPDF PATH (Render aur tumhare PC dono ke liye)
// Render (production) par 'qpdf' command use hogi, tumhare PC par G: drive wala .exe path
const isProduction = process.env.NODE_ENV === 'production';
const qpdfPath = isProduction ? 'qpdf' : 'G:/trail/qpdf-12.3.2-msvc64/qpdf-12.3.2-msvc64/bin/qpdf.exe'; 

// ----- TOOL 1: UNLOCK PDF -----
app.post('/api/unlock', upload.single('pdfFile'), (req, res) => {
  const password = req.body.password;
  const inputPath = req.file.path;
  const outputPath = path.join(__dirname, 'uploads', `unlocked_${Date.now()}.pdf`);

  // PC par path check karo, Render par skip karo
  if (!isProduction && !fs.existsSync(qpdfPath)) {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(500).json({ error: 'QPDF Path is wrong.' });
  }

  const args = [`--password=${password}`, '--decrypt', inputPath, outputPath];

  execFile(qpdfPath, args, (error, stdout, stderr) => {
    if (error) {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(400).json({ error: 'Incorrect password or corrupted file.' });
    }
    res.download(outputPath, 'unlocked.pdf', (err) => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log("✅ SUCCESS: PDF Unlocked!");
    });
  });
});

// ----- TOOL 2: PROTECT PDF -----
app.post('/api/protect', upload.single('pdfFile'), (req, res) => {
  const password = req.body.password;
  const inputPath = req.file.path;
  const outputPath = path.join(__dirname, 'uploads', `protected_${Date.now()}.pdf`);

  if (!isProduction && !fs.existsSync(qpdfPath)) {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(500).json({ error: 'QPDF Path is wrong.' });
  }

  const args = ['--encrypt', password, password, '256', '--', inputPath, outputPath];

  execFile(qpdfPath, args, (error, stdout, stderr) => {
    if (error) {
      console.log("❌ ERROR DETAILS:", stderr || error.message);
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return res.status(400).json({ error: 'Failed to protect PDF.' });
    }
    res.download(outputPath, 'protected.pdf', (err) => {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      console.log("🔒 SUCCESS: PDF Protected with Password!");
    });
  });
});

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 🌟 DYNAMIC PORT (Render ke liye zaroori)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend is live at port ${PORT}`);
});