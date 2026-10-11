import { fetch } from "undici";
import { throwIfMissing } from "./utils.js";

async function setup() {
  throwIfMissing(process.env, [
    "DISCORD_PUBLIC_KEY",
    "DISCORD_APPLICATION_ID",
    "DISCORD_TOKEN",
  ]);

  const registerApi =
    `https://discord.com/api/v10/applications/` +
    `${process.env.DISCORD_APPLICATION_ID}/commands`;

  const commands = [
    {
      name: "ping",
      description: "Check if the bot is alive",
    },

    {
      name: "hello",
      description: "Say hello to the bot",
    },

    {
      name: "server",
      description: "Show basic server information",
    },

    {
      name: "avatar",
      description: "Show a user's avatar",
    },
  ];

  for (const command of commands) {
    console.log(`Registering /${command.name}...`);

    const response = await fetch(registerApi, {
      method: "POST",

      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const error = await response.text();

      throw new Error(`Failed to register /${command.name}: ${error}`);
    }

    console.log(`✅ /${command.name} registered`);
  }

  console.log("🎉 All commands registered successfully!");
}

setup().catch((error) => {
  console.error(error);
  process.exit(1);
});
