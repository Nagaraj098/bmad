import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import { loadAgent } from "./agentLoader.js";

dotenv.config();

// ✅ Load All Agents
const analystAgent = loadAgent("analyst.agent.yaml");
const architectAgent = loadAgent("architect.agent.yaml");
const devAgent = loadAgent("dev.agent.yaml");
const pmAgent = loadAgent("pm.agent.yaml");

console.log("Agents Loaded:");
console.log("1 -", analystAgent.agent.metadata.name);
console.log("2 -", architectAgent.agent.metadata.name);
console.log("3 -", devAgent.agent.metadata.name);
console.log("4 -", pmAgent.agent.metadata.name);

// ✅ Create OpenRouter client
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ✅ Build system prompt dynamically
function buildSystemPrompt(agent) {
  let prompt = "";

  if (agent.agent.persona.identity)
    prompt += agent.agent.persona.identity + "\n\n";

  if (agent.agent.persona.communication_style)
    prompt += agent.agent.persona.communication_style + "\n\n";

  if (agent.agent.persona.principles)
    prompt += agent.agent.persona.principles + "\n\n";

  if (agent.agent.critical_actions) {
    prompt += "Critical Actions:\n";
    agent.agent.critical_actions.forEach((action) => {
      prompt += "- " + action + "\n";
    });
  }

  return prompt.trim();
}

async function askUser(question = "\nYou: ") {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function run() {
  console.log("\nBMAD Multi-Agent System Started.");
  console.log("Type 'exit' anytime to stop.\n");

  // ✅ Agent Selection
  const choice = await askUser(
    "Choose agent:\n" +
    "1 = Analyst Mary 📊\n" +
    "2 = Architect Winston 🏗️\n" +
    "3 = Developer Amelia 💻\n" +
    "4 = Product Manager John 📋\n\n" +
    "Selection: "
  );

  let selectedAgent;

  switch (choice) {
    case "2":
      selectedAgent = architectAgent;
      console.log("\n🏗️ Architect Winston Activated.\n");
      break;

    case "3":
      selectedAgent = devAgent;
      console.log("\n💻 Developer Amelia Activated.\n");
      break;

    case "4":
      selectedAgent = pmAgent;
      console.log("\n📋 Product Manager John Activated.\n");
      break;

    default:
      selectedAgent = analystAgent;
      console.log("\n📊 Analyst Mary Activated.\n");
  }

  // ✅ Initialize conversation with selected agent persona
  const messages = [
    {
      role: "system",
      content: buildSystemPrompt(selectedAgent),
    },
  ];

  // ✅ Chat Loop
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
