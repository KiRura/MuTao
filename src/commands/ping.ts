import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
} from "discord.js";
import type { Command } from "./index.ts";
import ping from "ping";

export default {
	data: {
		type: ApplicationCommandType.ChatInput,
		name: "ping",
		description: "Ping!",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "target",
				name_localizations: {
					ja: "送信先",
				},
				description: "ping target",
				description_localizations: {
					ja: "pingの送信先",
				},
				required: true,
			},
		],
	},
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const target = interaction.options.getString("target", true);
		const res = await ping.promise.probe(target);

		await interaction.reply(`Pong!: ${res.time} ms\n-# by ${res.host}`);
	},
} satisfies Command;

// wtf is this error

// 36 |     // XXX: Assume there is at least 3 '=' can be found
// 37 |     var count = (line.match(/=/g) || []).length;
// 38 |     if (count >= 3) {
// 39 |         var regExp = /([0-9.]+)[ ]*ms/;
// 40 |         var match = regExp.exec(line);
// 41 |         this._times.push(parseFloat(match[1], 10));
//                                          ^
// TypeError: null is not an object (evaluating 'match[1]')
//       at <anonymous> (/home/kirura_arch/MuTao/node_modules/ping/lib/parser/mac.js:41:37)
//       at <anonymous> (/home/kirura_arch/MuTao/node_modules/ping/lib/parser/linux.js:49:38)
//       at <anonymous> (/home/kirura_arch/MuTao/node_modules/ping/lib/parser/base.js:131:14)
//       at forEach (1:11)
//       at <anonymous> (/home/kirura_arch/MuTao/node_modules/ping/lib/ping-promise.js:79:19)
//       at emit (node:events:98:22)
//       at #maybeClose (node:child_process:746:16)
//       at #handleOnExit (node:child_process:520:72)

// Bun v1.2.17 (Linux x64)
