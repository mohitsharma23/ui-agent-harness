import { GoogleGenAI, FinishReason } from "@google/genai";

const GEMINI_INPUT_TOKEN_COST_PER_1M = 0.75;
const GEMINI_OUTPUT_TOKEN_COST_PER_1M = 3.75;

type StopReason = "END_TURN" | "MAX_TOKENS" | "TOOL_USE" | "ERROR" | "UNKNOWN";

interface LLMOptions {
  max_tokens: number;
  messages: { role: "user" | "assistant"; content: string }[];
  model: string;
}

interface LLMResponse {
  reply: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  cost: number;
  stop_reason: StopReason;
}

interface LLM {
  complete: (options: LLMOptions) => Promise<LLMResponse>;
}

export class FakeLLM implements LLM {
  async complete(options: LLMOptions): Promise<LLMResponse> {
    const mockTokenCount = options.messages.reduce(
      (acc, msg) => acc + msg.content.split(" ").length,
      0,
    );

    const mockReply: string = "This is a fake response from the LLM.";

    const fullWords = mockReply.split(" ");
    const fullWordCount = fullWords.length;
    const outWords = fullWords.slice(0, options.max_tokens);
    const truncatedReply = outWords.join(" ");

    const mockCost = (mockTokenCount * 4 + outWords.length * 20) / 1000000;

    const isMaxTokensExceeded = fullWordCount > options.max_tokens;

    return {
      reply: truncatedReply,
      usage: {
        input_tokens: mockTokenCount,
        output_tokens: outWords.length,
      },
      cost: mockCost,
      stop_reason: isMaxTokensExceeded ? "MAX_TOKENS" : "END_TURN",
    };
  }
}

export class GeminiLLM implements LLM {
  readonly client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async complete(options: LLMOptions): Promise<LLMResponse> {
    const response = await this.client.models.generateContent({
      model: options.model,
      config: {
        maxOutputTokens: options.max_tokens,
      },
      contents: options.messages
        .map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        }))
        .join("\n"),
    });

    if (!response?.text) {
      throw new Error("Failed to generate content");
    }

    const promptTokenCount = response.usageMetadata?.promptTokenCount || 0;
    const totalTokenCount =
      (response.usageMetadata?.candidatesTokenCount || 0) +
      (response.usageMetadata?.thoughtsTokenCount || 0);
    const cost =
      (promptTokenCount * GEMINI_INPUT_TOKEN_COST_PER_1M +
        totalTokenCount * GEMINI_OUTPUT_TOKEN_COST_PER_1M) /
      1000000;

    const finishReason =
      (response.candidates?.[0]?.finishReason as StopReason) || "UNKNOWN";

    return {
      reply: response.text,
      usage: {
        input_tokens: promptTokenCount,
        output_tokens: totalTokenCount,
      },
      cost: cost,
      stop_reason: finishReason,
    };
  }
}
