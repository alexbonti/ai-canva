import Anthropic from "@anthropic-ai/sdk";

// Create the Anthropic client lazily.
// We must NOT read process.env.ANTHROPIC_API_KEY at module load time
// because ES module imports are hoisted — claude.ts gets imported
// before dotenv.config() runs in index.ts. By deferring client creation
// to the first API call, dotenv has already loaded .env by then.
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to server/.env and restart the server."
    );
  }

  _client = new Anthropic({ apiKey });
  return _client;
}

/**
 * Calls Claude with a user prompt and returns the text response.
 * Uses Claude Sonnet 4 for a good balance of quality and speed.
 */
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

  // Extract text from response content blocks
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("");

  return text;
}