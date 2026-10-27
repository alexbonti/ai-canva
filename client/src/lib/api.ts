const API_BASE = "/api";

/**
 * `fetch` with a hard deadline.
 *
 * Every AI call used to be a bare `fetch`: a hung model/backend left the box in
 * `status: "running"` forever, and `runBox` refuses to start a run on a running
 * box — so the box died until the page was reloaded (and, before load-time
 * normalization, forever). A timeout turns that into an ordinary error the box
 * can display and the user can retry.
 */
async function apiFetch(
  url: string,
  opts: { timeoutMs: number; timeoutMessage: string } & RequestInit = {
    timeoutMs: 60_000,
    timeoutMessage: "The request timed out.",
  }
): Promise<Response> {
  const { timeoutMs, timeoutMessage, ...init } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    const aborted =
      err?.name === "AbortError" || /abort/i.test(String(err?.message || ""));
    if (aborted) throw new Error(timeoutMessage);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export interface GenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  /**
   * Provider reasoning toggle. `false` disables the model's "thinking" — used by
   * the UI Design box, whose two small steps (brief + simple HTML page) do not
   * need reasoning and get much faster without it. Omitted = provider default.
   */
  think?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateResponse {
  content: string;
  model?: string;
  usage?: TokenUsage;
  /** The provider hit its output cap — the reply is cut off mid-artifact. */
  truncated?: boolean;
  error?: string;
}

/**
 * Calls the backend to generate text content via the Ollama backend.
 *
 * `opts.timeoutMs` — long-form artifacts (UI Design / Code) can take 2-3
 * minutes because they emit up to 8-11k tokens; give them a bigger deadline
 * than a normal text box.
 */
export async function generate(
  req: GenerateRequest,
  opts: { timeoutMs?: number; timeoutMessage?: string } = {}
): Promise<GenerateResponse> {
  const timeoutMs = opts.timeoutMs ?? 120_000;
  const res = await apiFetch(`${API_BASE}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    timeoutMs,
    timeoutMessage:
      opts.timeoutMessage ??
      "The model did not answer within 2 minutes. Check your connection and run the box again.",
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
  const res = await apiFetch(`${API_BASE}/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    timeoutMs: 180_000,
    timeoutMessage:
      "Image generation did not finish within 3 minutes. Run the box again.",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface StitchResponse {
  html: string;
  imageUrl: string;
  error?: string;
}

interface StitchJobResponse {
  jobId?: string;
  status: "queued" | "running" | "done" | "error";
  html?: string | null;
  imageUrl?: string | null;
  error?: string | null;
}

/**
 * Starts an asynchronous Stitch UI generation job.
 *
 * Stitch generation is slow (40s+), so the server returns immediately with a
 * job id and runs the work in the background. Callers then poll
 * `pollStitchJob` until it reports "done" or "error".
 */
export async function startStitchJob(prompt: string): Promise<string> {
  const res = await apiFetch(`${API_BASE}/stitch-generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    timeoutMs: 30_000,
    timeoutMessage: "Could not start the Stitch job — the backend did not answer.",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as StitchJobResponse;
  if (!data.jobId) {
    throw new Error("Stitch did not return a job id.");
  }
  return data.jobId;
}

/**
 * Polls a Stitch job until it completes (done) or fails (error), returning the
 * generated HTML and screenshot URL. Throws on error or timeout.
 *
 * @param jobId - The job id returned by `startStitchJob`.
 * @param opts - Optional poll interval ms and max wait ms.
 */
export async function pollStitchJob(
  jobId: string,
  opts: { intervalMs?: number; maxWaitMs?: number } = {}
): Promise<StitchResponse> {
  const intervalMs = opts.intervalMs ?? 2000;
  const maxWaitMs = opts.maxWaitMs ?? 10 * 60 * 1000; // 10 min safety ceiling
  const deadline = Date.now() + maxWaitMs;

  for (;;) {
    const status = await readStitchJob(jobId);
    if (status.status === "done") {
      if (!status.html) throw new Error("Stitch finished but returned no HTML.");
      return { html: status.html, imageUrl: status.imageUrl || "" };
    }
    if (status.status === "error") {
      throw new Error(status.error || "Stitch UI generation failed.");
    }
    if (Date.now() > deadline) {
      throw new Error("Stitch UI generation timed out.");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

async function readStitchJob(jobId: string): Promise<StitchJobResponse> {
  const res = await apiFetch(
    `${API_BASE}/stitch-status/${encodeURIComponent(jobId)}`,
    {
      timeoutMs: 20_000,
      timeoutMessage: "Could not read the Stitch job status.",
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Backwards-compatible single call: start a job and wait for it to finish. */
export async function generateStitchUI(
  prompt: string
): Promise<StitchResponse> {
  const jobId = await startStitchJob(prompt);
  return pollStitchJob(jobId);
}

export async function checkHealth(): Promise<{
  status: string;
  ollamaKey: string;
  falKey: string;
}> {
  const res = await apiFetch(`${API_BASE}/health`, {
    timeoutMs: 10_000,
    timeoutMessage: "The health check timed out.",
  });
  return res.json();
}

/** One file the backend read, in structured form (used by Code Edit). */
export interface RepoFileContent {
  path: string;
  content: string;
  /** True when the content was clipped — such a file must not be rewritten. */
  clipped: boolean;
}

/** What the backend read from a repository (see server/src/repo.ts). */
export interface RepoDigestResponse {
  ok?: boolean;
  repo: string;
  branch: string;
  /** The rendered digest (file tree + selected file contents) for the prompt. */
  digest: string;
  files: number;
  treeEntries: number;
  chars: number;
  truncated: boolean;
  notes: string[];
  /** The same contents in structured form. */
  contents: RepoFileContent[];
  /** Requested paths (whole-file mode) that could not be read. */
  missing: string[];
}

/**
 * Asks the backend for a repository digest (the Code Map box).
 *
 * The server does the GitHub access — the browser never calls GitHub directly,
 * so a server-side `GITHUB_TOKEN` (when configured) can unlock private
 * repositories without the token ever reaching the client.
 */
export async function fetchRepoDigest(repoUrl: string, paths?: string[]): Promise<RepoDigestResponse> {
  const res = await apiFetch(`${API_BASE}/repo-digest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paths && paths.length > 0 ? { repoUrl, paths } : { repoUrl }),
    timeoutMs: 90_000,
    timeoutMessage:
      "Reading the repository took longer than 90 seconds — try a smaller repository or retry.",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
/** One file published to a here.now Site. */
export interface DeployFilePayload {
  path: string;
  content: string;
}

/** What a here.now deploy returns (see server/src/herenow.ts). */
export interface DeployResponse {
  ok?: boolean;
  slug: string;
  siteUrl: string;
  /** Live version id — pass it back as `baseVersionId` to update safely. */
  versionId: string;
  unchanged: boolean;
  anonymous: boolean;
  /** ISO timestamp for an anonymous Site ("" when permanent). */
  expiresAt: string;
  /** Anonymous-only, returned ONCE — losing it means losing update access. */
  claimToken: string;
  claimUrl: string;
  warnings: string[];
  fileCount: number;
  bytes: number;
}

/**
 * Publishes files to a live here.now URL (the box deploy button).
 *
 * The backend does the publishing — the API key (when configured) stays
 * server-side. Without a key the Site is anonymous: it expires in 24 hours and
 * the returned claim token is the only way to update it afterwards.
 */
export async function publishSite(req: {
  files: DeployFilePayload[];
  slug?: string;
  claimToken?: string;
  baseVersionId?: string;
  displayName?: string;
  displayDescription?: string;
}): Promise<DeployResponse> {
  const res = await apiFetch(`${API_BASE}/herenow-deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    timeoutMs: 120_000,
    timeoutMessage:
      "Publishing did not finish within 2 minutes. The live site may still be updating — check the site link before retrying.",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
