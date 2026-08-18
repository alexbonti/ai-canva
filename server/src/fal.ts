import { fal } from "@fal-ai/client";

let _configured = false;

function ensureConfigured() {
  if (_configured) return;
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error("FAL_KEY is not configured. Add it to server/.env");
  fal.config({ credentials: falKey });
  _configured = true;
}

/**
 * Uploads a base64 data URL to fal.ai storage and returns a fetchable URL.
 * The cartoonify model requires a real URL, not a data URL.
 */
async function uploadImageToFal(dataUrl: string): Promise<string> {
  ensureConfigured();
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL format");
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const blob = new Blob([buffer], { type: contentType });
  const url = await fal.storage.upload(blob);
  return url;
}

function extractImageUrl(result: any): string {
  const image = result?.data?.images?.[0] || result?.data?.image || result?.images?.[0] || result?.image;
  if (!image?.url) throw new Error("fal.ai returned no image in the response");
  return image.url;
}

/**
 * Generates a cartoon profile picture.
 * - If imageUrl is provided: uploads to fal storage, then uses fal-ai/cartoonify (image-to-image)
 * - If no imageUrl: uses fal-ai/flux/schnell (text-to-image fallback)
 */
export async function generateCartoonImage(params: {
  prompt: string;
  imageUrl?: string;
}): Promise<string> {
  ensureConfigured();

  let imageUrl = params.imageUrl;

  // Data URLs must be uploaded to fal storage first
  if (imageUrl && imageUrl.startsWith("data:")) {
    imageUrl = await uploadImageToFal(imageUrl);
  }

  if (imageUrl) {
    const result = await fal.subscribe("fal-ai/cartoonify", {
      input: {
        image_url: imageUrl,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: true,
      },
    });
    return extractImageUrl(result);
  } else {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: params.prompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        enable_safety_checker: true,
      },
    });
    return extractImageUrl(result);
  }
}
