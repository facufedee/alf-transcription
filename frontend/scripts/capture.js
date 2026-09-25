const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function capture(url, outputFilename, delayMs = 6500) {
  return new Promise((resolve) => {
    const outputPath = path.resolve(__dirname, '..', 'public', 'screenshots', outputFilename);
    console.log(`Capturing ${url} -> ${outputPath}...`);

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--window-size=1280,900',
      `--screenshot=${outputPath}`,
      url
    ];

    const proc = spawn(edgePath, args);

    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        console.log(`Success: ${outputFilename} created (${fs.statSync(outputPath).size} bytes)`);
      } else {
        console.log(`Failed: ${outputFilename}`);
      }
      try { proc.kill(); } catch (e) {}
      resolve();
    }, delayMs);
  });
}

async function run() {
  await capture('http://localhost:3000/#autor', 'autor-section.png');
}

run();
