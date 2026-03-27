const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const User = require("../models/User");

router.post("/complaint", async (req, res) => {
  try {
    const { taskName, description, partnerEmail, partnerName, userId } =
      req.body;

    // 🔹 1. Check if task exists for this user
    const task = await Task.findOne({
      title: taskName,
      postedBy: userId,
    }).populate("assignedTo");

    if (!task) {
      return res.status(400).json({
        message: "❌ Invalid Task: Task does not exist.",
      });
    }

    // 🔹 2. Check if task has assigned delivery partner
    if (!task.assignedTo) {
      return res.status(400).json({
        message: "❌ No delivery partner assigned to this task.",
      });
    }

    // 🔹 3. Check delivery partner name + email
    if (
      task.assignedTo.fullName !== partnerName ||
      task.assignedTo.email !== partnerEmail
    ) {
      return res.status(400).json({
        message: "❌ Delivery partner details do not match assigned partner.",
      });
    }

    // 🔹 4. Mark complaint
    task.complaintRaised = true;
    task.complaintDescription = description;

    console.log("Found task:", task);

    await task.save();

    console.log("Saved complaint:", task.complaintRaised);

    // 🔥 Emit complaint event to delivery partner
    req.app.locals.io.emit("complaint_raised", {
      taskId: task._id,
      message: "⚠ Complaint raised against you!",
      assignedTo: task.assignedTo._id.toString(),
    });

    res.json({
      message: "✅ Complaint submitted successfully.",
      taskId: task._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error while submitting complaint.",
    });
  }
});

module.exports = router;
