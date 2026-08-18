const FAL_BASE = "https://fal.run";

interface FalImageOutput {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

interface FalResponse {
  images?: FalImageOutput[];
  image?: FalImageOutput;
  error?: { type: string; message: string };
}

async function callFalModel(modelId: string, input: Record<string, unknown>): Promise<string> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) { throw new Error("FAL_KEY is not configured."); }
  const url = `${FAL_BASE}/${modelId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`fal.ai ${modelId} returned ${response.status}: ${errText.slice(0, 300)}`);
  }
  const data = (await response.json()) as FalResponse;
  const image = data.images?.[0] || data.image;
  if (!image || !image.url) { throw new Error("fal.ai returned no image."); }
  return image.url;
}

export async function generateCartoonImage(params: { prompt: string; imageUrl?: string }): Promise<string> {
  if (params.imageUrl) {
    return callFalModel("fal-ai/cartoonify", {
      image_url: params.imageUrl,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    });
  } else {
    return callFalModel("fal-ai/flux-1/schnell", {
      prompt: params.prompt,
      image_size: "square_hd",
      num_inference_steps: 4,
      enable_safety_checker: true,
    });
  }
}