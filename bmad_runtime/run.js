import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import { loadAgent } from "./agentLoader.js";

dotenv.config();

// ✅ Load Analyst agent from local agents folder
const analystAgent = loadAgent("analyst.agent.yaml");

console.log("Analyst Agent Loaded:");
console.log(analystAgent);

// ✅ Create OpenRouter client
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ✅ Use REAL analyst persona instead of hardcoded prompt
const messages = [
  {
    role: "system",
    content:
      analystAgent.agent.persona.identity +
      "\n\n" +
      analystAgent.agent.persona.communication_style +
      "\n\n" +
      analystAgent.agent.persona.principles,
  },
];


async function askUser() {
  return new Promise((resolve) => {
    rl.question("\nYou: ", resolve);
  });
}

async function run() {
  console.log("BMAD Analyst Agent started. Type 'exit' to stop.\n");

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
        messages,
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
