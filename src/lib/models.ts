import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, required: true },
  username: { type: String, default: "New User" },
  college: { type: String, default: "" },
  profession: { type: String, default: "" },
  bio: { type: String, default: "" },
  profilePicUrl: { type: String, default: "/default-profile.png" },
  followers: [{ type: String }],
  following: [{ type: String }],
}, { timestamps: true });

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  uploader: { type: String, required: true },
  uploaderUid: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  subject: { type: String, required: true },
  fileUrl: { type: String, required: true },
  description: { type: String, default: "" },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  dislikedBy: [{ type: String }],
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Note = mongoose.models.Note || mongoose.model("Note", NoteSchema);
