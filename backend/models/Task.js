const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    // 🔥 HUMAN READABLE ADDRESSES
    pickupAddress: {
      type: String,
      required: true,
    },

    dropAddress: {
      type: String,
      required: true,
    },

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
      default: 12000, // 12km default geo-fence
    },

    

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
        lat: Number,
        lng: Number,
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

    assignedAt: {
      type: Date,
    },

    negotiationStatus: {
      type: String,
      enum: ["none", "in_progress", "completed"],
      default: "none",
    },
    otpCode: {
      type: String,
    },

    graceUsed: {
      type: Boolean,
      default: false,
    },

    deliveryConfirmed: {
      type: Boolean,
      default: false,
    },

    userConfirmed: {
      type: Boolean,
      default: false,
    },

    complaintRaised: {
      type: Boolean,
      default: false,
    },

    complaintDescription: {
      type: String,
    },

    warningSent: {
      type: Boolean,
      default: false,
    },
    warningAt: {
      type: Date,
    },
    userDecisionAsked: {
      type: Boolean,
      default: false,
    },

    priorityMode: {
      type: Boolean,
      default: false,
    },

    mode: {
      type: String,
      enum: ["normal", "priority"],
      default: "normal",
    },

    assignedDistance: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true },
);

// 🔥 Add 2dsphere index for geo queries
TaskSchema.index({ pickupLocation: "2dsphere" });

module.exports = mongoose.model("Task", TaskSchema);
