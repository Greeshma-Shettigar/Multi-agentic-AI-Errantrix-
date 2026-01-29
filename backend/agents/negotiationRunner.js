const { spawn } = require("child_process");
const path = require("path");

const runNegotiationAgent = (bids) => {
  return new Promise((resolve, reject) => {
    const pythonPath = "python"; // or "python3"
    const scriptPath = path.join(
      __dirname,
      "../../python-agents/negotiation_agent.py"
    );
    console.log("🐍 Python agent path:", scriptPath);
    const py = spawn(pythonPath, [scriptPath]);

    let result = "";
    let error = "";

    py.stdin.write(JSON.stringify(bids));
    py.stdin.end();

    py.stdout.on("data", (data) => {
      result += data.toString();
    });

    py.stderr.on("data", (data) => {
      error += data.toString();
    });

    py.on("close", () => {
      if (error) {
        reject(error);
      } else {
        resolve(JSON.parse(result));
      }
    });
  });
};

module.exports = runNegotiationAgent;
