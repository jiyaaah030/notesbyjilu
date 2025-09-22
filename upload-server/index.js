const path = require("path");

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

console.log("Loaded GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);

// Set Google Cloud credentials for Vertex AI
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'firebase-service-account.json');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const Note = require('./models/Note');
const User = require('./models/User');
const { verifyFirebaseToken } = require("./middleware/auth");

const app = express();

// Middleware setup
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3003"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes - Fixed route conflicts by removing duplicate mounting
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/flashcards", require("./routes/flashcardRoutes"));

// Mount public notes route for browse page (avoiding conflict)
const notesRouter = require('./routes/notes');
app.use('/api/public/notes', notesRouter);

// MongoDB connection 
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/notesdb';
    
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined. Please check your .env file.');
    }

    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoURI);
    
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Please ensure MongoDB is running and MONGO_URI is correct");
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage });

app.post('/upload', verifyFirebaseToken, upload.single('file'), async (req, res) => {
  try {
    const { title, year, semester, subject } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const uploader = user ? user.username : (req.user.displayName || req.user.email || req.user.uid);
    const newNote = new Note({
      title,
      filename: req.file.filename,
      uploader,
      uploaderUid: req.user.uid,
      year,
      semester,
      subject,
      fileUrl: `/uploads/${req.file.filename}`
    });
    await newNote.save();
    res.status(200).json({ message: "Note uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Run server
app.listen(3001, () => console.log("Server running on port 3001"));
