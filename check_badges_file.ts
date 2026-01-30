
import { Database } from "./src/database";
import 'dotenv/config';
import * as fs from 'fs';

async function checkBadges() {
    try {
        const db = new Database();
        
        // Allow connection time
        await new Promise(r => setTimeout(r, 2000));

        const config = await db.getBotConfig();
        
        let output = "--- Current Badge Holders ---\n";
        
        output += "\n[Owner]\n";
        output += (process.env.OWNER_ID || "Not Set in .env") + "\n";

        output += "\n[Premium Users]\n";
        if (config.premiumUsers && config.premiumUsers.length > 0) {
            output += config.premiumUsers.join(", ") + "\n";
        } else {
            output += "None\n";
        }

        output += "\n[Staff Users]\n";
        if (config.staffUsers && config.staffUsers.length > 0) {
            output += config.staffUsers.join(", ") + "\n";
        } else {
            output += "None\n";
        }

        output += "\n[No Prefix Users]\n";
        if (config.noPrefixUsers && config.noPrefixUsers.length > 0) {
            output += config.noPrefixUsers.join(", ") + "\n";
        } else {
            output += "None\n";
        }

        fs.writeFileSync('badges_output.txt', output);
        console.log("Output written to badges_output.txt");
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('badges_output.txt', "Error: " + e);
        process.exit(1);
    }
}

checkBadges();
