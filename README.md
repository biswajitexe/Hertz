# Hertz

A moderation bot with the aim of being efficient and easy to setup.

## Features
* **Raid and nuke protection** - Protect your server with automated anti-nuke/raid systems or manual commands.
* **Fast auto-moderation** - Automatically delete spam, nsfw messages, links, and discord invites.
* **Highly configurable strike system** - Configure custom punishments for members that trigger on `x` amount of strikes.
* **Basic moderation commands** - Basic moderation commands with hierarchy-based moderation.

### Raid and nuke protection
* Webhooks cannot be created, and will be deleted by the bot immediately (unless unsafe mode is enabled).
* Unsafe mode can enabled on with the `unsafe` command, which will suppress all the bot's systems (apart from message filters) for two minutes. Unsafe mode cannot be enabled if anti raid mode is on.
* All events are logged, and if any event surpasses the rate limit (3 of the same event within 2.5 seconds), the server is put into anti-raid mode.

**Running the antiraid command does the following things:**
• Ban any new members that try to join while anti-raid mode is enabled, and unban them afterwards.
• Constantly look for any duplicate roles/channels/categories and deletes them.

### Fast auto-moderation
You can configure the bot to delete messages that contain links, spam (repeated characters, mention spam, etc), blacklisted words, discord invites.

### Highly configurable strike system
Strikes are essentially warnings, and people with the `MANAGE_MEMBERS` permission can use the `strike` command to give any amount of strikes to a user.
You can configure actions to be performed when a user reaches a certain amount of strikes, currently supported actions are: `timeout`, `kick` and `ban`

### Basic Moderation
The bot has a system of hierarchy based moderation, which allows members of higher position to moderate members of (relatively) lower position, even though both members are moderators. The basic moderation commands available in the bot are: `ban`, `unban`, `kick`, `timeout`, `strike`, `strikes` and `relax`.
> _Moderators_ are people who can run moderation commands in a server.

## Using the Code
### Prequisites
- [NodeJS ^1.17.1](https://nodejs.org/en/)
- TypeScript - `npm install typescript`
- Discord.js - `npm install discord.js`

After installing all the required dependencies, put your bot's token (along with some additional data) in `src/config.json`.

### Running
Go into your terminal and run the following commands:
```bash
cd path/to/project
npm run build
npm start
```
