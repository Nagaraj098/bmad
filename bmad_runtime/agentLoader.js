import fs from "fs";
import yaml from "js-yaml";

export function loadAgent(agentPath) {
  try {
    const file = fs.readFileSync(agentPath, "utf8");
    const data = yaml.load(file);
    return data;
  } catch (e) {
    console.error("Error loading agent:", e.message);
    return null;
  }
}

// ✅ Test loading analyst agent
const analyst = loadAgent(
  "D:/Internship/github/Bmad/BMAD-METHOD/src/bmm/agents/analyst.agent.yaml"
);

console.log("Loaded analyst agent:");
console.log(analyst);
