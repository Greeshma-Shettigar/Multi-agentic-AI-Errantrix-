const express = require("express");
const router = express.Router();
const Agent = require("../models/Agent");
const Task = require("../models/Task");
const helperAgent = require("../agents/helperAgent");
const runNegotiationAgent = require("../agents/negotiationRunner");
const mongoose = require("mongoose");

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

router.post("/register", async (req, res) => {
  const a = await Agent.findOneAndUpdate(
    { agentId: req.body.agentId },
    req.body,
    { upsert: true, new: true },
  );
  res.json(a);
});

// 🔥 Update helper live location
router.post("/update-location", async (req, res) => {
  try {
    const { agentId, latitude, longitude } = req.body;

    if (!agentId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing data" });
    }

    const updatedAgent = await Agent.findOneAndUpdate(
      { agentId },
      {
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      },
      { new: true },
    );

    if (!updatedAgent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    res.json(updatedAgent);
  } catch (err) {
    console.error("UPDATE LOCATION ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/bid", async (req, res) => {
  try {
    console.log("🔥 BID API HIT 🔥", req.body);

    // { agentId, taskId, price, eta }
    const { agentId, taskId, price, eta } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // ❌ No bidding if task already finished
    if (["assigned", "completed"].includes(task.status)) {
      return res.status(400).json({
        message: "Task is no longer available for bidding",
      });
    }

    // 🔥 NEW: Helper Agent availability + feasibility check
    const helperDecision = await helperAgent(task, { agentId });
    console.log("Calling Helper Agent...");
    if (!helperDecision.allowed) {
      return res.status(400).json({
        message: helperDecision.reason,
      });
    }
    // 🔁 First bid → move to negotiating
    if (task.status === "planned") {
      task.status = "negotiating";
      task.negotiationStatus = "in_progress";
    }

    const alreadyBid = task.bids.find((b) => b.agentId === agentId);

    if (alreadyBid) {
      return res.status(400).json({
        message: "You have already placed a bid for this task.",
      });
    }

    // 📝 Add bid
    task.bids.push({
      agentId,
      price: Number(price),
      eta: Number(eta),
    });

    await task.save();
    //req.app.locals.io.emit("task_assigned", task);

    // 🔔 Realtime update (UI)
    req.app.locals.io.emit("new_bid", {
      taskId,
      agentId,
      price,
      eta,
    });

    // 🤖 AUTO-NEGOTIATION (when 2 or more bids)
    if (task.bids.length >= 2 && task.status === "negotiating") {
      console.log("🤖 Negotiation Agent Triggered");

      const winner = await runNegotiationAgent(task.bids);

      if (winner && winner.agentId) {
        task.assignedTo = new mongoose.Types.ObjectId(winner.agentId);
        task.status = "assigned";
       task.negotiationStatus = "completed";
       task.assignedAt = new Date(); 
       console.log("✅ assignedAt set:", task.assignedAt);

        // 🔐 Generate OTP here
        task.otpCode = generateOTP();
        task.deliveryConfirmed = false;
        task.userConfirmed = false;

        await task.save();
        req.app.locals.io.emit("task_assigned", task);
        console.log("🏆 Task assigned to:", winner.agentId);
        console.log("🔐 Generated OTP:", task.otpCode);
        return res.json({
          message: "Negotiation completed, task assigned",
          winner,
          task,
        });
      }
    }

    // ⏳ Waiting for more bids
    res.json({
      message: "Bid placed successfully, waiting for more bids",
      task,
    });
  } catch (err) {
    console.error("BID ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/user-decision", async (req, res) => {
  const { taskId, decision } = req.body;

  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  // ✅ USER GIVES EXTRA TIME
  if (decision === "allow") {
    task.assignedAt = new Date();
    task.warningSent = false;
    task.graceUsed = true;
    task.userDecisionAsked = false;

    await task.save();

    req.app.locals.io.emit("extra_time_granted", {
      taskId: task._id,
      assignedTo: task.assignedTo?.toString(),
      message: "🎉 You’ve been given extra time!",
    });

    return res.json({ message: "Extra time granted" });
  }

  // 🔥 HELPER IGNORE OR USER REASSIGN → SAME RESULT
  if (decision === "helper_reject" || decision === "user_reassign") {
    console.log("🔄 REOPENING TASK FOR BIDDING");

    task.status = "planned"; // 🔥 VERY IMPORTANT
    task.assignedTo = null;

    task.assignedAt = null;
    task.warningSent = false;
    task.graceUsed = false;
    task.userDecisionAsked = false;

    task.bids = []; // fresh bidding

    await task.save();

    req.app.locals.io.emit("task_reassigned", {
      taskId: task._id,
      message: "🔄 Task reopened for bidding",
    });

    return res.json({ message: "Task reopened for bidding" });
  }

  res.status(400).json({ message: "Invalid decision" });
});

router.post("/bid-check", async (req, res) => {
  const { agentId, taskId } = req.body;

  const activeTask = await Task.findOne({
    assignedTo: new mongoose.Types.ObjectId(agentId),
    status: "assigned",
  });

  if (activeTask) {
    return res.json({
      allowed: false,
      message: "You already have a task assigned.",
    });
  }

  res.json({ allowed: true });
});

router.post("/grace", async (req, res) => {
  try {
    const { taskId, minutes } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 🔥 Extend time
  task.assignedAt = new Date(Date.now() + minutes * 60000);

    // Reset warning
    task.warningSent = false;
    task.warningAt = null;
    task.graceUsed = true;

    await task.save();

    res.json({ message: "Grace time added" });
  } catch (err) {
     console.error("GRACE ERROR ❌", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/list", async (req, res) => {
  const agents = await Agent.find().lean();
  res.json(agents);
});

// Helper accepts task
router.post("/accept/:taskId", async (req, res) => {
  try {
    const { helperId } = req.body;

    // 1️⃣ Check helper exists
    const helper = await Agent.findOne({ agentId: helperId });
    if (!helper) {
      return res.status(404).json({ message: "Helper not found" });
    }

    // 2️⃣ Check if helper already has assigned task
    const existingTask = await Task.findOne({
      assignedTo: helperId,
      status: "assigned",
    });

    if (existingTask) {
      return res.status(400).json({
        message: "You already have an assigned task",
      });
    }

    // 3️⃣ Get task
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 4️⃣ Ensure task is available
    if (task.status !== "planned") {
      return res.status(400).json({
        message: "Task is not available for assignment",
      });
    }

    const isValidStatusTransition = (from, to) => {
      const allowed = {
        open: ["planned"],
        planned: ["negotiating", "assigned"],
        negotiating: ["assigned"],
        assigned: ["completed"],
      };

      return allowed[from]?.includes(to);
    };

    // 5️⃣ Let Helper Agent decide (business logic stays here)
    const updatedTask = helperAgent(task, helper);

    // 🔐 Force correct final state (important)
    if (updatedTask.status !== "assigned") {
      return res.status(400).json({
        message: "Task rejected by Helper Agent",
      });
    }

    // 6️⃣ Save
    await updatedTask.save();

    res.json(updatedTask);
  } catch (err) {
    console.error("ACCEPT TASK ERROR ❌", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
