type StopReason = "end_turn" | "max_tokens" | "tool_use";

interface LLMOptions {
  max_tokens: number;
  messages: { role: "user" | "assistant"; content: string }[];
  model: string;
}

interface LLM {
  complete: (options: LLMOptions) => Promise<{
    reply: string;
    usage: any;
    cost: number;
    stop_reason: StopReason;
  }>;
}

export class FakeLLM implements LLM {
  async complete(options: LLMOptions): Promise<{
    reply: string;
    usage: any;
    cost: number;
    stop_reason: StopReason;
  }> {
    const mockTokenCount = options.messages.reduce(
      (acc, msg) => acc + msg.content.split(" ").length,
      0,
    );

    const mockReply: string = "This is a fake response from the LLM.";

    const mockCompletionTokens = mockReply.split(" ").length;
    const totalTokens = mockTokenCount + mockCompletionTokens;
    const mockCost = (mockTokenCount * 4 + mockCompletionTokens * 20) / 1000000;

    const isMaxTokensExceeded = mockCompletionTokens > options.max_tokens;
    const truncatedReply = mockReply
      .split(" ")
      .slice(0, options.max_tokens)
      .join(" ");

    return {
      reply: isMaxTokensExceeded ? truncatedReply : mockReply,
      usage: {
        prompt_tokens: mockTokenCount,
        completion_tokens: isMaxTokensExceeded
          ? truncatedReply.split(" ").length
          : mockCompletionTokens,
        total_tokens: isMaxTokensExceeded
          ? mockTokenCount + truncatedReply.split(" ").length
          : totalTokens,
      },
      cost: isMaxTokensExceeded
        ? (mockTokenCount * 4 + truncatedReply.split(" ").length * 20) / 1000000
        : mockCost,
      stop_reason: isMaxTokensExceeded ? "max_tokens" : "end_turn",
    };
  }
}
