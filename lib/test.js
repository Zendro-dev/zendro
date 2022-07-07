const { spawn } = require("child_process");
const {spawn_console} = require("../helper");

const subprocess = spawn('cp',["test.js", "test2.js"], {shell:true});
subprocess.stdout.pipe(process.stdout);

subprocess.on('error', (err) => {
  console.error('Failed to start subprocess.');
});
