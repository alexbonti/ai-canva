import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateContent } from "./ollama.js";

/** Builds a streamed /api/chat response: one JSON object per NDJSON line. */
const streamResponse = (chunks: Array<Record<string, any>>, trailingNewline = true) =>
  new Response(
    chunks.map((c) => JSON.stringify(c)).join("\n") +
      (trailingNewline ? "\n" : ""),
    { status: 200, headers: { "Content-Type": "application/x-ndjson" } }
  );

// generateContent reads env lazily and calls the global fetch.
describe("generateContent", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.OLLAMA_HOST = "https://ollama.example";
    process.env.OLLAMA_API_KEY = "test-key";
    delete process.env.OLLAMA_MODEL;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("accumulates the streamed reply and parses token counts", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse([
        { model: "deepseek-v4-flash", message: { content: "Hello" } },
        { model: "deepseek-v4-flash", message: { content: "!" } },
        {
          model: "deepseek-v4-flash",
          message: { content: "" },
          done: true,
          prompt_eval_count: 42,
          eval_count: 7,
          done_reason: "stop",
        },
      ])
    );

    const result = await generateContent("sys", "user input");
    expect(result).toEqual({
      content: "Hello!",
      model: "deepseek-v4-flash",
      promptTokens: 42,
      completionTokens: 7,
      totalTokens: 49,
      truncated: false,
    });
  });

  it("uses the configured host, model and bearer auth, and streams", async () => {
    process.env.OLLAMA_MODEL = "custom-model";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        streamResponse([{ message: { content: "ok" }, done: true }])
      );
    globalThis.fetch = fetchMock as any;

    await generateContent("sys", "hi");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ollama.example/api/chat");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key"
    );
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("custom-model");
    // Streaming: a non-streamed long generation dies at ~60s with "fetch failed".
    expect(body.stream).toBe(true);
    // 32768: UI/Code replies run 5-20k tokens and used to be cut off at 8192/16384.
    expect(body.options.num_predict).toBe(32_768);
  });

  it("parses a final NDJSON line that lacks a trailing newline", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse(
        [
          { message: { content: "a" } },
          { message: { content: "b" }, done: true, eval_count: 2 },
        ],
        false
      )
    );

    const result = await generateContent("sys", "hi");
    expect(result.content).toBe("ab");
    expect(result.completionTokens).toBe(2);
  });

  it("flags a reply that stopped on the output limit as truncated", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse([
        { message: { content: "function App() { return <div>" } },
        {
          message: { content: "" },
          done: true,
          prompt_eval_count: 100,
          eval_count: 32_768,
          done_reason: "length",
        },
      ])
    );

    const result = await generateContent("sys", "design a page");
    expect(result.truncated).toBe(true);
  });

  it("falls back to the token count when the provider omits done_reason", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse([
        { message: { content: "partial" } },
        { message: { content: "" }, done: true, prompt_eval_count: 10, eval_count: 32_768 },
      ])
    );

    const result = await generateContent("sys", "hello");
    expect(result.truncated).toBe(true);
  });

  it("does not flag a natural stop as truncated", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse([
        { message: { content: "done" } },
        {
          message: { content: "" },
          done: true,
          prompt_eval_count: 100,
          eval_count: 9_000,
          done_reason: "stop",
        },
      ])
    );

    const result = await generateContent("sys", "hello");
    expect(result.truncated).toBe(false);
  });

  it("throws a descriptive error when Ollama returns a non-OK status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    });

    await expect(generateContent("sys", "hi")).rejects.toThrow(
      /Ollama request failed \(429\)/
    );
  });

  it("throws when the stream contains no content", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse([{ message: { content: "" }, done: true }])
    );

    await expect(generateContent("sys", "hi")).rejects.toThrow(
      "Ollama returned no content"
    );
  });

  it("throws the provider error carried in a stream chunk", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      streamResponse([{ error: "model overloaded" }])
    );

    await expect(generateContent("sys", "hi")).rejects.toThrow(
      "model overloaded"
    );
  });
});
