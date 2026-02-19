import fs from "fs";
import yaml from "js-yaml";

export function loadAgent(agentName) {
  try {
    const path = `./agents/${agentName}`;
    const file = fs.readFileSync(path, "utf8");
    const data = yaml.load(file);
    return data;
  } catch (e) {
    console.error("Error loading agent:", e.message);
    return null;
  }
}
