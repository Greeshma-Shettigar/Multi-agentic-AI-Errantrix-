const mongoose = require("mongoose");

const AgentSchema = new mongoose.Schema({
  agentId: { type: String, unique: true },

  name: String,

  // 🔥 Proper GeoJSON Location (required for geo queries)
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },

  trust: { type: Number, default: 1.0 },

  available: { type: Boolean, default: true },

  lastSeen: { type: Date, default: Date.now },
});

// 🔥 Required for geospatial queries
AgentSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Agent", AgentSchema);
