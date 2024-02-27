const { Events } = require('discord.js');
const { guildId, inviteCode } = require('../config.json');

module.exports = {
	name: Events.ClientReady,
	once: true,
	id: 'getInvite',
	async execute(client) {
		const guild = client.guilds.cache.get(guildId);
		if (!guild) {
			console.log('Not in the right guild');
			return;
		}

		try {
			const invite = await guild.invites.fetch(inviteCode);
			console.log(invite.uses);
			return invite.uses;
		}
		catch (error) {
			console.error('Failed to fetch invite: ', error);
			return;
		}
	},
};