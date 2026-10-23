// npm install backboard-sdk
import { dirname, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { BackboardClient } from "backboard-sdk";

loadEnvFile(resolve(dirname(fileURLToPath(import.meta.url)), ".env"));

const apiKey = process.env.BACKBOARD_API_KEY;
if (!apiKey) {
  throw new Error("BACKBOARD_API_KEY is missing. Set it in .env or the environment.");
}

export const client = new BackboardClient({
  apiKey,
});

async function main() {
  // Send a message — thread and assistant are auto-created
  const response = await client.sendMessage({
    content: "Hello! I'm excited to get started.",
    memory: "Auto",
  });
  console.log(response.content);

  // Continue the conversation using the returned threadId
  const followUp = await client.sendMessage({
    content: "What can you help me with?",
    threadId: response.threadId,
  });
  console.log(followUp.content);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
