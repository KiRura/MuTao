import {
	type APIEmbed,
	type APIEmbedField,
	ApplicationCommandType,
	type JSONEncodable,
} from "discord.js";
import ping from "ping";
import type { Command } from "./index.ts";

export default {
	data: {
		type: ApplicationCommandType.ChatInput,
		name: "ping",
		description: "Ping!",
	},
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const fields: APIEmbedField[] = [
			{
				name: "WebSocket",
				value: `${interaction.client.ws.ping} ms`,
				inline: true,
			},
			{ name: "API Endpoint", value: "Calculating...", inline: true },
			{ name: "Ping one.one.one.one", value: "Waiting...", inline: true },
		];

		const embed: APIEmbed | JSONEncodable<APIEmbed> = {
			title: "Pong!",
			fields,
		};

		await interaction.reply({
			embeds: [embed],
		});

		const endpointLatency =
			(await interaction.fetchReply()).createdTimestamp -
			interaction.createdTimestamp;
		const cloudflarePing = await ping.promise.probe("one.one.one.one");

		if (fields[1] && fields[2]) {
			fields[1].value = `${endpointLatency} ms`;
			fields[2].value = `${cloudflarePing.time} ms`;
		}

		await interaction.editReply({ embeds: [embed] });
	},
} satisfies Command;
