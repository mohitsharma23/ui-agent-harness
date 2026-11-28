type StopReason = "end_turn" | "max_tokens" | "tool_use";

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
      stop_reason: isMaxTokensExceeded ? "max_tokens" : "end_turn",
    };
  }
}
