// import Anthropic from "@anthropic-ai/sdk";
import { FakeLLM, GeminiLLM } from "./llm";

const client = new GeminiLLM();

const message = await client.complete({
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Gemini" }],
  model: "gemini-3.8-flash",
});

console.log("Reply:", message.reply);
console.log("Usage:", message.usage);
console.log("Cost:", message.cost);
console.log("Stop Reason:", message.stop_reason);
