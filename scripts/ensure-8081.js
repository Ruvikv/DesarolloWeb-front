const { exec, spawn } = require('child_process');

function findAndKill8081Windows() {
  return new Promise((resolve) => {
    exec('netstat -ano | findstr :8081', { shell: true }, (err, stdout) => {
      if (err || !stdout) return resolve();
      const lines = stdout.split(/\r?\n/).filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[3] || parts[2] || '';
        const pid = parts[parts.length - 1];
        if (/LISTEN/i.test(state) && pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
      if (pids.size === 0) return resolve();
      const killers = Array.from(pids).map((pid) => new Promise((res) => {
        exec(`taskkill /PID ${pid} /F`, { shell: true }, () => res());
      }));
      Promise.all(killers).then(() => resolve());
    });
  });
}

async function ensureAndStart() {
  if (process.platform === 'win32') {
    await findAndKill8081Windows();
  }
  const child = spawn('npx', ['expo', 'start', '--web', '--port', '8081'], {
    stdio: 'inherit',
    shell: true,
  });
  child.on('exit', (code) => process.exit(code || 0));
}

ensureAndStart();