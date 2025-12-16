#!/usr/bin/env node

/**
 * Server startup script with auto-restart on crash
 * This ensures the server keeps running even if it crashes
 */

const { spawn } = require('child_process');
const path = require('path');

let serverProcess;
let restartCount = 0;
const MAX_RESTARTS = 5;
const RESTART_DELAY = 3000; // 3 seconds

function startServer() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Starting server... (attempt ${restartCount + 1})`);
  console.log(`${'='.repeat(60)}\n`);

  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  serverProcess.on('exit', (code, signal) => {
    console.error(`\n❌ Server exited with code ${code} (signal: ${signal})`);
    
    restartCount++;
    
    if (restartCount < MAX_RESTARTS) {
      console.log(`⏳ Restarting server in ${RESTART_DELAY}ms...\n`);
      setTimeout(startServer, RESTART_DELAY);
    } else {
      console.error(`❌ Server crashed ${MAX_RESTARTS} times. Giving up.`);
      process.exit(1);
    }
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });
}

// Handle signals to gracefully shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Start the server
startServer();
