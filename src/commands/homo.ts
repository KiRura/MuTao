import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
} from "discord.js";
import homo from "../lib/homo/homo";
import type { Command } from ".";

export default {
	data: {
		type: ApplicationCommandType.ChatInput,
		name: "homo",
		description: "114514!",
		options: [
			{
				type: ApplicationCommandOptionType.Number,
				name: "number",
				description: "number",
				description_localizations: {
					ja: "数字",
				},
			},
		],
	},
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		const num = interaction.options.getNumber("number") ?? 114514;

		const res: string = homo(num);

		await interaction.reply({
			embeds: [
				{
					title: "114514!!!",
					description: `${num}\n↓\n\`${res}\`\n↓\n${Function(`return (${res});`)()}`,
				},
			],
		});
	},
} satisfies Command;
