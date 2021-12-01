const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const schema = new mongoose.Schema(
  {
    person: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    marks: { type: Number, default: 0 },
    answer: { type: String },
    checked: { type: Boolean, default: false },
    remark: { type: String },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
schema.index({ person: 1, question: 1 }, { unique: true });
model = mongoose.model("Question_User", schema);
module.exports = model;
