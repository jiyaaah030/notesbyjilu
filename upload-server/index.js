require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const Note = require('./models/Note');
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// This line serves uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//getting notes from route
const notesRouter = require('./routes/notes');
app.use('/api/notes', notesRouter);


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, uploader } = req.body;
    const newNote = new Note({
      title,
      filename: req.file.filename,
      uploader
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