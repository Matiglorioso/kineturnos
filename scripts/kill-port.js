const { execSync } = require("child_process");

const PORT = process.env.PORT || "3000";

function killPort(port) {
  try {
    const output = execSync(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }
    );

    const pids = new Set();

    output.split(/\r?\n/).forEach((line) => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) {
        pids.add(pid);
      }
    });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // Process may have already exited.
      }
    });

    if (pids.size === 0) {
      console.log(`Port ${port} is free`);
    }
  } catch {
    console.log(`Port ${port} is free`);
  }
}

killPort(PORT);
