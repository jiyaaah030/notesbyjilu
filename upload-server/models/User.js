const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, index: true, required: true },
  username: { type: String, default: "New User" },
  college: { type: String, default: "" },
  profession: { type: String, default: "" },
  bio: { type: String, default: "" },
  profilePicUrl: { type: String, default: "/default-profile.png" },
  followers: [{ type: String }], // store other users' firebaseUid
  following: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
