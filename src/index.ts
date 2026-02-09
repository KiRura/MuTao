import process from "node:process";
import { URL } from "node:url";
import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import { loadEvents } from "./util/loaders.ts";

dotenv.config();

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

const app = express();
app.get("/", (_, res) => res.send("this is mu~~~tao"));

app.listen(3000, () => console.log(`Listening: http://localhost:3000`));
