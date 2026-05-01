const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// GET messages for a task
router.get("/messages/:taskId", async (req, res) => {
  try {
    const messages = await Message.find({
      taskId: req.params.taskId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
