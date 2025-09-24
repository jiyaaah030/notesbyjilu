
const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// GET all notes
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    let query = Note.find();

    // Apply limit if provided
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const notes = await query.sort({ year: -1, semester: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
