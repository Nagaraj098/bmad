import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import fs from "fs";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// 🔹 Load analyze.md as system prompt
const analyzePrompt = fs.readFileSync(
  "../_bmad/workflows/food-order-system/steps/analyze.md",
  "utf-8"
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// const messages = [
//   {
//     role: "system",
//     content: analyzePrompt
//   }
// ];
const messages = [
  {
    role: "system",
    content: `
You are a BMAD multi‑domain analyst agent.

Your job is to perform requirement elicitation for ANY system the user describes.

Follow this process:

1. Identify the domain automatically (e.g., e‑commerce, healthcare, booking, fintech, logistics, etc).
2. Ask structured clarifying questions covering:
   - Target users
   - Business goals
   - Core features
   - Platform (web/mobile/API)
   - Data requirements
   - Integrations
   - Constraints
   - Scale expectations
3. Continue asking until requirements are clear.
4. Keep conversation interactive like a discovery interview.
5. Do NOT assume details — always ask.
`
  }
];


async function askUser() {
  return new Promise(resolve => {
    rl.question("\nYou: ", resolve);
  });
}

async function run() {
  console.log("BMAD Agent started (using workflow). Type 'exit' to stop.\n");

  while (true) {
    const userInput = await askUser();

    if (userInput.toLowerCase() === "exit") {
      rl.close();
      break;
    }

    messages.push({ role: "user", content: userInput });

    try {
      const response = await client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages
      });

      const reply = response.choices[0].message.content;

      console.log("\nAgent:", reply);

      messages.push({ role: "assistant", content: reply });

    } catch (err) {
      console.error("Error:", err.message);
    }
  }
}

run();
