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
    >
      <SandpackPreviewView
        style={{ height }}
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
      />
    </SandpackProvider>
  );
}
