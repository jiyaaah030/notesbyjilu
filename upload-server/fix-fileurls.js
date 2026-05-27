const mongoose = require('mongoose');
const Note = require('./models/Note');

async function fixFileUrls() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notesbyjilu';
  await mongoose.connect(uri);
  
  // Set a default uploader UID if none is provided (legacy notes cleanup)
  const defaultUploaderUid = process.env.DEFAULT_UPLOADER_UID || 'legacy-user';
  
  const notes = await Note.find({ $or: [{ fileUrl: { $exists: false } }, { fileUrl: null }] });
  console.log('Found', notes.length, 'notes with missing fileUrl');

  let updated = 0;
  let skipped = 0;
  for (const n of notes) {
    // Populate missing uploaderUid with default (legacy note recovery)
    if (!n.uploaderUid) {
      console.log('Setting default uploaderUid for note', n._id);
      n.uploaderUid = defaultUploaderUid;
    }
    
    if (n.filename) {
      n.fileUrl = `/uploads/${n.filename}`;
      await n.save();
      updated++;
      console.log('Updated note', n._id, '->', n.fileUrl);
    } else {
      console.log('Skipping note', n._id, '- no filename present');
      skipped++;
    }
  }

  console.log(`Done. Updated ${updated} notes, skipped ${skipped} notes.`);
  process.exit(0);
}

fixFileUrls().catch(err => {
  console.error(err);
  process.exit(1);
});
