import { SandpackProvider, SandpackPreview as SandpackPreviewView } from "@codesandbox/sandpack-react";
import { toSandpackFiles } from "../lib/project.js";

interface SandpackPreviewProps {
  code: string;
  height?: string;
}

/**
 * Runs the generated code as a real React project in the browser using
 * Sandpack (CodeSandbox's in-browser bundler). Supports real imports and npm
 * dependencies, with a live preview that updates as the code changes.
 */
export default function SandpackPreview({ code, height = "100%" }: SandpackPreviewProps) {
  return (
    <SandpackProvider
      template="react"
      files={toSandpackFiles(code)}
      theme="dark"
      options={{ autoReload: true, externalResources: [] }}
      // Sandpack only sizes the inner preview to 100% of its wrapper; without
      // giving the provider root a height it collapses to a small default and
      // the app is clipped to the top of the box. Propagate the requested height.
      style={{ height }}
    >
      <SandpackPreviewView
        style={{ height }}
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
      />
    </SandpackProvider>
  );
}
