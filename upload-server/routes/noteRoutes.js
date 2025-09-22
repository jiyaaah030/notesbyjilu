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

    if (!req.user || !req.user.uid || typeof req.user.uid !== 'string') {
      console.error("Invalid user UID:", req.user);
      return res.status(400).json({ error: "Invalid user" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) {
      console.log("Note not found:", req.params.id);
      return res.status(404).json({ error: "Note not found" });
    }

    console.log("Note found:", note.title);

    // Ensure arrays exist and are arrays
    if (!Array.isArray(note.likedBy)) {
      console.log("likedBy is not an array, initializing:", note.likedBy);
      note.likedBy = [];
    }
    if (!Array.isArray(note.dislikedBy)) {
      console.log("dislikedBy is not an array, initializing:", note.dislikedBy);
      note.dislikedBy = [];
    }

    // Ensure likes and dislikes are numbers
    if (typeof note.likes !== 'number') {
      console.log("likes is not a number, setting to 0:", note.likes);
      note.likes = 0;
    }
    if (typeof note.dislikes !== 'number') {
      console.log("dislikes is not a number, setting to 0:", note.dislikes);
      note.dislikes = 0;
    }

    console.log("Current likes:", note.likes, "dislikes:", note.dislikes);
    console.log("Liked by:", note.likedBy.length, "users");
    console.log("Disliked by:", note.dislikedBy.length, "users");

    let updateQuery = {};
    let likesChange = 0;
    let dislikesChange = 0;

    // Check if user has already disliked this note
    if (note.dislikedBy.includes(req.user.uid)) {
      // Remove dislike and add like
      dislikesChange = -1;
      likesChange = 1;
      updateQuery = {
        $inc: { dislikes: dislikesChange, likes: likesChange },
        $pull: { dislikedBy: req.user.uid },
        $push: { likedBy: req.user.uid }
      };
      console.log("Switched from dislike to like");
    } else if (note.likedBy.includes(req.user.uid)) {
      // User already liked, remove like
      likesChange = -1;
      updateQuery = {
        $inc: { likes: likesChange },
        $pull: { likedBy: req.user.uid }
      };
      console.log("Removed like");
    } else {
      // New like
      likesChange = 1;
      updateQuery = {
        $inc: { likes: likesChange },
        $push: { likedBy: req.user.uid }
      };
      console.log("Added new like");
    }

    await Note.updateOne({ _id: req.params.id }, updateQuery);

    const updatedNote = await Note.findById(req.params.id);
    console.log("Final likes:", updatedNote.likes, "dislikes:", updatedNote.dislikes);
    res.json({ likes: updatedNote.likes, dislikes: updatedNote.dislikes });
  } catch (error) {
    console.error("Error in like route:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// dislike a note (mutually exclusive with like)
router.post("/:id/dislike", verifyFirebaseToken, async (req, res) => {
  try {
    console.log("Dislike request for note ID:", req.params.id);
    console.log("User UID:", req.user.uid);

    if (!req.user || !req.user.uid || typeof req.user.uid !== 'string') {
      console.error("Invalid user UID:", req.user);
      return res.status(400).json({ error: "Invalid user" });
    }

    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: "Note not found" });

    console.log("Note found:", note.title);

    // Ensure arrays exist and are arrays
    if (!Array.isArray(note.likedBy)) {
      console.log("likedBy is not an array, initializing:", note.likedBy);
      note.likedBy = [];
    }
    if (!Array.isArray(note.dislikedBy)) {
      console.log("dislikedBy is not an array, initializing:", note.dislikedBy);
      note.dislikedBy = [];
    }

    // Ensure likes and dislikes are numbers
    if (typeof note.likes !== 'number') {
      console.log("likes is not a number, setting to 0:", note.likes);
      note.likes = 0;
    }
    if (typeof note.dislikes !== 'number') {
      console.log("dislikes is not a number, setting to 0:", note.dislikes);
      note.dislikes = 0;
    }

    console.log("Current likes:", note.likes, "dislikes:", note.dislikes);
    console.log("Liked by:", note.likedBy.length, "users");
    console.log("Disliked by:", note.dislikedBy.length, "users");

    let updateQuery = {};
    let likesChange = 0;
    let dislikesChange = 0;

    // Check if user has already liked this note
    if (note.likedBy.includes(req.user.uid)) {
      // Remove like and add dislike
      likesChange = -1;
      dislikesChange = 1;
      updateQuery = {
        $inc: { likes: likesChange, dislikes: dislikesChange },
        $pull: { likedBy: req.user.uid },
        $push: { dislikedBy: req.user.uid }
      };
      console.log("Switched from like to dislike");
    } else if (note.dislikedBy.includes(req.user.uid)) {
      // User already disliked, remove dislike
      dislikesChange = -1;
      updateQuery = {
        $inc: { dislikes: dislikesChange },
        $pull: { dislikedBy: req.user.uid }
      };
      console.log("Removed dislike");
    } else {
      // New dislike
      dislikesChange = 1;
      updateQuery = {
        $inc: { dislikes: dislikesChange },
        $push: { dislikedBy: req.user.uid }
      };
      console.log("Added new dislike");
    }

    await Note.updateOne({ _id: req.params.id }, updateQuery);

    const updatedNote = await Note.findById(req.params.id);
    console.log("Final likes:", updatedNote.likes, "dislikes:", updatedNote.dislikes);
    res.json({ likes: updatedNote.likes, dislikes: updatedNote.dislikes });
  } catch (error) {
    console.error("Error in dislike route:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
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
