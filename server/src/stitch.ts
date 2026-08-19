import { stitch } from "@google/stitch-sdk";

let _projectId: string | null = null;

/**
 * Generates a UI screen from a text prompt using Google Stitch.
 * Returns the HTML content and a screenshot URL.
 */
export async function generateStitchUI(
  prompt: string
): Promise<{ html: string; imageUrl: string }> {
  const apiKey = process.env.STITCH_API_KEY;
  if (!apiKey) {
    throw new Error("STITCH_API_KEY is not configured.");
  }

  // Create or reuse a project
  if (!_projectId) {
    const project = await stitch.createProject("AI Canva");
    _projectId = project.id;
  }

  const project = stitch.project(_projectId);
  const screen = await project.generate(prompt);

  // Get the HTML download URL and fetch the actual HTML content
  const htmlUrl = await screen.getHtml();
  const imageUrl = await screen.getImage();

  // Fetch the HTML content from the download URL
  const htmlResponse = await fetch(htmlUrl);
  if (!htmlResponse.ok) {
    throw new Error("Failed to fetch Stitch HTML: " + htmlResponse.status);
  }
  const html = await htmlResponse.text();

  return { html, imageUrl };
}