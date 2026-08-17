const API_BASE = "/api";

export interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
}

export interface GenerateResponse {
  content: string;
  error?: string;
}

/**
 * Calls the backend to generate text content via Claude.
 */
export async function generate(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface GenerateImageRequest {
  prompt: string;
  imageUrl?: string;
}

export interface GenerateImageResponse {
  imageUrl: string;
  error?: string;
}

/**
 * Calls the backend to generate a cartoon profile image via fal.ai.
 * If imageUrl is provided, uses image-to-image (cartoonify).
 * Otherwise, uses text-to-image (flux schnell) as fallback.
 */
export async function generateImage(
  req: GenerateImageRequest
): Promise<GenerateImageResponse> {
  const res = await fetch(`${API_BASE}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<{
  status: string;
  anthropicKey: string;
  falKey: string;
}> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}