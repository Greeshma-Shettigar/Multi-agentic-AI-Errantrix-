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
const monitoringAgent = require("./agents/monitoringAgent");
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// expose io to routes via app.locals
app.locals.io = io;

// === ROUTES REGISTRATION ===
app.use("/api/tasks", taskRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/auth", authRoute); // <-- CRITICAL FIX: Auth route registered here

setInterval(() => {
  monitoringAgent();
}, 30000);
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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server listening ${PORT}`));
