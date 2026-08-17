/**
 * fal.ai integration for image generation.
 * Uses the REST API directly (no SDK dependency).
 *
 * Two modes:
 * - image-to-image: uses fal-ai/cartoonify to transform an uploaded image into cartoon style
 * - text-to-image: uses fal-ai/flux-1/schnell as a fallback to generate from a text prompt
 */

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

/**
 * Calls a fal.ai model and returns the generated image URL.
 * Reads FAL_KEY lazily (after dotenv has loaded .env).
 */
async function callFalModel(
  modelId: string,
  input: Record<string, unknown>
): Promise<string> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error(
      "FAL_KEY is not configured. Add it to server/.env"
    );
  }

  const url = `${FAL_BASE}/${modelId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`fal.ai ${modelId} returned ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await response.json()) as FalResponse;

  // Handle both "images" array and single "image" output formats
  const image = data.images?.[0] || data.image;
  if (!image || !image.url) {
    throw new Error("fal.ai returned no image in the response");
  }

  return image.url;
}

/**
 * Generates a cartoon profile picture.
 *
 * - If imageUrl is provided (image-to-image): uses fal-ai/cartoonify
 *   to transform the uploaded image into cartoon style.
 * - If no imageUrl (text-to-image fallback): uses fal-ai/flux-1/schnell
 *   to generate a cartoon profile from the text prompt.
 */
export async function generateCartoonImage(params: {
  prompt: string;
  imageUrl?: string;
}): Promise<string> {
  if (params.imageUrl) {
    // Image-to-image: cartoonify the uploaded image
    return callFalModel("fal-ai/cartoonify", {
      image_url: params.imageUrl,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      enable_safety_checker: true,
    });
  } else {
    // Text-to-image: generate from prompt using Flux Schnell
    return callFalModel("fal-ai/flux-1/schnell", {
      prompt: params.prompt,
      image_size: "square_hd",
      num_inference_steps: 4,
      enable_safety_checker: true,
    });
  }
}