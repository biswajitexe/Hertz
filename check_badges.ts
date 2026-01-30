
import { Database } from "./src/database";
import 'dotenv/config';

async function checkBadges() {
    console.log("Connecting to database...");
    const db = new Database();
    
    // Allow connection time
    await new Promise(r => setTimeout(r, 2000));

    const config = await db.getBotConfig();
    
    console.log("\n--- Current Badge Holders ---");
    
    console.log("\n[Owner]");
    console.log(process.env.OWNER_ID || "Not Set in .env");

    console.log("\n[Premium Users]");
    if (config.premiumUsers && config.premiumUsers.length > 0) {
        console.log(config.premiumUsers.join(", "));
    } else {
        console.log("None");
    }

    console.log("\n[Staff Users]");
    if (config.staffUsers && config.staffUsers.length > 0) {
        console.log(config.staffUsers.join(", "));
    } else {
        console.log("None");
    }

    console.log("\n[No Prefix Users]");
    if (config.noPrefixUsers && config.noPrefixUsers.length > 0) {
        console.log(config.noPrefixUsers.join(", "));
    } else {
        console.log("None");
    }

    process.exit(0);
}

checkBadges();
