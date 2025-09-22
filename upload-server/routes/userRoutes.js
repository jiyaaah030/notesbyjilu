 const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { verifyFirebaseToken } = require("../middleware/auth");
const User = require("../models/User");
const Note = require("../models/Note");

// ensure local folder exists: /uploads/avatars
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, "..", "uploads", "avatars")),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// create-or-get profile for logged-in user
router.get("/me", verifyFirebaseToken, async (req, res) => {
  let user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) user = await User.create({ firebaseUid: req.user.uid, username: req.user.email.split("@")[0] });
  const sharedNotes = await Note.countDocuments({ uploaderUid: req.user.uid });
  res.json({ ...user.toObject(), counts: { sharedNotes, followers: user.followers.length, following: user.following.length } });
});

// update profile fields
router.patch("/me", verifyFirebaseToken, async (req, res) => {
  const { username, college, profession, bio } = req.body;
  const user = await User.findOneAndUpdate(
    { firebaseUid: req.user.uid },
    { $set: { username, college, profession, bio } },
    { new: true, upsert: true }
  );
  res.json(user);
});

// upload avatar
router.post("/me/avatar", verifyFirebaseToken, upload.single("avatar"), async (req, res) => {
  const url = `/uploads/avatars/${req.file.filename}`;
  const user = await User.findOneAndUpdate(
    { firebaseUid: req.user.uid },
    { $set: { profilePicUrl: url } },
    { new: true, upsert: true }
  );
  res.json(user);
});

// delete avatar
router.delete("/me/avatar", verifyFirebaseToken, async (req, res) => {
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) return res.status(404).json({ error: "User not found" });

  user.profilePicUrl = "/default-profile.png";
  await user.save();
  res.json({ message: "Profile picture deleted", profilePicUrl: user.profilePicUrl });
});

// get notes for this user
router.get("/me/notes", verifyFirebaseToken, async (req, res) => {
  const notes = await Note.find({ uploaderUid: req.user.uid }).sort({ createdAt: -1 });
  res.json(notes);
});

// search users by username
router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query parameter required" });

  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" }
    }).select("username profilePicUrl firebaseUid").limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// get user by firebaseUid
router.get("/:firebaseUid", async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.params.firebaseUid });
    if (!user) return res.status(404).json({ error: "User not found" });

    const sharedNotes = await Note.countDocuments({ uploaderUid: req.params.firebaseUid });
    res.json({ ...user.toObject(), counts: { sharedNotes, followers: user.followers.length, following: user.following.length } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// get user's notes by firebaseUid
router.get("/:firebaseUid/notes", async (req, res) => {
  try {
    const notes = await Note.find({ uploaderUid: req.params.firebaseUid }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// follow a user
router.post("/:firebaseUid/follow", verifyFirebaseToken, async (req, res) => {
  try {
    const targetUid = req.params.firebaseUid;
    const currentUid = req.user.uid;

    if (targetUid === currentUid) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const targetUser = await User.findOne({ firebaseUid: targetUid });
    const currentUser = await User.findOne({ firebaseUid: currentUid });

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    if (currentUser.following.includes(targetUid)) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Add to following and followers
    currentUser.following.push(targetUid);
    targetUser.followers.push(currentUid);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Followed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// unfollow a user
router.delete("/:firebaseUid/follow", verifyFirebaseToken, async (req, res) => {
  try {
    const targetUid = req.params.firebaseUid;
    const currentUid = req.user.uid;

    const targetUser = await User.findOne({ firebaseUid: targetUid });
    const currentUser = await User.findOne({ firebaseUid: currentUid });

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(uid => uid !== targetUid);
    targetUser.followers = targetUser.followers.filter(uid => uid !== currentUid);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

// check follow status
router.get("/:firebaseUid/follow-status", verifyFirebaseToken, async (req, res) => {
  try {
    const targetUid = req.params.firebaseUid;
    const currentUid = req.user.uid;

    const currentUser = await User.findOne({ firebaseUid: currentUid });

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUid);
    res.json({ isFollowing });
  } catch (error) {
    res.status(500).json({ error: "Failed to check follow status" });
  }
});

module.exports = router;
