const mongoose = require('mongoose');
const Note = require('./models/Note');
const User = require('./models/User');
require('dotenv').config();

async function updateUploaders() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/notesdb';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    const notes = await Note.find({});
    console.log(`Found ${notes.length} notes`);

    for (const note of notes) {
      if (note.uploaderUid) {
        const user = await User.findOne({ firebaseUid: note.uploaderUid });
        if (user && user.username) {
          note.uploader = user.username;
          await note.save();
          console.log(`Updated note ${note._id} uploader to ${user.username}`);
        } else {
          console.log(`No user found for UID ${note.uploaderUid} in note ${note._id}`);
        }
      }
    }

    console.log('Update complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUploaders();
