const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    // 🔥 GEO-FENCING SUPPORT (UPDATED)
    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    dropLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    radius: {
      type: Number,
      default: 5000, // 5km default geo-fence
    },

    budget: { type: Number, required: true },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 TASK STATUS FLOW
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
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        eta: {
          type: Number,
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
      ref: "User",
      default: null,
    },

    negotiationStatus: {
      type: String,
      enum: ["none", "in_progress", "completed"],
      default: "none",
    },
  },
  { timestamps: true },
);

// 🔥 Add 2dsphere index for geo queries
TaskSchema.index({ pickupLocation: "2dsphere" });

module.exports = mongoose.model("Task", TaskSchema);
