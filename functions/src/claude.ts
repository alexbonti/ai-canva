import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export async function generateContent(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => { if (block.type === "text") return block.text; return ""; })
    .join("");
  return text;
}