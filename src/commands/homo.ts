import { homo } from "@evex/h0mo";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
} from "discord.js";
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
		const res = homo(num);

		if (!res.success) {
			await interaction.reply({
				embeds: [
					{
						title: "(この数字を臭くできないなんて)やりませんねぇ...",
						description: `${num}\n↓\n失敗`,
					},
				],
			});

			return;
		}

		const calcRes = Function(`return (${res.result});`)();

		await interaction.reply({
			embeds: [
				{
					title: "114514!!!",
					description: `${num}\n↓\n\`${res.result}\`\n↓\n${calcRes}${num !== calcRes ? "\n-# (JavaScriptに正確性なんて)ないです" : ""}`,
				},
			],
		});
	},
} satisfies Command;
