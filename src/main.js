import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from "discord-interactions";

import { throwIfMissing } from "./utils.js";

export default async ({ req, res, error, log }) => {
  // Check required environment variables
  throwIfMissing(process.env, [
    "DISCORD_PUBLIC_KEY",
    "DISCORD_APPLICATION_ID",
    "DISCORD_TOKEN",
  ]);

  // Verify that the request came from Discord
  const isValidRequest = verifyKey(
    req.bodyBinary,
    req.headers["x-signature-ed25519"],
    req.headers["x-signature-timestamp"],
    process.env.DISCORD_PUBLIC_KEY,
  );

  if (!isValidRequest) {
    error("Invalid Discord request signature");

    return res.json(
      {
        error: "Invalid request signature",
      },
      401,
    );
  }

  log("Valid Discord request");

  const interaction = req.body;

  // Discord uses PING when verifying the interaction endpoint
  if (interaction.type === InteractionType.PING) {
    log("Received Discord PING");

    return res.json(
      {
        type: InteractionResponseType.PONG,
      },
      200,
    );
  }

  // We only care about slash commands
  if (interaction.type !== InteractionType.APPLICATION_COMMAND) {
    return res.json(
      {
        type: InteractionResponseType.PONG,
      },
      200,
    );
  }

  const commandName = interaction.data.name;

  log(`Received command: /${commandName}`);

  switch (commandName) {
    case "ping":
      return handlePing(res);

    case "hello":
      return handleHello(interaction, res);

    case "server":
      return handleServer(interaction, res);

    case "avatar":
      return handleAvatar(interaction, res);

    default:
      log(`Unknown command: ${commandName}`);

      return res.json(
        {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "❌ Unknown command.",
          },
        },
        200,
      );
  }
};

/**
 * /ping
 */
function handlePing(res) {
  return res.json(
    {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "🏓 Pong! The bot is alive.",
      },
    },
    200,
  );
}

/**
 * /hello
 */
function handleHello(interaction, res) {
  const username =
    interaction.member?.user?.username || interaction.user?.username || "there";

  return res.json(
    {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `👋 Hello, **${username}**! Welcome to the server.`,
      },
    },
    200,
  );
}

/**
 * /server
 */
function handleServer(interaction, res) {
  const guildId = interaction.guild_id;
  const channelId = interaction.channel_id;

  return res.json(
    {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content:
          `📊 **Server Information**\n\n` +
          `**Server ID:** \`${guildId}\`\n` +
          `**Channel ID:** \`${channelId}\``,
      },
    },
    200,
  );
}

/**
 * /avatar
 */
function handleAvatar(interaction, res) {
  const user = interaction.member?.user || interaction.user;

  if (!user) {
    return res.json(
      {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ Unable to find your Discord user.",
        },
      },
      200,
    );
  }

  let avatarUrl;

  if (user.avatar) {
    avatarUrl =
      `https://cdn.discordapp.com/avatars/` +
      `${user.id}/${user.avatar}.png?size=1024`;
  } else {
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/0.png`;
  }

  return res.json(
    {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `🖼️ **${user.username}'s Avatar**\n${avatarUrl}`,
      },
    },
    200,
  );
}
