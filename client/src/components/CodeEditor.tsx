import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { html } from "@codemirror/lang-html";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  /**
   * Syntax highlighting. The UI Design box now builds plain HTML, so it asks for
   * "html"; Code and Stitch-style JSX keep the JavaScript/JSX grammar.
   */
  language?: "javascript" | "html";
}

/**
 * A lightweight, embeddable code editor (CodeMirror 6) with JSX syntax
 * highlighting and a VS Code dark theme. Used by the Code / UI / Stitch boxes
 * to let users edit generated code in place.
 */
export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  height = "100%",
  language = "javascript",
}: CodeEditorProps) {
  return (
    <div className="h-full overflow-hidden rounded-sm border border-pine bg-pine-deep">
      <CodeMirror
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        height={height}
        theme={vscodeDark}
        extensions={[language === "html" ? html() : javascript({ jsx: true })]}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: !readOnly,
          highlightActiveLineGutter: !readOnly,
        }}
        style={{ fontSize: "12px", height: "100%" }}
      />
    </div>
  );
}
