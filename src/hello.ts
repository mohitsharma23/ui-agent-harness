// import Anthropic from "@anthropic-ai/sdk";
import { FakeLLM } from "./llm";

const client = new FakeLLM();

const message = await client.complete({
  max_tokens: 5,
  messages: [{ role: "user", content: "Hello, Claude" }],
  model: "claude-opus-5-5",
});

console.log("Reply:", message.reply);
console.log("Usage:", message.usage);
console.log("Cost:", message.cost);
console.log("Stop Reason:", message.stop_reason);
