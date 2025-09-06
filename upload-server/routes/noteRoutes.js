const express = require("express");
const router = express.Router();
const { verifyFirebaseToken } = require("../middleware/auth");
const Note = require("../models/Note");

// delete note owned by user
router.delete("/:id", verifyFirebaseToken, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ error: "Not found" });
  if (note.uploaderUid !== req.user.uid) return res.status(403).json({ error: "Forbidden" });
  await note.deleteOne();
  res.json({ ok: true });
});

// single note (for clickable card)
router.get("/:id", async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ error: "Not found" });
  res.json(note);
});

// like a note (mutually exclusive with dislike)
router.post("/:id/like", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("Like request for note ID:", req.params.id);
    console.log("User UID:", req.user.uid);

    const note = await Note.findById(req.params.id);
    if (!note) {
      console.log("Note not found:", req.params.id);
      return res.status(404).json({ error: "Note not found" });
    }

    console.log("Note found:", note.title);

    // Ensure arrays exist
    if (!note.likedBy) note.likedBy = [];
    if (!note.dislikedBy) note.dislikedBy = [];

    console.log("Current likes:", note.likes, "dislikes:", note.dislikes);
    console.log("Liked by:", note.likedBy.length, "users");
    console.log("Disliked by:", note.dislikedBy.length, "users");

    // Check if user has already disliked this note
    if (note.dislikedBy.includes(req.user.uid)) {
      // Remove dislike and add like
      note.dislikes = Math.max(0, note.dislikes - 1);
      note.dislikedBy = note.dislikedBy.filter(uid => uid !== req.user.uid);
      note.likes += 1;
      note.likedBy.push(req.user.uid);
      console.log("Switched from dislike to like");
    } else if (note.likedBy.includes(req.user.uid)) {
      // User already liked, remove like
      note.likes = Math.max(0, note.likes - 1);
      note.likedBy = note.likedBy.filter(uid => uid !== req.user.uid);
      console.log("Removed like");
    } else {
      // New like
      note.likes += 1;
      note.likedBy.push(req.user.uid);
      console.log("Added new like");
    }

    await note.save();
    console.log("Final likes:", note.likes, "dislikes:", note.dislikes);
    res.json({ likes: note.likes, dislikes: note.dislikes });
  } catch (error) {
    console.error("Error in like route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// dislike a note (mutually exclusive with like)
router.post("/:id/dislike", verifyFirebaseToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    // Ensure arrays exist
    if (!note.likedBy) note.likedBy = [];
    if (!note.dislikedBy) note.dislikedBy = [];

    // Check if user has already liked this note
    if (note.likedBy.includes(req.user.uid)) {
      // Remove like and add dislike
      note.likes = Math.max(0, note.likes - 1);
      note.likedBy = note.likedBy.filter(uid => uid !== req.user.uid);
      note.dislikes += 1;
      note.dislikedBy.push(req.user.uid);
    } else if (note.dislikedBy.includes(req.user.uid)) {
      // User already disliked, remove dislike
      note.dislikes = Math.max(0, note.dislikes - 1);
      note.dislikedBy = note.dislikedBy.filter(uid => uid !== req.user.uid);
    } else {
      // New dislike
      note.dislikes += 1;
      note.dislikedBy.push(req.user.uid);
    }

    await note.save();
    res.json({ likes: note.likes, dislikes: note.dislikes });
  } catch (error) {
    console.error("Error in dislike route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// update note owned by user
router.patch("/:id", verifyFirebaseToken, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });
    if (note.uploaderUid !== req.user.uid) return res.status(403).json({ error: "Forbidden" });

    const { title, filename, year, semester, subject, description } = req.body;
    if (title !== undefined) note.title = title;
    if (filename !== undefined) note.filename = filename;
    if (year !== undefined) note.year = year;
    if (semester !== undefined) note.semester = semester;
    if (subject !== undefined) note.subject = subject;
    if (description !== undefined) note.description = description;

    await note.save();
    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
