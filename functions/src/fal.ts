import { fal } from "@fal-ai/client";

let _configured = false;

function ensureConfigured() {
  if (_configured) return;
  const falKey = process.env.FAL_KEY;
  if (!falKey) throw new Error("FAL_KEY is not configured.");
  fal.config({ credentials: falKey });
  _configured = true;
}

async function uploadImageToFal(dataUrl: string): Promise<string> {
  ensureConfigured();
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL format");
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const blob = new Blob([buffer], { type: contentType });
  return await fal.storage.upload(blob);
}

function extractImageUrl(result: any): string {
  const image = result?.data?.images?.[0] || result?.data?.image || result?.images?.[0] || result?.image;
  if (!image?.url) throw new Error("fal.ai returned no image.");
  return image.url;
}

export async function generateCartoonImage(params: { prompt: string; imageUrl?: string }): Promise<string> {
  ensureConfigured();
  let imageUrl = params.imageUrl;
  if (imageUrl && imageUrl.startsWith("data:")) {
    imageUrl = await uploadImageToFal(imageUrl);
  }
  if (imageUrl) {
    const result = await fal.subscribe("fal-ai/qwen-image-edit", {
      input: { prompt: params.prompt, image_url: imageUrl, num_inference_steps: 30, guidance_scale: 4, enable_safety_checker: true },
    });
    return extractImageUrl(result);
  } else {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: { prompt: params.prompt, image_size: "square_hd", num_inference_steps: 4, enable_safety_checker: true },
    });
    return extractImageUrl(result);
  }
}
