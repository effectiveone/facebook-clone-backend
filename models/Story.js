const mongoose = require("mongoose");

const { ObjectId } = mongoose.Schema;

const storySchema = mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["photo", "text"],
      required: true,
    },
    text: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    background: {
      type: String,
      default: "#1877f2",
    },
    views: [
      {
        type: ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Stories automatically expire after 24 hours
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Story", storySchema);
