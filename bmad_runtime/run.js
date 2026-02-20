import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import { loadAgent } from "./agentLoader.js";

dotenv.config();

// ✅ Load All Agents
const agents = {
  "1": loadAgent("analyst.agent.yaml"),
  "2": loadAgent("architect.agent.yaml"),
  "3": loadAgent("dev.agent.yaml"),
  "4": loadAgent("pm.agent.yaml"),
  "5": loadAgent("qa.agent.yaml"),
  "6": loadAgent("quick-flow-solo-dev.agent.yaml"),
  "7": loadAgent("sm.agent.yaml"),
  "8": loadAgent("ux-designer.agent.yaml"),
};

console.log("Agents Loaded:");
Object.entries(agents).forEach(([key, agent]) => {
  console.log(`${key} - ${agent.agent.metadata.name}`);
});

// ✅ Create OpenRouter client
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// ✅ Build system prompt
function buildSystemPrompt(agent) {
  let prompt = "";

  if (agent.agent.persona.identity)
    prompt += agent.agent.persona.identity + "\n\n";

  if (agent.agent.persona.communication_style)
    prompt += agent.agent.persona.communication_style + "\n\n";

  if (agent.agent.persona.principles)
    prompt += Array.isArray(agent.agent.persona.principles)
      ? agent.agent.persona.principles.join("\n")
      : agent.agent.persona.principles;

  prompt += "\n\n";

  if (agent.agent.critical_actions) {
    prompt += "Critical Actions:\n";
    agent.agent.critical_actions.forEach((action) => {
      prompt += "- " + action + "\n";
    });
    prompt += "\n";
  }

  if (agent.agent.prompts) {
    const welcome = agent.agent.prompts.find(p => p.id === "welcome");
    if (welcome) prompt += welcome.content + "\n";
  }

  return prompt.trim();
}

async function askUser(question = "\nYou: ") {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function chooseAgent() {
  console.log("\nChoose agent:");
  Object.entries(agents).forEach(([key, agent]) => {
    console.log(`${key} = ${agent.agent.metadata.name}`);
  });

  const choice = await askUser("Selection: ");
  return agents[choice] || agents["1"]; // default to Analyst
}

async function run() {
  console.log("\nBMAD Multi-Agent System Started.");
  console.log("Type 'exit' to stop.");
  console.log("Type '/switch' to change agent.\n");

  let selectedAgent = await chooseAgent();
  console.log(`\n${selectedAgent.agent.metadata.title} Activated.\n`);

  let messages = [
    {
      role: "system",
      content: buildSystemPrompt(selectedAgent),
    },
  ];

  while (true) {
    const userInput = await askUser();

    if (userInput.toLowerCase() === "exit") {
      rl.close();
      break;
    }

    // 🔁 Switch agent dynamically
    if (userInput.toLowerCase() === "/switch") {
      selectedAgent = await chooseAgent();
      console.log(`\n${selectedAgent.agent.metadata.title} Activated.\n`);

      // Reset conversation when switching
      messages = [
        {
          role: "system",
          content: buildSystemPrompt(selectedAgent),
        },
      ];

      continue;
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