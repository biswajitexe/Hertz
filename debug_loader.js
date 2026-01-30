
const path = require('path');
const fs = require('fs');

const ownerDir = path.join(__dirname, 'dist', 'commands', 'owner');
console.log(`Checking directory: ${ownerDir}`);

if (!fs.existsSync(ownerDir)) {
    console.error("Directory does not exist!");
    process.exit(1);
}

const files = fs.readdirSync(ownerDir);
console.log("Files found:", files);

const targetFile = 'botrole.js';
const filePath = path.join(ownerDir, targetFile);

console.log(`\nAttempting to require ${targetFile}...`);
try {
    const cmd = require(filePath);
    console.log("Success!");
    console.log("Exports keys:", Object.keys(cmd));
    if (cmd.command) {
        console.log("Command Name:", cmd.command.name);
    } else {
        console.error("Missing 'command' export.");
    }
} catch (error) {
    console.error("FAILED to load file:");
    console.error(error);
}
