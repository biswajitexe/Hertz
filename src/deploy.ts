import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

console.log("Current working directory:", process.cwd());
const envPath = path.join(process.cwd(), '.env');
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath, debug: true });

import { log } from './logging';

const token = (process.env.DISCORD_TOKEN as string)?.trim();
const clientId = process.env.CLIENT_ID as string;

const rest = new REST({ version: '10' }).setToken(token);

let commands: any[] = [];
log('Started refreshing application p{[/]} commands.');



function deploy(dir: string) {
    const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const data = require(path.join(dir, file));
        commands.push(data.command.toJSON())
    }

    const commandFolders = fs.readdirSync(dir)
        .filter(file => fs.lstatSync(path.join(dir, file)).isDirectory());

    for (const commandFolder of commandFolders) {
        deploy(path.join(dir, commandFolder));
    }
}


(async () => {
    try {
        if (!token) {
            throw new Error("DISCORD_TOKEN is missing in environment variables.");
        }
        if (!clientId) {
            throw new Error("CLIENT_ID is missing in environment variables.");
        }

        deploy(path.join(__dirname, 'commands'));

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        log('Successfully reloaded application p{[/]} commands.');
    } catch (error) {
        console.error(error);
    }
})();
