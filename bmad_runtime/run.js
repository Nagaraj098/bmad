import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import { loadAgent } from "./agentLoader.js";

dotenv.config();

// ✅ Load Agents
const analystAgent = loadAgent("analyst.agent.yaml");
const architectAgent = loadAgent("architect.agent.yaml");

console.log("Agents Loaded:");
console.log("1 -", analystAgent.agent.metadata.name);
console.log("2 -", architectAgent.agent.metadata.name);

// ✅ Create OpenRouter client
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ✅ Helper: Build system prompt dynamically
function buildSystemPrompt(agent) {
  return (
    agent.agent.persona.identity +
    "\n\n" +
    agent.agent.persona.communication_style +
    "\n\n" +
    agent.agent.persona.principles
  );
}

async function askUser(question = "\nYou: ") {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function run() {
  console.log("\nBMAD Multi-Agent System Started.");
  console.log("Type 'exit' anytime to stop.\n");

  // ✅ Agent selection
  const choice = await askUser(
    "Choose agent (1 = Analyst Mary, 2 = Architect Winston): "
  );

  let selectedAgent;

  if (choice === "2") {
    selectedAgent = architectAgent;
    console.log("\n🏗️ Architect Winston Activated.\n");
  } else {
    selectedAgent = analystAgent;
    console.log("\n📊 Analyst Mary Activated.\n");
  }

  // ✅ Initialize message history with selected agent persona
  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(selectedAgent),
    },
  ];

  // ✅ Chat loop
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
