const mongoose = require('mongoose');
const Note = require('./models/Note');

async function checkNotes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notesbyjilu');
    const notes = await Note.find({}, 'title fileUrl uploader').limit(10);
    console.log('Sample notes from DB:');
    notes.forEach(n => console.log(`${n.title}: ${n.fileUrl} (uploader: ${n.uploader})`));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkNotes();
