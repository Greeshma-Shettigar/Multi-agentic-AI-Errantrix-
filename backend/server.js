const dotenv = require("dotenv");
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Task = require("./models/Task");



// Routes
const taskRoutes = require("./routes/tasks");
const agentRoutes = require("./routes/agents");
const authRoute = require("./routes/auth"); // Auth route imported
const complaintRoutes = require("./routes/complaint"); 
const monitoringAgent = require("./agents/monitoringAgent");
const messageRoutes = require("./routes/messageRoutes");
const Message = require("./models/Message");
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });




app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", messageRoutes);

// expose io to routes via app.locals
app.locals.io = io;

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  // ✅ Join personal room (for receiving messages anytime)
  socket.on("join_user", (userId) => {
    socket.join(userId);
    console.log("👤 Joined user room:", userId);
  });

  // ✅ Join task room (when chat is opened)
  socket.on("join_task_room", (taskId) => {
    socket.join(taskId);
    console.log("📌 Joined task room:", taskId);
  });

  // 💬 SEND MESSAGE
  socket.on("send_message", async (data) => {
    const { taskId, senderId, receiverId, text } = data;

    try {
      // ✅ 1. SAVE TO DB (PERSISTENCE)
      const message = await Message.create({
        taskId,
        senderId,
        receiverId,
        text,
      });

      // ✅ 2. SEND TO TASK ROOM (live chat open users)
      io.to(taskId).emit("receive_message", message);

      // ✅ 3. SEND TO RECEIVER PERSONAL ROOM (even if chat closed)
      io.to(receiverId).emit("receive_message", message);

      // ✅ 4. SEND BACK TO SENDER (instant UI update)
      socket.emit("receive_message", message);
    } catch (err) {
      console.error("❌ Message error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

// === ROUTES REGISTRATION ===
app.use("/api/tasks", taskRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/auth", authRoute); // <-- CRITICAL FIX: Auth route registered here
app.use("/api/user", complaintRoutes);


// connect mongo
// Note: useUnifiedTopology and useNewUrlParser are deprecated/defaulted in newer Mongoose versions,
// but they won't hurt if you keep them.
const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/marketplace";
mongoose.set("autoIndex", true);
mongoose
  .connect(MONGO)
  .then(async () => {
    console.log("Mongo connected");

    // 🔥 FORCE INDEX CREATION
    await Task.syncIndexes();
    console.log("Indexes synced");
  })
  .catch((err) => console.error(err));

  setInterval(() => {
  monitoringAgent(io);
}, 30000); // every 30 sec

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening ${PORT}`));
