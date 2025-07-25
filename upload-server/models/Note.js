const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: String,
  filename: String,
  uploader: String,
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Note', noteSchema);