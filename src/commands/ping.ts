import { ping } from "@network-utils/tcp-ping";
import {
	type APIEmbed,
	type APIEmbedField,
	ApplicationCommandType,
	type JSONEncodable,
} from "discord.js";
import type { Command } from ".";

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
			{ name: "ping one.one.one.one", value: "Pinging...", inline: true },
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

		const pingRes = await ping({ address: "one.one.one.one", attempts: 1 });
		const errors = pingRes.errors
			.map((error) => `${error.error.name}\n${error.error.message}`)
			.join("\n\n");

		if (fields[1] && fields[2]) {
			fields[1].value = `${endpointLatency} ms`;
			fields[2].value = `${pingRes.averageLatency.toFixed(2)} ms${pingRes.errors.length ? `\n\n\`\`\`\n${errors}\`\`\`` : ""}`;
		}

		await interaction.editReply({ embeds: [embed] });
	},
} satisfies Command;
