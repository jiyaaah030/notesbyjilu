const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: String,
  filename: String,
  uploader: String,
  fileUrl: String,              // if you serve static files, you can build this from filename
  uploaderUid: { type: String, index: true, required: true }, // Firebase UID
  year: String,
  semester: String,
  subject: String,
  description: String,
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],    // Array of Firebase UIDs who liked this note
  dislikedBy: [{ type: String }], // Array of Firebase UIDs who disliked this note
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);
