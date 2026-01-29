const mongoose = require("mongoose");

const AgentSchema = new mongoose.Schema({
  agentId: { type: String, unique: true },
  name: String,
  location: { type: Object }, // {lat,lng}
  trust: { type: Number, default: 1.0 },
  available: { type: Boolean, default: true },
  lastSeen: Date,
});

module.exports = mongoose.model("Agent", AgentSchema);
