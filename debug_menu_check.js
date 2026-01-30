
const path = require('path');
const fs = require('fs');

async function checkMenu() {
    const ownerDir = path.join(__dirname, 'dist', 'commands', 'owner');
    console.log(`Checking directory: ${ownerDir}`);

    const files = fs.readdirSync(ownerDir).filter(file => (file.endsWith('.ts') || file.endsWith('.js')) && !file.startsWith('dev'));
    
    const selectOptions = files.map(file => {
        try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command && cmd.command.name) {
                return {
                    label: cmd.command.name,
                    value: cmd.command.name,
                    // Emoji might be undefined here if config not loaded, but that's fine for checking description
                    description: cmd.command.description // I want to see if I accidentally included it? No, I want to reproduce what the code does.
                };
            }
        } catch (e) { return null; }
    }).filter(opt => opt !== null);

    console.log("--- Generated Options (What the code WOULD generate if logic was 'return { label, value }') ---");
    // This is NOT testing the dev.js code, this is testing my logic.
    // I should require dev.js if I could, but it's not exported.
    
    // Let's manually print what dev.js implies it does:
    const actualOptions = files.map(file => {
         try {
            const cmd = require(path.join(ownerDir, file));
            if (cmd.command && cmd.command.name) {
                // This is the EXACT logic from dev.js (as I believe it is)
                return {
                    label: cmd.command.name,
                    value: cmd.command.name,
                    // emoji: ... 
                };
            }
        } catch (e) { return null; }
    }).filter(o => o);

    console.log(JSON.stringify(actualOptions, null, 2));
}

checkMenu();
