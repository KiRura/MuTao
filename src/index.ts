import process from "node:process";
import { URL } from "node:url";
import { Client, GatewayIntentBits } from "discord.js";
import { loadEvents } from "./util/loaders.ts";

Bun.serve({
	port: 8000,
	fetch() {
		return new Response("Hello!");
	},
});

setInterval(
	() => {
		fetch("https://informal-sianna-kirura-4839e326.koyeb.app");
	},
	10 * 1000 * 60,
);

// Initialize the client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Load the events and commands
const events = await loadEvents(new URL("events/", import.meta.url));

// Register the event handlers
for (const event of events) {
	client[event.once ? "once" : "on"](event.name, async (...args) => {
		try {
			await event.execute(...args);
		} catch (error) {
			console.error(`Error executing event ${String(event.name)}:`, error);
		}
	});
}

// Login to the client
void client.login(process.env.DISCORD_TOKEN);
