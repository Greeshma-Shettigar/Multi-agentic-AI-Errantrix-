const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    budget: { type: Number, required: true },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 TASK STATUS FLOW
    // open → planned → negotiating → assigned → completed
    status: {
      type: String,
      enum: ["open", "planned", "negotiating", "assigned", "completed"],
      default: "planned",
    },

    // 🔹 REQUESTER AGENT OUTPUT
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH"],
      default: "NORMAL",
    },

    // 🔹 NEGOTIATION / BIDDING
    bids: [
      {
        agentId: {
          type: String, // keeping STRING so existing logic doesn't break
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        eta: {
          type: Number, // minutes
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 🔹 ASSIGNMENT
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // keeping User to avoid breaking current accept flow
      default: null,
    },

    // 🔹 OPTIONAL (future monitoring / routing agent)
    negotiationStatus: {
      type: String,
      enum: ["none", "in_progress", "completed"],
      default: "none",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);
