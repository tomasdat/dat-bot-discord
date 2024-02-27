const { Events } = require("discord.js");

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token, guildId, inviteCode, roleId } = require('./config.json');

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildInvites
	]
});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);

// Assuming 'client' is your Discord Client
var inviteUses = 0; // This will store the number of invite uses

client.once('ready', async () => {
	// Fetch the invite
	inviteUses = await fetchInviteUses(client);
});

client.on(Events.GuildMemberAdd, async (member) => { // when a new member joins, check if they used the invite
	try {
		console.log(inviteUses); // 0
		const client2 = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildInvites
			]
		});

		client2.login(token);
		
		const updatedUses = await fetchInviteUses(client2);
		console.log(updatedUses);

		if (updatedUses > inviteUses) { // should increase inviteUses by 1
			inviteUses = updatedUses;
			await giveRole(member);
		}
	}
	catch (error) {
		console.error('Failed to fetch invite: ', error);
	}
});

async function fetchInviteUses (client) {
	const guild = await client.guilds.fetch(guildId);
	if (!guild) {
		console.log('Not in the right guild');
		return;
	}
	try {
		const invite = await guild.invites.fetch(inviteCode);
		return invite.uses;
	}
	catch (error) {
		console.error('Failed to fetch invite: ', error);
		return;
	}
}

async function giveRole (member) {
	member.roles.add(roleId);
}