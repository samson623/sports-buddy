#!/usr/bin/env node

const { exec } = require('child_process');
const os = require('os');

const PORT = 3000;
const isWindows = os.platform() === 'win32';

function killPort() {
  return new Promise((resolve, reject) => {
    if (isWindows) {
      // Windows command to kill process on port 3000
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout, stderr) => {
        if (error || !stdout) {
          console.log(`✓ Port ${PORT} is available`);
          resolve();
          return;
        }

        // Extract PID from output
        const match = stdout.match(/\s+(\d+)\s*$/m);
        if (match && match[1]) {
          const pid = match[1];
          exec(`taskkill /PID ${pid} /F`, (killError) => {
            if (killError) {
              console.warn(`⚠ Could not kill process ${pid}: ${killError.message}`);
            } else {
              console.log(`✓ Killed process ${pid} on port ${PORT}`);
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    } else {
      // Unix/Linux/Mac command to kill process on port
      exec(`lsof -i :${PORT} | grep LISTEN | awk '{print $2}' | xargs kill -9`, (error) => {
        if (error && error.code !== 1) {
          console.warn(`⚠ Could not kill process on port ${PORT}`);
        } else if (!error) {
          console.log(`✓ Killed process on port ${PORT}`);
        } else {
          console.log(`✓ Port ${PORT} is available`);
        }
        resolve();
      });
    }
  });
}

killPort()
  .catch(err => {
    console.error(`✗ Error: ${err.message}`);
    process.exit(1);
  });
